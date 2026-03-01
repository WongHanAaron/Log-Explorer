import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

export class SessionTemplatesPanel {
    public static readonly viewType = 'logexplorer.sessionTemplates';
    private static currentPanel: SessionTemplatesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.webview.html = getStubWebviewHtml(
            'Session Templates',
            'Session template management will appear here.',
            this._panel.webview.cspSource
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

        SessionTemplatesPanel.currentPanel = new SessionTemplatesPanel(panel);
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
