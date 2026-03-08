import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';
import { loadTemplates, createTemplate } from '../../workspace/sessionTemplates';
import { loadRecentSessions, createSession } from '../../workspace/sessions';
import { ConfigStore, ConfigCategory } from '../../services/config-store';
import { logger } from '../../utils/logger';
import { isLogMessage } from '../../utils/logMessage';

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
            case 'log': {
                if (isLogMessage(message)) {
                    logger.log(message.level, message.text, message.scope);
                }
                break;
            }
            case 'ready': {
                if (!workspaceRoot) {
                    this._postMessage({ type: 'init', templates: [], recentSessions: [], fileConfigs: [], logConfigs: [] });
                    return;
                }
                try {
                    const store = new ConfigStore(workspaceRoot);
                    const [templates, recentSessions, fileConfigs, logConfigs] = await Promise.all([
                        loadTemplates(workspaceRoot),
                        loadRecentSessions(workspaceRoot),
                        store.listConfigNames(ConfigCategory.Filepath),
                        store.listConfigNames(ConfigCategory.Filelog),
                    ]);
                    this._postMessage({ type: 'init', templates, recentSessions, fileConfigs, logConfigs });
                } catch {
                    this._postMessage({ type: 'init', templates: [], recentSessions: [], fileConfigs: [], logConfigs: [] });
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
            case 'saveSessionTemplate': {
                if (!workspaceRoot) {
                    this._postMessage({ type: 'sessionError', message: 'No workspace folder is open.' });
                    return;
                }
                try {
                    const payload = message.payload as Omit<import('../../workspace/sessionTemplates').SessionTemplate, 'id'>;
                    const tpl = await createTemplate(workspaceRoot, payload);
                    this._postMessage({ type: 'templateSaved', template: tpl });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Failed to save template.';
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
        return getReactWebviewHtml(webview, this._extensionUri, 'new-session.js', 'New Session');
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
