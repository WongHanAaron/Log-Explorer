import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

export class LogFileSourcesPanel {
    public static readonly viewType = 'logexplorer.logFileSources';
    private static currentPanel: LogFileSourcesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.webview.html = getStubWebviewHtml(
            'Log File Sources',
            'Log file source configuration will appear here.',
            this._panel.webview.cspSource
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        if (LogFileSourcesPanel.currentPanel) {
            LogFileSourcesPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            LogFileSourcesPanel.viewType,
            'Log File Sources',
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        LogFileSourcesPanel.currentPanel = new LogFileSourcesPanel(panel);
    }

    public dispose(): void {
        LogFileSourcesPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
