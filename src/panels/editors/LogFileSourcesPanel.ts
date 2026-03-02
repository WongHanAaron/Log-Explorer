import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';

export class LogFileSourcesPanel {
    public static readonly viewType = 'logexplorer.logFileSources';
    private static currentPanel: LogFileSourcesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = getReactWebviewHtml(
            this._panel.webview, extensionUri, 'log-file-sources.js', 'Log File Sources'
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

        LogFileSourcesPanel.currentPanel = new LogFileSourcesPanel(panel, extensionUri);
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
