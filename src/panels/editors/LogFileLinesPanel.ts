import * as vscode from 'vscode';
import { getLogFileLinesHtml } from './logFileLinesHtml';
import { ConfigStore, ConfigCategory } from '../../services/config-store';
import { isFileLogLineConfig } from '../../domain/filelog-config';
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
    private readonly _store: ConfigStore;
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
        this._panel.webview.html = this._buildHtml();

        this._panel.webview.onDidReceiveMessage(
            (msg: unknown) => this._handleMessage(msg),
            null,
            this._disposables
        );
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        setTimeout(() => this._sendLoad(shortName), 100);
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

    private _buildHtml(): string {
        return getLogFileLinesHtml(this._panel.webview, this._extensionUri);
    }


    // ── Message flow ──────────────────────────────────────────────────────────

    private async _sendLoad(shortName?: string): Promise<void> {
        if (shortName) {
            try {
                const config = await this._store.getConfig(ConfigCategory.Filelog, shortName);
                this._panel.webview.postMessage({ type: 'filelog-config:load', config, isNew: false });
            } catch (err) {
                vscode.window.showErrorMessage(
                    `Log Explorer: Could not load "${shortName}": ${(err as Error).message}`
                );
                this._panel.webview.postMessage({ type: 'filelog-config:load', config: null, isNew: true });
            }
        } else {
            this._panel.webview.postMessage({ type: 'filelog-config:load', config: null, isNew: true });
        }
    }

    private async _handleMessage(msg: unknown): Promise<void> {
        if (!msg || typeof msg !== 'object') { return; }
        const m = msg as { type: string };

        switch (m.type) {
            case 'filelog-config:save': {
                const { config } = msg as FilelogConfigSaveMessage;
                if (!isFileLogLineConfig(config)) {
                    this._panel.webview.postMessage({
                        type: 'filelog-config:save-result', success: false, errorMessage: 'Invalid config.'
                    });
                    return;
                }
                try {
                    // ensure directory exists
                    await vscode.workspace.fs.createDirectory(this._configDirUri);
                    await this._store.writeConfig(ConfigCategory.Filelog, config.shortName, config);
                    this._panel.webview.postMessage({ type: 'filelog-config:save-result', success: true });
                } catch (err) {
                    this._panel.webview.postMessage({
                        type: 'filelog-config:save-result', success: false,
                        errorMessage: (err as Error).message
                    });
                }
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
