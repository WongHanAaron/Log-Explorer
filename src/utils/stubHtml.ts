import { getNonce } from './nonce';

/**
 * Returns a complete, nonce-gated HTML document for use as a stub webview.
 * Uses VS Code CSS variables for consistent theming across all stub panels and views.
 *
 * @param title     - Heading text displayed in the webview
 * @param message   - Placeholder paragraph text
 * @param cspSource - Value of `webview.cspSource` for the Content Security Policy
 */
export function getStubWebviewHtml(title: string, message: string, cspSource: string): string {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>${title}</title>
    <style>
        body {
            padding: 16px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        h2 {
            font-weight: 600;
            margin-bottom: 8px;
        }
        p {
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h2>${title}</h2>
    <p>${message}</p>
    <script nonce="${nonce}">
        // stub — no behaviour yet
    </script>
</body>
</html>`;
}
