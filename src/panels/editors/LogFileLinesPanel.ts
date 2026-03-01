import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

export class LogFileLinesPanel {
    public static readonly viewType = 'logexplorer.logFileLines';
    private static currentPanel: LogFileLinesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.webview.html = getStubWebviewHtml(
            'Log File Lines',
            'Log line parsing configuration will appear here.',
            this._panel.webview.cspSource
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        if (LogFileLinesPanel.currentPanel) {
            LogFileLinesPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            LogFileLinesPanel.viewType,
            'Log File Lines',
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        LogFileLinesPanel.currentPanel = new LogFileLinesPanel(panel);
    }

    public dispose(): void {
        LogFileLinesPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
