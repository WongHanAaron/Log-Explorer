import * as vscode from 'vscode';
import { ConfigStore, ConfigCategory } from '../../services/config-store.ts';
import { logger } from '../../utils/logger.ts';
import { isLogMessage } from '../../utils/logMessage.ts';

/**
 * Base class that implements the common two‑column panel behaviour.  Subclasses
 * specify the config category, provide HTML content, and may extend message
 * handling via protected hooks.
 */
export abstract class GenericConfigPanel {
    protected readonly panel: vscode.WebviewPanel;
    protected readonly extensionUri: vscode.Uri;
    protected readonly configDirUri: vscode.Uri;
    protected readonly store: ConfigStore;
    protected readonly category: ConfigCategory;
    protected readonly disposables: vscode.Disposable[] = [];
    protected _shortName?: string;

    constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        configDirUri: vscode.Uri,
        category: ConfigCategory,
        shortName?: string,
        workspaceRoot?: vscode.Uri,
        store?: ConfigStore // primarily for tests
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.configDirUri = configDirUri;
        this.category = category;
        this._shortName = shortName;
        this.store = store ?? new ConfigStore(workspaceRoot!);

        this.panel.webview.html = this.getWebviewContent(this.panel.webview);

        this.panel.webview.onDidReceiveMessage(
            (msg: unknown) => void this._handleMessage(msg),
            null,
            this.disposables
        );
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // forward adds/deletes to the webview
        this.disposables.push(
            this.store.subscribeConfigAdded(this.category, async () => {
                const names = await this.store.listConfigNames(this.category);
                this.panel.webview.postMessage({ type: 'configListChanged', configs: names });
            }) as any
        );
    }

    public dispose(): void {
        this.panel.dispose();
        for (const d of this.disposables) {
            d.dispose();
        }
    }

    protected _sendInit(shortName?: string): void {
        void (async () => {
            const names = await this.store.listConfigNames(this.category);
            let current: any = null;
            let error: string | undefined;
            const name = shortName ?? this._shortName;
            if (name) {
                try {
                    const cfg = await this.store.getConfig(this.category, name);
                    const json = (cfg as any).toJson ? (cfg as any).toJson() : cfg;
                    try {
                        current = JSON.parse(json);
                    } catch {
                        current = json;
                    }
                } catch (err: any) {
                    current = null;
                    error = err && err.message ? String(err.message) : String(err);
                }
            }
            this.panel.webview.postMessage({ type: 'init', configs: names, current, error });
        })();
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
            case 'ready':
                this._sendInit();
                break;
            case 'selectConfig': {
                const { name } = msg as { name: string };
                try {
                    const cfg = await this.store.getConfig(this.category, name);
                    const json = (cfg as any).toJson ? (cfg as any).toJson() : cfg;
                    let plain: any;
                    try {
                        plain = JSON.parse(json);
                    } catch {
                        plain = json;
                    }
                    this.panel.webview.postMessage({ type: 'configData', config: plain });
                } catch (err: any) {
                    // include error message so the webview can surface it
                    const message = err && err.message ? String(err.message) : String(err);
                    this.panel.webview.postMessage({ type: 'configData', config: null, error: message });
                }
                break;
            }
            default:
                // allow subclasses to react to other messages
                if (this.onWebviewMessage) {
                    this.onWebviewMessage(m);
                }
                break;
        }
    }

    /**
     * Called when messages not handled by the base class arrive.  Subclasses
     * may override to implement custom behaviour (e.g. save operations).
     */
    protected onWebviewMessage?(msg: { type: string;[key: string]: any }): void;

    /**
     * Subclasses must implement this to provide the webview HTML.
     */
    protected abstract getWebviewContent(webview: vscode.Webview): string;
}
