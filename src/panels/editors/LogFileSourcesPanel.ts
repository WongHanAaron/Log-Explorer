import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getNonce } from '../../utils/nonce';
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

        // Delay load post until the webview has rendered.
        setTimeout(() => this._sendLoad(shortName), 100);
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

    private _buildHtml(): string {
        const nonce = getNonce();
        const webview = this._panel.webview;

        const base = path.join(this._extensionUri.fsPath, 'src', 'webview', 'filepath-editor');
        const htmlTemplate = fs.readFileSync(path.join(base, 'index.html'), 'utf-8');
        const css = fs.readFileSync(path.join(base, 'styles.css'), 'utf-8');

        let html = htmlTemplate
            .replace(/{{nonce}}/g, nonce)
            .replace('{{cspSource}}', webview.cspSource)
            .replace('{{scriptUri}}', '');

        // Inject CSS inline.
        html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);

        // Replace external script tag with inline script.
        html = html.replace(
            `<script nonce="${nonce}" src=""></script>`,
            `<script nonce="${nonce}">\n${FILEPATH_EDITOR_SCRIPT}\n</script>`
        );

        return html;
    }

    // ── Message flow ──────────────────────────────────────────────────────────

    private async _sendLoad(shortName?: string): Promise<void> {
        if (shortName) {
            try {
                const config = await this._store.getConfig(ConfigCategory.Filepath, shortName);
                this._panel.webview.postMessage({ type: 'filepath-config:load', config, isNew: false });
            } catch (err) {
                vscode.window.showErrorMessage(
                    `Log Explorer: Could not load "${shortName}": ${(err as Error).message}`
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

// ── Inline webview script ─────────────────────────────────────────────────────
// Bundled here to avoid a separate esbuild step for the editor webview.
// This is pure browser JavaScript injected into the webview at runtime.

const FILEPATH_EDITOR_SCRIPT = `
(function() {
    const vscode = acquireVsCodeApi();
    const form = document.getElementById('config-form');
    const pageTitle = document.getElementById('page-title');
    const shortNameInput = document.getElementById('shortName');
    const labelInput = document.getElementById('label');
    const pathPatternInput = document.getElementById('pathPattern');
    const descriptionInput = document.getElementById('description');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const statusBar = document.getElementById('status-bar');
    const shortNameError = document.getElementById('shortName-error');
    const labelError = document.getElementById('label-error');
    const pathPatternError = document.getElementById('pathPattern-error');

    let isNew = true;
    let originalShortName = null;
    const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    function clearErrors() {
        shortNameError.textContent = '';
        labelError.textContent = '';
        pathPatternError.textContent = '';
    }

    function validateForm() {
        clearErrors();
        let valid = true;
        const name = shortNameInput.value.trim();
        if (!name) { shortNameError.textContent = 'Short name is required.'; valid = false; }
        else if (!KEBAB_RE.test(name)) { shortNameError.textContent = 'Short name must be kebab-case.'; valid = false; }
        if (!labelInput.value.trim()) { labelError.textContent = 'Label is required.'; valid = false; }
        if (!pathPatternInput.value.trim()) { pathPatternError.textContent = 'Path / glob pattern is required.'; valid = false; }
        return valid;
    }

    shortNameInput.addEventListener('blur', function() {
        const name = shortNameInput.value.trim();
        if (!name || !KEBAB_RE.test(name)) return;
        if (isNew || name !== originalShortName) {
            vscode.postMessage({ type: 'filepath-config:validate-name', shortName: name });
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateForm()) return;
        saveBtn.disabled = true;
        setStatus('Saving\u2026', 'info');
        vscode.postMessage({
            type: 'filepath-config:save',
            config: {
                shortName: shortNameInput.value.trim(),
                label: labelInput.value.trim(),
                pathPattern: pathPatternInput.value.trim(),
                ...(descriptionInput.value.trim() ? { description: descriptionInput.value.trim() } : {})
            }
        });
    });

    cancelBtn.addEventListener('click', function() {
        vscode.postMessage({ type: 'filepath-config:cancel' });
    });

    window.addEventListener('message', function(event) {
        const msg = event.data;
        switch (msg.type) {
            case 'filepath-config:load':
                isNew = msg.isNew;
                if (msg.config) {
                    shortNameInput.value = msg.config.shortName;
                    labelInput.value = msg.config.label;
                    pathPatternInput.value = msg.config.pathPattern;
                    descriptionInput.value = msg.config.description || '';
                    originalShortName = msg.config.shortName;
                    pageTitle.textContent = 'Edit: ' + msg.config.shortName;
                    shortNameInput.readOnly = true;
                } else {
                    pageTitle.textContent = 'New Filepath Config';
                }
                break;
            case 'filepath-config:name-available':
                if (!msg.available) shortNameError.textContent = 'A config with this name already exists.';
                break;
            case 'filepath-config:save-result':
                saveBtn.disabled = false;
                if (msg.success) {
                    setStatus('Saved successfully.', 'success');
                    if (isNew) {
                        isNew = false;
                        originalShortName = shortNameInput.value.trim();
                        pageTitle.textContent = 'Edit: ' + originalShortName;
                        shortNameInput.readOnly = true;
                    }
                } else {
                    setStatus('Error: ' + (msg.errorMessage || 'Save failed.'), 'error');
                }
                break;
        }
    });

    function setStatus(text, kind) {
        statusBar.textContent = text;
        statusBar.className = 'status ' + kind;
    }
})();
`;
