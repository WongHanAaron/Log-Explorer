import * as vscode from 'vscode';

/**
 * Checks whether the `.logex` workspace folder exists and updates the
 * `logexplorer.workspaceInitialized` context key accordingly.
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
    const logexUri = vscode.Uri.joinPath(root, '.logex');

    let initialized = false;
    try {
        await vscode.workspace.fs.stat(logexUri);
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
 * Creates the `.logex` folder at the workspace root.
 * On success, syncs the context key and shows a confirmation notification.
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
    } catch {
        vscode.window.showErrorMessage('Log Explorer: Failed to initialise workspace.');
    }
}
