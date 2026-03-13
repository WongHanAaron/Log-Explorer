import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';
import { ConfigStore, ConfigCategory } from '../../services/config-store.ts';
import { logger } from '../../utils/logger.ts';
import { isLogMessage } from '../../utils/logMessage';
import { FileAccessConfig } from '../../domain/config/fileaccess-config';
import { ConfigSaver } from '../../services/config-saver';
import { formatConfigLoadError } from '../../utils/errorUtils';
import type {
    FileAccessConfigSaveMessage,
    FileAccessConfigValidateNameMessage,
    FileAccessConfigDeleteMessage,
} from '../../webview/messages';

const FILEACCESS_CONFIGS_SUBDIR = '.logex/fileaccess-configs';

export class FileAccessConfigsPanel {
    public static readonly viewType = 'logexplorer.fileAccessConfigs';
    private static currentPanel: FileAccessConfigsPanel | undefined;

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

        // store short name for later load
        this._shortName = shortName;

        // subscribe to config additions
        this._disposables.push(
            this._store.subscribeConfigAdded(ConfigCategory.FileAccess, async () => {
                const names = await this._store.listConfigNames(ConfigCategory.FileAccess);
                this._panel.webview.postMessage({ type: 'configListChanged', configs: names });
            }) as any
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, shortName?: string): void {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showErrorMessage('Log Explorer: No workspace folder is open.');
            return;
        }

        const workspaceRoot = folders[0].uri;
        const configDirUri = vscode.Uri.joinPath(workspaceRoot, FILEACCESS_CONFIGS_SUBDIR);

        if (FileAccessConfigsPanel.currentPanel) {
            FileAccessConfigsPanel.currentPanel._panel.reveal();
            FileAccessConfigsPanel.currentPanel._sendInit(shortName);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            FileAccessConfigsPanel.viewType,
            'File Access Configs',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true,
            }
        );

        FileAccessConfigsPanel.currentPanel = new FileAccessConfigsPanel(
            panel,
            extensionUri,
            configDirUri,
            shortName,
            workspaceRoot
        );
    }

    public dispose(): void {
        FileAccessConfigsPanel.currentPanel = undefined;
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        return getReactWebviewHtml(webview, this._extensionUri, 'file-access-configs.js', 'File Access Configs');
    }

    private async _sendInit(shortName?: string): Promise<void> {
        const names = await this._store.listConfigNames(ConfigCategory.FileAccess);
        let current: any = null;
        let error: string | undefined;
        let isNew = true;
        const name = shortName ?? this._shortName;
        if (name) {
            try {
                const configObj = await this._store.getConfig(ConfigCategory.FileAccess, name);
                const json = configObj.toJson ? configObj.toJson() : JSON.stringify(configObj);
                try {
                    current = JSON.parse(json);
                } catch {
                    current = json;
                }
                isNew = false;
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
                    const configObj = await this._store.getConfig(ConfigCategory.FileAccess, name);
                    const json = configObj.toJson ? configObj.toJson() : JSON.stringify(configObj);
                    let plain: any;
                    try { plain = JSON.parse(json); } catch { plain = json; }
                    this._panel.webview.postMessage({ type: 'configData', config: plain });
                } catch (err: any) {
                    const raw = err && err.message ? String(err.message) : String(err);
                    const message = formatConfigLoadError(raw);
                    if (message === null) {
                        this._panel.webview.postMessage({ type: 'configData', config: null });
                    } else {
                        this._panel.webview.postMessage({ type: 'configData', config: null, error: message });
                    }
                }
                break;
            }
            case 'fileaccess-config:save': {
                const { config } = msg as FileAccessConfigSaveMessage;
                const resultMsg = await ConfigSaver.save(
                    config,
                    FileAccessConfig,
                    this._store,
                    ConfigCategory.FileAccess,
                    this._configDirUri,
                    'fileaccess-config:save-result'
                );
                this._panel.webview.postMessage(resultMsg);
                break;
            }
            case 'fileaccess-config:validate-name': {
                const { shortName } = msg as FileAccessConfigValidateNameMessage;
                const exists = await this._store.configExists(ConfigCategory.FileAccess, shortName);
                this._panel.webview.postMessage({ type: 'fileaccess-config:name-available', available: !exists });
                break;
            }
            case 'fileaccess-config:delete': {
                const { shortName } = msg as FileAccessConfigDeleteMessage;
                try {
                    await this._store.deleteConfig(ConfigCategory.FileAccess, shortName);
                    this._panel.webview.postMessage({ type: 'fileaccess-config:save-result', success: true });
                } catch (err: any) {
                    this._panel.webview.postMessage({ type: 'fileaccess-config:save-result', success: false, errorMessage: err.message });
                }
                break;
            }
            case 'fileaccess-config:cancel':
                this.dispose();
                break;
        }
    }
}

// -----------------------------------------------------------------------------
// helpers exported for unit testing
// -----------------------------------------------------------------------------

import { sanitizeConfigError as _sanitizeConfigError } from '../../utils/errorUtils';

// re-export under same name for backwards compatibility
export const sanitizeConfigError = _sanitizeConfigError;
