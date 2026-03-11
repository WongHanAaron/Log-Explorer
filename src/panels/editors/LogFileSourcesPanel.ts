import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';
import { ConfigStore, ConfigCategory } from '../../services/config-store';
import { logger } from '../../utils/logger';
import { isLogMessage } from '../../utils/logMessage';
import { FilepathConfig } from '../../domain/filepath-config';
import { ConfigSaver } from '../../services/config-saver';
import type {
    FilepathConfigSaveMessage,
    FilepathConfigValidateNameMessage
} from '../../webview/messages';

const FILEPATH_CONFIGS_SUBDIR = '.logex/filepath-configs';

export class LogFileSourcesPanel {
    public static readonly viewType = 'logexplorer.logFileSources';
    private static currentPanel: LogFileSourcesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _configDirUri: vscode.Uri;
    private readonly _store: ConfigStore;
    private readonly _shortName?: string;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        configDirUri: vscode.Uri,
        shortName?: string,
        workspaceRoot?: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._configDirUri = configDirUri;
        this._store = new ConfigStore(workspaceRoot!);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview);

        this._panel.webview.onDidReceiveMessage(
            (msg: unknown) => this._handleMessage(msg),
            null,
            this._disposables
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // store desired config name for later load
        this._shortName = shortName;

        // listen for store changes and forward updated name lists
        this._disposables.push(
            this._store.subscribeConfigAdded(ConfigCategory.Filepath, async () => {
                const names = await this._store.listConfigNames(ConfigCategory.Filepath);
                this._panel.webview.postMessage({ type: 'configListChanged', configs: names });
            }) as any /* vscode.Disposable */
        );

    }

    public static createOrShow(extensionUri: vscode.Uri, shortName?: string): void {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage('Log Explorer: No workspace folder is open.');
            return;
        }

        const workspaceRoot = folders[0].uri;
        const configDirUri = vscode.Uri.joinPath(workspaceRoot, FILEPATH_CONFIGS_SUBDIR);

        if (LogFileSourcesPanel.currentPanel) {
            LogFileSourcesPanel.currentPanel._panel.reveal();
            LogFileSourcesPanel.currentPanel._sendLoad(shortName);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            LogFileSourcesPanel.viewType,
            'Log Filepath Config',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        LogFileSourcesPanel.currentPanel = new LogFileSourcesPanel(
            panel,
            extensionUri,
            configDirUri,
            shortName,
            workspaceRoot
        );
    }

    public dispose(): void {
        LogFileSourcesPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }

    // ── HTML generation ───────────────────────────────────────────────────────

    private _getWebviewContent(webview: vscode.Webview): string {
        // Delegate to shared helper used by the other React panels
        return getReactWebviewHtml(webview, this._extensionUri, 'log-file-sources.js', 'Log Filepath Config');
    }

    // ── Message flow ──────────────────────────────────────────────────────────

    private async _sendLoad(shortName?: string): Promise<void> {
        // wrapper kept for backward compatibility but now delegates to init
        await this._sendInit(shortName);
    }

    private async _sendInit(shortName?: string): Promise<void> {
        // fetch current list and optional config
        const names = await this._store.listConfigNames(ConfigCategory.Filepath);
        let current: any = null;
        let error: string | undefined;
        let isNew = true;
        const name = shortName ?? this._shortName;
        if (name) {
            try {
                const configObj = await this._store.getConfig(ConfigCategory.Filepath, name);
                const json = configObj.toJson();
                try {
                    current = JSON.parse(json);
                } catch {
                    current = json;
                }
                isNew = false;
            } catch (err: any) {
                // capture error so webview can show it
                error = err && err.message ? String(err.message) : String(err);
            }
        }
        this._panel.webview.postMessage({ type: 'init', configs: names, current, error });
    }

    private async _handleMessage(msg: unknown): Promise<void> {
        if (!msg || typeof msg !== 'object') { return; }
        const m = msg as { type: string };

        switch (m.type) {
            case 'log': {
                if (isLogMessage(msg)) {
                    logger.log(msg.level, msg.text, msg.scope);
                }
                break;
            }
            case 'ready': {
                // webview has loaded; send initial data
                this._sendInit();
                break;
            }
            case 'selectConfig': {
                const { name } = msg as { name: string };
                try {
                    const configObj = await this._store.getConfig(ConfigCategory.Filepath, name);
                    const json = configObj.toJson();
                    // send plain object rather than JSON string
                    let plain: any;
                    try {
                        plain = JSON.parse(json);
                    } catch {
                        plain = json;
                    }
                    this._panel.webview.postMessage({ type: 'configData', config: plain });
                } catch (err: any) {
                    const message = err && err.message ? String(err.message) : String(err);
                    this._panel.webview.postMessage({ type: 'configData', config: null, error: message });
                }
                break;
            }
            case 'filepath-config:save': {
                const { config } = msg as FilepathConfigSaveMessage;
                const resultMsg = await ConfigSaver.save(
                    config,
                    FilepathConfig,
                    this._store,
                    ConfigCategory.Filepath,
                    this._configDirUri,
                    'filepath-config:save-result'
                );
                this._panel.webview.postMessage(resultMsg);
                break;
            }
            case 'filepath-config:validate-name': {
                const { shortName } = msg as FilepathConfigValidateNameMessage;
                const exists = await this._store.configExists(ConfigCategory.Filepath, shortName);
                this._panel.webview.postMessage({ type: 'filepath-config:name-available', available: !exists });
                break;
            }
            case 'filepath-config:cancel':
                this.dispose();
                break;
        }
    }
}

