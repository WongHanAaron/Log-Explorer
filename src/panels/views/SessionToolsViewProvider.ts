import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';

export class SessionToolsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'logexplorer.sessionTools';

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = getReactWebviewHtml(
            webviewView.webview, this._extensionUri, 'session-tools.js', 'Session Tools'
        );
    }
}
