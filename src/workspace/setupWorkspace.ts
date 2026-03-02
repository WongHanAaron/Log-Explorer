import * as vscode from 'vscode';

/** Sub-directories created inside `.logex` during workspace initialisation. */
const LOGEX_SUBDIRS = ['filepath-configs', 'filelog-configs'] as const;

/**
 * Checks the state of the `.logex` workspace folder.
 *
 * The function updates two context keys used by command visibility:
 *   - `logexplorer.hasLogExplorerWorkspace`: mirrors the presence of the
 *       `.logex` folder at the workspace root.
 *   - `logexplorer.initialized`: becomes true once the check has completed and
 *       confirms that the folder (and expected sub‑directories) exists.
 *
 * Call this on activation, when the workspace folders change, and after
 * `executeSetupWorkspace()` succeeds.
 */
export async function syncWorkspaceContext(): Promise<void> {
    console.log('Syncing workspace context...');
    const folders = vscode.workspace.workspaceFolders;

    // default states when there is no workspace open
    if (!folders || folders.length === 0) {
        await vscode.commands.executeCommand('setContext', 'logexplorer.initialized', false);
        await vscode.commands.executeCommand('setContext', 'logexplorer.hasLogExplorerWorkspace', false);
        return;
    }

    const root = folders[0].uri;
    const logexUri = vscode.Uri.joinPath(root, '.logex');

    console.log('Checking for .logex at', logexUri.fsPath);
    let exists = false;
    try {
        await vscode.workspace.fs.stat(logexUri);
        exists = true;
    } catch (err) {
        // failure simply means the folder doesn't exist; show in logs for debugging
        console.error('syncWorkspaceContext: stat failed', err);
        exists = false;
    }

    // determine whether workspace is fully initialised (subdirs present)
    let initialized = false;
    if (exists) {
        try {
            for (const sub of LOGEX_SUBDIRS) {
                await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, '.logex', sub));
            }
            initialized = true;
        } catch {
            initialized = false;
        }
    }

    await vscode.commands.executeCommand('setContext', 'logexplorer.hasLogExplorerWorkspace', exists);
    await vscode.commands.executeCommand('setContext', 'logexplorer.initialized', initialized);
}

/**
 * Creates `.logex` along with the expected sub‑directories at the workspace root.
 * The operation is idempotent — existing files are left untouched.
 *
 * After creation it syncs the workspace context keys and optionally offers to
 * add `.logex/` to `.gitignore`.
 */
export async function executeSetupWorkspace(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('Log Explorer: No workspace folder is open.');
        return;
    }

    const root = folders[0].uri;

    try {
        // Create .logex/ and both subdirectories (createDirectory is idempotent).
        for (const sub of LOGEX_SUBDIRS) {
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(root, '.logex', sub)
            );
        }

        // Optionally update .gitignore.
        await maybeUpdateGitignore(root);

        await syncWorkspaceContext();
        vscode.window.showInformationMessage('Log Explorer workspace initialised.');
    } catch (err) {
        console.error('executeSetupWorkspace: error creating .logex', err);
        vscode.window.showErrorMessage('Log Explorer: Failed to initialise workspace.');
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * If `.gitignore` exists and does not already contain `.logex/`,
 * prompts the user and appends the entry if they agree.
 */
async function maybeUpdateGitignore(root: vscode.Uri): Promise<void> {
    const gitignoreUri = vscode.Uri.joinPath(root, '.gitignore');

    let content: string;
    try {
        const bytes = await vscode.workspace.fs.readFile(gitignoreUri);
        content = Buffer.from(bytes).toString('utf-8');
    } catch {
        return; // .gitignore doesn't exist — nothing to do.
    }

    if (content.includes('.logex/')) {
        return; // already excluded.
    }

    const answer = await vscode.window.showInformationMessage(
        'Add .logex/ to .gitignore?',
        'Yes',
        'No'
    );

    if (answer === 'Yes') {
        const appended = content.trimEnd() + '\n\n# Log Explorer config\n.logex/\n';
        await vscode.workspace.fs.writeFile(
            gitignoreUri,
            Buffer.from(appended, 'utf-8')
        );
    }
}

