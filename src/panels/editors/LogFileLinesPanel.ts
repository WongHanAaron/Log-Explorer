import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';
import { ConfigStore, ConfigCategory } from '../../services/config-store';
import { logger } from '../../utils/logger';
import { isLogMessage } from '../../utils/logMessage';
import { FileLogLineConfig } from '../../domain/filelog-config';
import { ConfigSaver } from '../../services/config-saver';
import type {
    FilelogConfigSaveMessage,
    FilelogConfigTestRegexMessage,
    FilelogConfigValidateNameMessage
} from '../../webview/messages';

const FILELOG_CONFIGS_SUBDIR = '.logex/filelog-configs';

export class LogFileLinesPanel {
    public static readonly viewType = 'logexplorer.logFileLines';
    private static currentPanel: LogFileLinesPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _configDirUri: vscode.Uri;
    private readonly _store: ConfigStore; private readonly _shortName?: string; private _disposables: vscode.Disposable[] = [];

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

        this._shortName = shortName;

        // listen for store changes and forward updated name lists
        this._disposables.push(
            this._store.subscribeConfigAdded(ConfigCategory.Filelog, async () => {
                const names = await this._store.listConfigNames(ConfigCategory.Filelog);
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
        const configDirUri = vscode.Uri.joinPath(workspaceRoot, FILELOG_CONFIGS_SUBDIR);

        if (LogFileLinesPanel.currentPanel) {
            LogFileLinesPanel.currentPanel._panel.reveal();
            LogFileLinesPanel.currentPanel._sendLoad(shortName);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            LogFileLinesPanel.viewType,
            'Log File Line Config',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        LogFileLinesPanel.currentPanel = new LogFileLinesPanel(
            panel,
            extensionUri,
            configDirUri,
            shortName,
            workspaceRoot
        );
    }

    public dispose(): void {
        LogFileLinesPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }

    // ── HTML generation ───────────────────────────────────────────────────────

    private _getWebviewContent(webview: vscode.Webview): string {
        return getReactWebviewHtml(webview, this._extensionUri, 'log-file-lines.js', 'Log File Line Config');
    }


    // ── Message flow ──────────────────────────────────────────────────────────

    private async _sendLoad(shortName?: string): Promise<void> {
        await this._sendInit(shortName);
    }

    private async _sendInit(shortName?: string): Promise<void> {
        const names = await this._store.listConfigNames(ConfigCategory.Filelog);
        let current: any = null;
        let error: string | undefined;
        const name = shortName ?? this._shortName;

        if (name) {
            try {
                const configObj = await this._store.getConfig(ConfigCategory.Filelog, name);
                const json = (configObj as any).toJson ? (configObj as any).toJson() : configObj;
                try {
                    current = JSON.parse(json);
                } catch {
                    current = json;
                }
            } catch (err: any) {
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
                this._sendInit();
                break;
            }
            case 'selectConfig': {
                const { name } = msg as { name: string };
                try {
                    const configObj = await this._store.getConfig(ConfigCategory.Filelog, name);
                    const json = (configObj as any).toJson ? (configObj as any).toJson() : configObj;
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
            case 'filelog-config:save': {
                const { config } = msg as FilelogConfigSaveMessage;
                const resultMsg = await ConfigSaver.save(
                    config,
                    FileLogLineConfig,
                    this._store,
                    ConfigCategory.Filelog,
                    this._configDirUri,
                    'filelog-config:save-result'
                );
                this._panel.webview.postMessage(resultMsg);
                break;
            }
            case 'filelog-config:test-regex': {
                const { fieldIndex, pattern, sampleLine } = msg as FilelogConfigTestRegexMessage;
                try {
                    const re = new RegExp(pattern);
                    const match = re.exec(sampleLine);
                    if (match) {
                        this._panel.webview.postMessage({
                            type: 'filelog-config:regex-test-result',
                            fieldIndex,
                            matched: true,
                            groups: match.groups ?? {}
                        });
                    } else {
                        this._panel.webview.postMessage({
                            type: 'filelog-config:regex-test-result', fieldIndex, matched: false
                        });
                    }
                } catch (err) {
                    this._panel.webview.postMessage({
                        type: 'filelog-config:regex-test-result',
                        fieldIndex,
                        matched: false,
                        errorMessage: (err as Error).message
                    });
                }
                break;
            }
            case 'filelog-config:validate-name': {
                const { shortName } = msg as FilelogConfigValidateNameMessage;
                const exists = await this._store.configExists(ConfigCategory.Filelog, shortName);
                this._panel.webview.postMessage({ type: 'filelog-config:name-available', available: !exists });
                break;
            }
            case 'filelog-config:cancel':
                this.dispose();
                break;
        }
    }
}
