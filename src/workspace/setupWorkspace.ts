import * as vscode from 'vscode';

/**
 * Checks whether the `.logex` workspace folder exists and updates two
 * context keys:
 *   - `logexplorer.initialized`: becomes true once the check has completed,
 *       signalling that command visibility can be evaluated.
 *   - `logexplorer.hasLogExplorerWorkspace`: mirrors the presence of the
 *       `.logex` folder at the workspace root.
 *
 * Call this on activation, when the folder set changes, and after
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

    await vscode.commands.executeCommand('setContext', 'logexplorer.hasLogExplorerWorkspace', exists);
    // mark initialization complete regardless of existence
    await vscode.commands.executeCommand('setContext', 'logexplorer.initialized', true);
}

/**
 * Creates the `.logex` folder at the workspace root.
 * On success, syncs the context keys and shows a confirmation notification.
 * On failure, shows a generic error notification without exposing internal details.
 */
export async function executeSetupWorkspace(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('Log Explorer: No workspace folder is open.');
        return;
    }

    const root = folders[0].uri;
    const logexUri = vscode.Uri.joinPath(root, '.logex');

    try {
        await vscode.workspace.fs.createDirectory(logexUri);
        await syncWorkspaceContext();
        vscode.window.showInformationMessage('Log Explorer workspace initialised.');
    } catch (err) {
        console.error('executeSetupWorkspace: error creating .logex', err);
        vscode.window.showErrorMessage('Log Explorer: Failed to initialise workspace.');
    }
}