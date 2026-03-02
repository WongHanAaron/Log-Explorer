import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';

export class GettingStartedPanel {
    public static readonly viewType = 'logexplorer.gettingStarted';
    private static currentPanel: GettingStartedPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = getReactWebviewHtml(
            this._panel.webview, extensionUri, 'getting-started.js', 'Getting Started'
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        if (GettingStartedPanel.currentPanel) {
            GettingStartedPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            GettingStartedPanel.viewType,
            'Getting Started',
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        GettingStartedPanel.currentPanel = new GettingStartedPanel(panel, extensionUri);
    }

    public dispose(): void {
        GettingStartedPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
