import * as vscode from 'vscode';
import { getNonce } from '../../utils/nonce';
import { loadTemplates } from '../../workspace/sessionTemplates';
import { loadRecentSessions, createSession } from '../../workspace/sessions';

export class NewSessionPanel {
    public static readonly viewType = 'logexplorer.newSession';
    private static currentPanel: NewSessionPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = this._getWebviewContent(this._panel.webview);

        this._panel.webview.onDidReceiveMessage(
            (message) => this._handleMessage(message),
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        if (NewSessionPanel.currentPanel) {
            NewSessionPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NewSessionPanel.viewType,
            'New Session',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true,
            }
        );

        NewSessionPanel.currentPanel = new NewSessionPanel(panel, extensionUri);
    }

    // -------------------------------------------------------------------------
    // Message handling
    // -------------------------------------------------------------------------

    private async _handleMessage(message: { type: string;[key: string]: unknown }): Promise<void> {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;

        switch (message.type) {
            case 'ready': {
                if (!workspaceRoot) {
                    this._postMessage({ type: 'init', templates: [], recentSessions: [] });
                    return;
                }
                try {
                    const [templates, recentSessions] = await Promise.all([
                        loadTemplates(workspaceRoot),
                        loadRecentSessions(workspaceRoot),
                    ]);
                    this._postMessage({ type: 'init', templates, recentSessions });
                } catch {
                    this._postMessage({ type: 'init', templates: [], recentSessions: [] });
                }
                break;
            }

            case 'submitSession': {
                if (!workspaceRoot) {
                    this._postMessage({ type: 'sessionError', message: 'No workspace folder is open.' });
                    return;
                }
                try {
                    const payload = message.payload as Parameters<typeof createSession>[1];
                    const summary = await createSession(workspaceRoot, payload);
                    this._postMessage({ type: 'sessionCreated', session: summary });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Failed to create session.';
                    this._postMessage({ type: 'sessionError', message: msg });
                }
                break;
            }

            case 'openSession': {
                if (!workspaceRoot) {
                    this._postMessage({ type: 'sessionError', message: 'No workspace folder is open.' });
                    return;
                }
                const folderName = message.folderName as string;
                try {
                    const sessionJsonUri = vscode.Uri.joinPath(
                        workspaceRoot, '.logex', 'sessions', folderName, 'session.json'
                    );
                    const bytes = await vscode.workspace.fs.readFile(sessionJsonUri);
                    const session = JSON.parse(Buffer.from(bytes).toString('utf8'));
                    this._postMessage({ type: 'loadSession', session });
                } catch {
                    this._postMessage({ type: 'sessionError', message: 'Could not load session.' });
                }
                break;
            }
        }
    }

    private _postMessage(message: object): void {
        this._panel.webview.postMessage(message);
    }

    // -------------------------------------------------------------------------
    // HTML generation
    // -------------------------------------------------------------------------

    private _getWebviewContent(webview: vscode.Webview): string {
        const nonce = getNonce();
        const cspSource = webview.cspSource;

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'new-session.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'new-session.css')
        );

        return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource} data:;">
    <link rel="stylesheet" href="${styleUri}">
    <title>New Session</title>
</head>
<body>

    <!-- =========================================================================
         PAGE 1: Discovery
         ========================================================================= -->
    <div id="page-discovery" class="ns-page active">
        <div class="ns-page-inner">

            <h1 class="ns-page-title">New Session</h1>
            <p class="ns-page-subtitle">Choose a template or open a recent session to get started.</p>

            <div class="ns-discovery">

                <!-- Top-left: New Session Templates -->
                <div class="ns-quadrant" id="templates-panel">
                    <p class="ns-quadrant-title">New Session Templates</p>
                    <input id="template-search" type="text" placeholder="Search templates\u2026" />
                    <div id="templates-list" class="ns-list"></div>
                </div>

                <!-- Top-right: Getting Started (stub) -->
                <div class="ns-quadrant" id="getting-started-panel">
                    <p class="ns-quadrant-title">Getting Started</p>
                    <p class="empty-state">Coming soon.</p>
                </div>

                <!-- Bottom-left: Recent Sessions -->
                <div class="ns-quadrant" id="recent-sessions-panel">
                    <p class="ns-quadrant-title">Recent Sessions</p>
                    <div id="recent-sessions-list" class="ns-list"></div>
                </div>

                <!-- Bottom-right: Local Logs (stub) -->
                <div class="ns-quadrant" id="local-logs-panel">
                    <p class="ns-quadrant-title">Local Logs</p>
                    <p class="empty-state">Coming soon.</p>
                </div>

            </div>
        </div>
    </div>

    <!-- =========================================================================
         PAGE 2: Creation form
         ========================================================================= -->
    <div id="page-form" class="ns-page">
        <div class="ns-page-inner">

            <!-- Back navigation -->
            <button id="back-to-discovery" class="btn-back">&#8592; New Session</button>

            <!-- Template / page header -->
            <div class="ns-form-header">
                <h1 id="template-header-name" class="ns-page-title">New Session</h1>
                <p  id="template-header-desc" class="ns-page-subtitle"></p>
            </div>

            <div class="ns-form-body">

                <!-- Session Name (required) -->
                <div class="form-group">
                    <label class="form-label" for="session-name">
                        Session Name<span class="required-mark">*</span>
                    </label>
                    <input id="session-name" class="form-input" type="text" placeholder="e.g. prod-incident-2026-02-28" />
                </div>

                <!-- Description (optional) -->
                <div class="form-group">
                    <label class="form-label" for="session-description">Description</label>
                    <input id="session-description" class="form-input" type="text" placeholder="Optional description" />
                </div>

                <!-- Time Start -->
                <div class="form-group">
                    <label class="form-label" for="time-start">Time Start</label>
                    <input id="time-start" class="form-input" type="datetime-local" />
                </div>

                <!-- Dynamic template parameters -->
                <div id="parameters-section"></div>

                <!-- Sources -->
                <div id="sources-section">
                    <div class="sources-section-header">
                        <span class="sources-label">Sources</span>
                        <button id="add-source-btn" class="btn btn-secondary">+ Add Source</button>
                    </div>
                    <table class="sources-table">
                        <thead>
                            <tr>
                                <th class="col-type">Type</th>
                                <th class="col-source">Source Config</th>
                                <th class="col-log">Log Config</th>
                                <th class="col-remove"></th>
                            </tr>
                        </thead>
                        <tbody id="sources-tbody"></tbody>
                    </table>
                </div>

                <!-- Actions -->
                <div class="form-actions">
                    <button id="create-session-btn" class="btn btn-primary">Create Session</button>
                    <span id="form-error"></span>
                    <span id="form-success"></span>
                </div>

            </div>
        </div>
    </div>

<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    public dispose(): void {
        NewSessionPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
