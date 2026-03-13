import * as vscode from 'vscode';
import { logger } from '../utils/logger.ts';
import { NewSessionPanel } from '../panels/editors/NewSessionPanel';
import { LogFileSourcesPanel } from '../panels/editors/LogFileSourcesPanel';
import { LogFileLinesPanel } from '../panels/editors/LogFileLinesPanel';
import { SessionTemplatesPanel } from '../panels/editors/SessionTemplatesPanel';
import { executeSetupWorkspace } from '../workspace/setupWorkspace';
import { GettingStartedPanel } from '../panels/editors/GettingStartedPanel';

export function registerCommands(context: vscode.ExtensionContext): void {
    // T000 — existing command
    const showPanelCommand = vscode.commands.registerCommand(
        'logexplorer.showPanel',
        () => {
            vscode.commands.executeCommand('logexplorer.panel.focus');
        }
    );

    // T012 — US1 sample log command
    const testLogCommand = vscode.commands.registerCommand(
        'logexplorer.testLog',
        () => {
            logger.log('info', 'test log from command');
        }
    );

    // T014 — command to show the output channel
    const showLogCommand = vscode.commands.registerCommand(
        'logexplorer.showLog',
        () => {
            logger.show(false);
        }
    );
    // command to hide/dispose the output channel
    const hideLogCommand = vscode.commands.registerCommand(
        'logexplorer.hideLog',
        () => {
            logger.close();
        }
    );

    // T005 — US1: New Session panel
    const newSessionCommand = vscode.commands.registerCommand(
        'logexplorer.newSession',
        () => NewSessionPanel.createOrShow(context.extensionUri)
    );

    // T010 — US3: Log File Sources panel
    const editLogFileSourceConfigCommand = vscode.commands.registerCommand(
        'logexplorer.editLogFileSourceConfig',
        () => LogFileSourcesPanel.createOrShow(context.extensionUri)
    );

    // US? New command for FileAccessConfigs panel (T011)
    const editFileAccessConfigsCommand = vscode.commands.registerCommand(
        'logexplorer.editFileAccessConfigs',
        () => require('../panels/editors/FileAccessConfigsPanel').FileAccessConfigsPanel.createOrShow(context.extensionUri)
    );

    // T013 — US4: Log File Lines panel
    const editFileLogLineConfigCommand = vscode.commands.registerCommand(
        'logexplorer.editFileLogLineConfig',
        () => LogFileLinesPanel.createOrShow(context.extensionUri)
    );

    // T019 — US5: Session Templates panel
    const editSessionTemplatesCommand = vscode.commands.registerCommand(
        'logexplorer.editSessionTemplates',
        () => SessionTemplatesPanel.createOrShow(context.extensionUri)
    );

    // T016 — US8: Setup New Workspace
    const setupWorkspaceCommand = vscode.commands.registerCommand(
        'logexplorer.setupWorkspace',
        () => executeSetupWorkspace()
    );

    // Getting Started — always available
    const gettingStartedCommand = vscode.commands.registerCommand(
        'logexplorer.gettingStarted',
        () => GettingStartedPanel.createOrShow(context.extensionUri)
    );

    // Internal helper exposed for tests so they can query the last-synced
    // workspace context without reaching into the module filesystem.
    const getContextCommand = vscode.commands.registerCommand(
        'logexplorer._getWorkspaceContext',
        () => {
            const { getLastWorkspaceContext } = require('../workspace/setupWorkspace');
            return getLastWorkspaceContext();
        }
    );

    const syncContextCommand = vscode.commands.registerCommand(
        'logexplorer._syncWorkspaceContext',
        () => {
            const { syncWorkspaceContext } = require('../workspace/setupWorkspace');
            return syncWorkspaceContext();
        }
    );

    context.subscriptions.push(
        showPanelCommand,
        testLogCommand,
        showLogCommand,
        hideLogCommand,
        newSessionCommand,
        editLogFileSourceConfigCommand,
        editFileAccessConfigsCommand,
        editFileLogLineConfigCommand,
        editSessionTemplatesCommand,
        setupWorkspaceCommand,
        gettingStartedCommand,
        getContextCommand
    );
}
