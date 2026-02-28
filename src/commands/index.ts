import * as vscode from 'vscode';

export function registerCommands(context: vscode.ExtensionContext): void {
    const showPanelCommand = vscode.commands.registerCommand(
        'logexplorer.showPanel',
        () => {
            // Focus the LogExplorer panel in the sidebar
            vscode.commands.executeCommand('logexplorer.panel.focus');
        }
    );

    context.subscriptions.push(showPanelCommand);
}
