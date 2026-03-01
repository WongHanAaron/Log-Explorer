import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

export class NewSessionPanel {
    public static readonly viewType = 'logexplorer.newSession';
    private static currentPanel: NewSessionPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.webview.html = getStubWebviewHtml(
            'New Session',
            'New session configuration will appear here.',
            this._panel.webview.cspSource
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        if (NewSessionPanel.currentPanel) {
            NewSessionPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NewSessionPanel.viewType,
            'New Session',
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        NewSessionPanel.currentPanel = new NewSessionPanel(panel);
    }

    public dispose(): void {
        NewSessionPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
