import 'reflect-metadata';
import * as vscode from 'vscode';
import { LogExplorerPanel } from './panels/LogExplorerPanel';
import { SessionToolsViewProvider } from './panels/views/SessionToolsViewProvider';
import { LogDetailsViewProvider } from './panels/views/LogDetailsViewProvider';
import { SearchResultsViewProvider } from './panels/views/SearchResultsViewProvider';
import { syncWorkspaceContext } from './workspace/setupWorkspace';
import { registerCommands } from './commands';
import { ConfigStore, ConfigCategory } from './services/config-store';
import { logger } from './utils/logger';

export async function activate(context: vscode.ExtensionContext): Promise<{ ConfigStore: typeof ConfigStore; ConfigCategory: typeof ConfigCategory }> {
    logger.info('extension activated');
    logger.debug('starting activation sequence');
    console.log('LogExplorer extension is now active!');

    // ensure the context flags are reset until we evaluate the workspace
    await vscode.commands.executeCommand('setContext', 'logexplorer.initialized', false);
    await vscode.commands.executeCommand('setContext', 'logexplorer.hasLogExplorerWorkspace', false);
    logger.debug('context keys reset to false');

    // re‑sync whenever the workspace folder set changes (e.g. user opens a new folder)
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            logger.debug('workspace folders changed, resyncing context');
            // fire-and-forget, we don't need to await here
            syncWorkspaceContext().catch(err => {
                logger.error('error syncing workspace context', err);
                console.error(err);
            });
        })
    );

    // subscribe logger for disposal
    context.subscriptions.push(logger);
    logger.debug('logger subscribed for disposal');

    // watch for manual changes to the .logex folder so that context keys
    // update automatically when the user creates/deletes it or its contents
    // outside of the extension.  Without this a manual `mkdir .logex` would
    // require a window reload to make commands appear.
    const logexWatcher = vscode.workspace.createFileSystemWatcher('**/.logex');
    const logexContentsWatcher = vscode.workspace.createFileSystemWatcher('**/.logex/**');
    for (const w of [logexWatcher, logexContentsWatcher]) {
        context.subscriptions.push(w);
        w.onDidCreate(() => syncWorkspaceContext().catch(console.error));
        w.onDidChange(() => syncWorkspaceContext().catch(console.error));
        w.onDidDelete(() => syncWorkspaceContext().catch(console.error));
    }

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

    // export useful helpers for tests
    return { ConfigStore, ConfigCategory };
}

export function deactivate(): void {
    // Cleanup resources if needed
}
