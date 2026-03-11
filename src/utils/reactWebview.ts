import * as vscode from 'vscode';
import { getNonce } from './nonce';

/**
 * Returns a complete, nonce-gated HTML document that bootstraps a React
 * webview.  The page mounts React into `<div id="root">` and loads:
 *   - `dist/webview/shared.css`  — Tailwind CSS (generated at build time)
 *   - `dist/webview/<bundle>.js` — the panel-specific React bundle
 *
 * @param webview      VS Code Webview instance
 * @param extensionUri Extension root URI (`context.extensionUri`)
 * @param bundle       Script filename under `dist/webview/`, e.g. `new-session.js`
 * @param title        Document `<title>` text
 */
export function getReactWebviewHtml(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    bundle: string,
    title: string
): string {
    const nonce = getNonce();
    const cspSource = webview.cspSource;

    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'dist', 'webview', bundle)
    );
    const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'shared.css')
    );

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource} data:;">
    <link rel="stylesheet" href="${stylesUri}">
    <title>${title}</title>
</head>
<body>
    <div id="root" class="h-full flex flex-col"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
