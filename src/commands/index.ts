import * as vscode from 'vscode';
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

    context.subscriptions.push(
        showPanelCommand,
        newSessionCommand,
        editLogFileSourceConfigCommand,
        editFileLogLineConfigCommand,
        editSessionTemplatesCommand,
        setupWorkspaceCommand,
        gettingStartedCommand
    );
}
