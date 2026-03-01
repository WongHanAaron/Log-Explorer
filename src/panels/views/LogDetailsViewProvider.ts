import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

export class LogDetailsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'logexplorer.logDetails';

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

        webviewView.webview.html = getStubWebviewHtml(
            'Log Details',
            'Log entry details will appear here.',
            webviewView.webview.cspSource
        );
    }
}
