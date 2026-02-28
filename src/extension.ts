import * as vscode from 'vscode';
import { LogExplorerPanel } from './panels/LogExplorerPanel';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext): void {
    console.log('LogExplorer extension is now active!');

    // Register the webview view provider for the sidebar panel
    const panelProvider = new LogExplorerPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            LogExplorerPanel.viewType,
            panelProvider
        )
    );

    // Register commands
    registerCommands(context);
}

export function deactivate(): void {
    // Cleanup resources if needed
}
