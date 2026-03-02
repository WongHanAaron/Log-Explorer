import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';

export class SessionTemplatesPanel {
    public static readonly viewType = 'logexplorer.sessionTemplates';
    private static currentPanel: SessionTemplatesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = getReactWebviewHtml(
            this._panel.webview, extensionUri, 'session-templates.js', 'Session Templates'
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        if (SessionTemplatesPanel.currentPanel) {
            SessionTemplatesPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            SessionTemplatesPanel.viewType,
            'Session Templates',
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        SessionTemplatesPanel.currentPanel = new SessionTemplatesPanel(panel, extensionUri);
    }

    public dispose(): void {
        SessionTemplatesPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
