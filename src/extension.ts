import * as vscode from 'vscode';
import { LogExplorerPanel } from './panels/LogExplorerPanel';
import { SessionToolsViewProvider } from './panels/views/SessionToolsViewProvider';
import { LogDetailsViewProvider } from './panels/views/LogDetailsViewProvider';
import { SearchResultsViewProvider } from './panels/views/SearchResultsViewProvider';
import { syncWorkspaceContext } from './workspace/setupWorkspace';
import { registerCommands } from './commands';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('LogExplorer extension is now active!');

    // T006 — Register the existing main sidebar panel view provider
    const panelProvider = new LogExplorerPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            LogExplorerPanel.viewType,
            panelProvider
        )
    );

    // T008 — Register Session Tools sidebar view provider (US2)
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SessionToolsViewProvider.viewType,
            new SessionToolsViewProvider(context.extensionUri)
        )
    );

    // T022 — Register Log Details sidebar view provider (US6)
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            LogDetailsViewProvider.viewType,
            new LogDetailsViewProvider(context.extensionUri)
        )
    );

    // T024 — Register Search Results bottom panel view provider (US7)
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SearchResultsViewProvider.viewType,
            new SearchResultsViewProvider(context.extensionUri)
        )
    );

    // T017 — Sync workspace context BEFORE registering commands so that the
    // logexplorer.setupWorkspace `when` clause reflects the correct initial state.
    await syncWorkspaceContext();

    // T011, T014, T020, T016 — Register all commands (includes new session panels + setupWorkspace)
    registerCommands(context);
}

export function deactivate(): void {
    // Cleanup resources if needed
}
