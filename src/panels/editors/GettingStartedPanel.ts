import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

export class GettingStartedPanel {
    public static readonly viewType = 'logexplorer.gettingStarted';
    private static currentPanel: GettingStartedPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.webview.html = getStubWebviewHtml(
            'Getting Started with Log Explorer',
            'The Getting Started wizard will guide you through setting up and using Log Explorer.',
            this._panel.webview.cspSource
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

        GettingStartedPanel.currentPanel = new GettingStartedPanel(panel);
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
