import * as assert from 'assert';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigStore, ConfigCategory } from '../../src/services/config-store';
import { ConfigSaver } from '../../src/panels/editors/ConfigSaver';
import { FilepathConfig } from '../../src/domain/filepath-config';
import { FileLogLineConfig } from '../../src/domain/filelog-config';

class DummyPanel {
    public messages: any[] = [];
    public webview = {
        postMessage: (m: any) => { this.messages.push(m); return Promise.resolve(true); }
    };
}

describe('ConfigSaver', () => {
    let tmpFolder: vscode.Uri;
    let store: ConfigStore;

    beforeEach(async () => {
        const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'logex-test-'));
        tmpFolder = vscode.Uri.file(tmpDir);
        vscode.workspace.updateWorkspaceFolders(0, vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, { uri: tmpFolder });
        store = new ConfigStore(tmpFolder);
    });

    it('successfully saves a filepath config object and reports success', async () => {
        const panel = new DummyPanel() as unknown as vscode.WebviewPanel;
        const cfg = new FilepathConfig();
        cfg.shortName = 'foo';
        cfg.pathPattern = '/var/log/foo';

        await ConfigSaver.save(cfg, FilepathConfig, store, ConfigCategory.Filepath, vscode.Uri.joinPath(tmpFolder, '.logex', 'filepath-configs'), panel, 'fp-res');
        // verify store wrote file
        const names = await store.listConfigNames(ConfigCategory.Filepath);
        assert.deepStrictEqual(names, ['foo']);
        assert.deepStrictEqual(panel.messages, [{ type: 'fp-res', success: true }]);
    });

    it('propagates validation errors back to panel', async () => {
        const panel = new DummyPanel() as unknown as vscode.WebviewPanel;
        // invalid because shortName missing
        const raw = { pathPattern: 'x' };
        await ConfigSaver.save(raw as any, FilepathConfig, store, ConfigCategory.Filepath, vscode.Uri.joinPath(tmpFolder, '.logex', 'filepath-configs'), panel, 'fp-res');
        assert.strictEqual(panel.messages.length, 1);
        const msg = panel.messages[0];
        assert.strictEqual(msg.type, 'fp-res');
        assert.strictEqual(msg.success, false);
        assert.ok(typeof msg.errorMessage === 'string' && msg.errorMessage.length > 0);
    });

    it('works with filelog config class as well', async () => {
        const panel = new DummyPanel() as unknown as vscode.WebviewPanel;
        const cfg = new FileLogLineConfig();
        cfg.shortName = 'bar';
        cfg.type = 'text';
        cfg.textFields = [];

        await ConfigSaver.save(cfg, FileLogLineConfig, store, ConfigCategory.Filelog, vscode.Uri.joinPath(tmpFolder, '.logex', 'filelog-configs'), panel, 'fl-res');
        const names = await store.listConfigNames(ConfigCategory.Filelog);
        assert.deepStrictEqual(names, ['bar']);
        assert.deepStrictEqual(panel.messages, [{ type: 'fl-res', success: true }]);
    });
});
