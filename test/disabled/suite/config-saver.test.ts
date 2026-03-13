import * as assert from 'assert';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigStore, ConfigCategory } from '../../src/services/config-store';
import { ConfigSaver } from '../../src/services/config-saver';
import { FilepathConfig } from '../../src/domain/config/filepath-config';
import { TextLineConfig } from '../../src/domain/config/filelog-config';

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
        const cfg = new FilepathConfig();
        cfg.shortName = 'foo';
        cfg.pathPattern = '/var/log/foo';

        const result = await ConfigSaver.save(
            cfg,
            FilepathConfig,
            store,
            ConfigCategory.Filepath,
            vscode.Uri.joinPath(tmpFolder, '.logex', 'filepath-configs'),
            'fp-res'
        );
        // verify store wrote file
        const names = await store.listConfigNames(ConfigCategory.Filepath);
        assert.deepStrictEqual(names, ['foo']);
        assert.deepStrictEqual(result, { type: 'fp-res', success: true });
    });

    it('propagates validation errors back to caller', async () => {
        // invalid because shortName missing
        const raw = { pathPattern: 'x' };
        const result = await ConfigSaver.save(raw as any, FilepathConfig, store, ConfigCategory.Filepath, vscode.Uri.joinPath(tmpFolder, '.logex', 'filepath-configs'), 'fp-res');
        assert.strictEqual(result.type, 'fp-res');
        assert.strictEqual(result.success, false);
        assert.ok(typeof result.errorMessage === 'string' && result.errorMessage.length > 0);
    });

    it('works with filelog config subclass as well', async () => {
        // use concrete subclass rather than abstract base
        const cfg: any = { type: 'text', shortName: 'bar', fields: [] };

        const result = await ConfigSaver.save(cfg, TextLineConfig, store, ConfigCategory.Filelog, vscode.Uri.joinPath(tmpFolder, '.logex', 'filelog-configs'), 'fl-res');
        const names = await store.listConfigNames(ConfigCategory.Filelog);
        assert.deepStrictEqual(names, ['bar']);
        assert.deepStrictEqual(result, { type: 'fl-res', success: true });
    });
});
