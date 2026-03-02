import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';

export class SearchResultsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'logexplorer.searchResults';

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
            webviewView.webview, this._extensionUri, 'search-results.js', 'Search Results'
        );
    }
}
