import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getNonce } from '../utils/nonce';

export class LogExplorerPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'logexplorer.panel';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        try {
            webviewView.webview.html = this._getWebviewContent(webviewView.webview);
        } catch (error) {
            console.error('LogExplorer: Failed to load webview content', error);
            const nonce = getNonce();
            const scriptUri = webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
            );
            const stylesUri = webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
            );
            webviewView.webview.html = this._getFallbackContent(
                nonce, scriptUri, stylesUri, webviewView.webview.cspSource
            );
        }

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.type) {
                case 'ready':
                    // Webview is ready to receive data
                    console.log('LogExplorer webview is ready');
                    break;
            }
        });
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        const nonce = getNonce();

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
        );
        const cspSource = webview.cspSource;

        // Try to load the HTML template
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'index.html');
        let html: string;

        try {
            html = fs.readFileSync(htmlPath, 'utf-8');
        } catch {
            // Fallback if template can't be loaded
            return this._getFallbackContent(nonce, scriptUri, stylesUri, cspSource);
        }

        // Replace template placeholders
        html = html.replace(/\{\{nonce\}\}/g, nonce);
        html = html.replace(/\{\{scriptUri\}\}/g, scriptUri.toString());
        html = html.replace(/\{\{stylesUri\}\}/g, stylesUri.toString());
        html = html.replace(/\{\{cspSource\}\}/g, cspSource);

        return html;
    }

    private _getFallbackContent(
        nonce: string,
        scriptUri: vscode.Uri,
        stylesUri: vscode.Uri,
        cspSource: string
    ): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link rel="stylesheet" href="${stylesUri}">
    <title>Log Explorer</title>
</head>
<body>
    <div class="container">
        <h2>LogExplorer</h2>
        <p class="subtitle">Log analysis and exploration tool</p>
        <div class="placeholder">
            <p>Unable to load the panel content. Please try reloading the window.</p>
        </div>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}
