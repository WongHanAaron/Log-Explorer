import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getNonce } from '../../utils/nonce';
import { FILELOG_EDITOR_SCRIPT } from './logFileLinesScript';

const FILELOG_CONFIG_EDITOR_DIR = 'src/webview/filelog-editor';

export function getLogFileLinesHtml(panel: vscode.Webview, extensionUri: vscode.Uri): string {
    const nonce = getNonce();
    const webview = panel;

    const base = path.join(extensionUri.fsPath, FILELOG_CONFIG_EDITOR_DIR);
    const htmlTemplate = fs.readFileSync(path.join(base, 'index.html'), 'utf-8');
    const css = fs.readFileSync(path.join(base, 'styles.css'), 'utf-8');

    let html = htmlTemplate
        .replace(/{{nonce}}/g, nonce)
        .replace('{{cspSource}}', webview.cspSource)
        .replace('{{scriptUri}}', '');

    html = html.replace('</head>', `<style>
${css}
</style>
</head>`);
    html = html.replace(
        `<script nonce="${nonce}" src=""></script>`,
        `<script nonce="${nonce}">
${FILELOG_EDITOR_SCRIPT}
</script>`
    );
    return html;
}
