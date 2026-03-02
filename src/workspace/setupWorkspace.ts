import * as vscode from 'vscode';

/** Sub-directories created inside `.logex` during workspace initialisation. */
const LOGEX_SUBDIRS = ['filepath-configs', 'filelog-configs'] as const;

/**
 * Checks whether the `.logex` workspace folder (with both sub-directories) exists
 * and updates the `logexplorer.workspaceInitialized` context key accordingly.
 * Call this on activation and after `executeSetupWorkspace()` succeeds.
 */
export async function syncWorkspaceContext(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        await vscode.commands.executeCommand(
            'setContext',
            'logexplorer.workspaceInitialized',
            false
        );
        return;
    }

    const root = folders[0].uri;
    let initialized = false;
    try {
        // Consider the workspace initialised when both data directories exist.
        for (const sub of LOGEX_SUBDIRS) {
            await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, '.logex', sub));
        }
        initialized = true;
    } catch {
        initialized = false;
    }

    await vscode.commands.executeCommand(
        'setContext',
        'logexplorer.workspaceInitialized',
        initialized
    );
}

/**
 * Creates `.logex/filepath-configs/` and `.logex/filelog-configs/` at the workspace root.
 * The operation is idempotent — calling it on an already-initialised workspace leaves
 * existing config files untouched.
 * Offers to add `.logex/` to `.gitignore` if the file exists and does not yet contain it.
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
    } catch {
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
