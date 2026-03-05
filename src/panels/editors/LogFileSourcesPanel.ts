import * as vscode from 'vscode';
import { getReactWebviewHtml } from '../../utils/reactWebview';
import { ConfigStore, ConfigCategory } from '../../services/config-store';
import { isFilepathConfig } from '../../domain/filepath-config';
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
        // use the saved shortName parameter if none provided
        const name = shortName ?? this._shortName;
        if (name) {
            try {
                const config = await this._store.getConfig(ConfigCategory.Filepath, name);
                this._panel.webview.postMessage({ type: 'filepath-config:load', config, isNew: false });
            } catch (err) {
                vscode.window.showErrorMessage(
                    `Log Explorer: Could not load "${name}": ${(err as Error).message}`
                );
                this._panel.webview.postMessage({ type: 'filepath-config:load', config: null, isNew: true });
            }
        } else {
            this._panel.webview.postMessage({ type: 'filepath-config:load', config: null, isNew: true });
        }
    }

    private async _handleMessage(msg: unknown): Promise<void> {
        if (!msg || typeof msg !== 'object') { return; }
        const m = msg as { type: string };

        switch (m.type) {
            case 'ready': {
                // webview has loaded; send initial data
                this._sendLoad();
                break;
            }
            case 'filepath-config:save': {
                const { config } = msg as FilepathConfigSaveMessage;
                if (!isFilepathConfig(config)) {
                    this._panel.webview.postMessage({
                        type: 'filepath-config:save-result', success: false, errorMessage: 'Invalid config.'
                    });
                    return;
                }
                try {
                    // ensure directory exists
                    await vscode.workspace.fs.createDirectory(this._configDirUri);
                    await this._store.writeConfig(ConfigCategory.Filepath, config.shortName, config);
                    this._panel.webview.postMessage({ type: 'filepath-config:save-result', success: true });
                } catch (err) {
                    this._panel.webview.postMessage({
                        type: 'filepath-config:save-result', success: false,
                        errorMessage: (err as Error).message
                    });
                }
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

