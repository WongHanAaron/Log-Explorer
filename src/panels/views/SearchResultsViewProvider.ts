import * as vscode from 'vscode';
import { getStubWebviewHtml } from '../../utils/stubHtml';

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

        webviewView.webview.html = getStubWebviewHtml(
            'Search Results',
            'Log search results will appear here.',
            webviewView.webview.cspSource
        );
    }
}
