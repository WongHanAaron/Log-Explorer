// helper that can be bundled into webview scripts.  The webview side has
// access to `acquireVsCodeApi` only.
import { getVsCodeApi } from './vscodeApi';

export namespace WebViewLogger {
    type LogLevel = 'info' | 'warn' | 'error' | 'debug';

    interface LogMessage {
        type: 'log';
        level: LogLevel;
        text: string;
        scope?: string;
    }

    const vscode = typeof window !== 'undefined' ? getVsCodeApi() : undefined;

    function post(msg: LogMessage) {
        if (!vscode || typeof vscode.postMessage !== 'function') {
            // running outside of VS Code (e.g. in jest/dom) - noop
            return;
        }
        vscode.postMessage(msg);
    }

    /**
     * Send a log entry from the webview.
     * level is required; scope is optional.
     */
    export function log(text: string, level: LogLevel = 'info', scope?: string) {
        post({ type: 'log', text, level, scope });
    }
}
