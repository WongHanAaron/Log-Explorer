import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigStore, ConfigCategory } from '../../../src/services/config-store';
import { ConfigParser } from '../../../src/services/config-parser';

class FakeFs implements vscode.FileSystem {
    private files = new Map<string, Uint8Array>();
    private dirs = new Set<string>();
    // minimal event implementation; nobody listens in our tests but the property
    // is required by the type.
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
        new vscode.EventEmitter<vscode.FileChangeEvent[]>().event;

    // helpers
    private normalize(p: string) {
        return path.posix.normalize(p.replace(/\\/g, '/'));
    }

    // additional members required by vscode.FileSystem
    copy(source: vscode.Uri, target: vscode.Uri, options?: { overwrite?: boolean }): Thenable<void> {
        // no-op for tests
        return Promise.resolve();
    }
    isWritableFileSystem(scheme: string): boolean | undefined {
        // allow everything
        return true;
    }

    watch(_uri: vscode.Uri): vscode.Disposable {
        // no-op watcher
        return new vscode.Disposable(() => { });
    }

    stat(uri: vscode.Uri): Thenable<vscode.FileStat> {
        const p = this.normalize(uri.fsPath);
        if (this.files.has(p)) {
            return Promise.resolve({ type: vscode.FileType.File, ctime: 0, mtime: 0, size: this.files.get(p)!.length });
        }
        if (this.dirs.has(p)) {
            return Promise.resolve({ type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0 });
        }
        return Promise.reject(vscode.FileSystemError.FileNotFound());
    }

    readDirectory(uri: vscode.Uri): Thenable<[string, vscode.FileType][]> {
        const p = this.normalize(uri.fsPath);
        const entries = new Map<string, vscode.FileType>();
        for (const fp of this.files.keys()) {
            const dir = path.posix.dirname(fp);
            if (dir === p) {
                entries.set(path.posix.basename(fp), vscode.FileType.File);
            }
        }
        for (const dp of this.dirs) {
            const parent = path.posix.dirname(dp);
            if (parent === p) {
                entries.set(path.posix.basename(dp), vscode.FileType.Directory);
            }
        }
        return Promise.resolve(Array.from(entries));
    }

    createDirectory(uri: vscode.Uri): Thenable<void> {
        this.dirs.add(this.normalize(uri.fsPath));
        return Promise.resolve();
    }

    readFile(uri: vscode.Uri): Thenable<Uint8Array> {
        const p = this.normalize(uri.fsPath);
        const contents = this.files.get(p);
        if (!contents) {
            return Promise.reject(vscode.FileSystemError.FileNotFound());
        }
        return Promise.resolve(contents);
    }

    writeFile(uri: vscode.Uri, content: Uint8Array): Thenable<void> {
        const p = this.normalize(uri.fsPath);
        // ensure parent directory exists
        const dir = path.posix.dirname(p);
        this.dirs.add(dir);
        this.files.set(p, content);
        return Promise.resolve();
    }

    delete(uri: vscode.Uri, _options?: { recursive?: boolean }): Thenable<void> {
        const p = this.normalize(uri.fsPath);
        this.files.delete(p);
        // note: directories are not removed for simplicity
        return Promise.resolve();
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, _options?: { overwrite?: boolean }): Thenable<void> {
        const oldp = this.normalize(oldUri.fsPath);
        const newp = this.normalize(newUri.fsPath);
        const data = this.files.get(oldp);
        if (!data) {
            throw vscode.FileSystemError.FileNotFound();
        }
        this.files.delete(oldp);
        this.files.set(newp, data);
        return Promise.resolve();
    }
}

describe('ConfigStore (pure parsing)', function () {
    // ── configFilename ────────────────────────────────────────────────────────

    describe('configFilename', function () {
        it('appends .json to the short name', () => {
            assert.strictEqual(ConfigParser.configFilename('nginx-access'), 'nginx-access.json');
        });
        it('works for single-word names', () => {
            assert.strictEqual(ConfigParser.configFilename('app'), 'app.json');
        });
    });

    // ── parseFilepathConfig ───────────────────────────────────────────────────

    describe('parseFilepathConfig', function () {
        it('returns a valid FilepathConfig on valid JSON', () => {
            const json = JSON.stringify({
                shortName: 'my-log',
                label: 'My Log',
                pathPattern: '/var/log/app.log'
            });
            const cfg = ConfigParser.parseFilepathConfig(json);
            assert.strictEqual(cfg.shortName, 'my-log');
            assert.strictEqual(cfg.label, 'My Log');
            assert.strictEqual(cfg.pathPattern, '/var/log/app.log');
        });

        it('throws on malformed JSON', () => {
            assert.throws(() => ConfigParser.parseFilepathConfig('{invalid'), /malformed/i);
        });

        it('throws on valid JSON but invalid schema', () => {
            const json = JSON.stringify({ shortName: 'INVALID NAME', label: 'X', pathPattern: 'y' });
            assert.throws(() => ConfigParser.parseFilepathConfig(json), /invalid.*filepath/i);
        });

        it('preserves optional description field', () => {
            const json = JSON.stringify({
                shortName: 'app',
                label: 'App',
                pathPattern: '*.log',
                description: 'main app'
            });
            const cfg = ConfigParser.parseFilepathConfig(json);
            assert.strictEqual(cfg.description, 'main app');
        });
    });

    // ── parseFileLogLineConfig ────────────────────────────────────────────────

    describe('parseFileLogLineConfig', function () {
        it('returns TextLineConfig on valid text JSON', () => {
            const json = JSON.stringify({
                type: 'text',
                shortName: 'iis',
                label: 'IIS',
                fields: [{ name: 'ts', extraction: { kind: 'prefix-suffix', prefix: '[', suffix: ']' } }]
            });
            const cfg = ConfigParser.parseFileLogLineConfig(json);
            assert.strictEqual(cfg.type, 'text');
            assert.strictEqual(cfg.shortName, 'iis');
        });

        it('returns JsonLineConfig on valid json-type JSON', () => {
            const json = JSON.stringify({
                type: 'json',
                shortName: 'structured',
                label: 'Structured',
                fields: [{ name: 'level', jsonPath: 'level' }]
            });
            const cfg = ConfigParser.parseFileLogLineConfig(json);
            assert.strictEqual(cfg.type, 'json');
        });

        it('throws on malformed JSON', () => {
            assert.throws(() => ConfigParser.parseFileLogLineConfig('{{'), /malformed/i);
        });

        it('throws on valid JSON but invalid schema', () => {
            const json = JSON.stringify({ type: 'unknown', shortName: 'x', label: 'X', fields: [] });
            assert.throws(() => ConfigParser.parseFileLogLineConfig(json), /invalid.*filelog/i);
        });
    });


});
// ── filesystem-interaction tests ─────────────────────────────────────────

describe('ConfigStore (filesystem interactions)', function () {
    let store: ConfigStore;
    let fs: FakeFs;

    beforeEach(() => {
        fs = new FakeFs();
        const root = vscode.Uri.parse('file:///workspace');
        store = new ConfigStore(root, fs);
    });

    it('can write, list and read a filepath config', async () => {
        const cfg = { shortName: 'foo', label: 'Foo', pathPattern: '/tmp/foo.log' };
        await store.writeConfig(ConfigCategory.Filepath, 'foo', cfg);
        const names = await store.listConfigNames(ConfigCategory.Filepath);
        assert.deepStrictEqual(names, ['foo']);
        const read = await store.getConfig(ConfigCategory.Filepath, 'foo');
        assert.deepStrictEqual(read, cfg);
    });

    it('getConfig throws when the file is missing', async () => {
        await assert.rejects(
            () => store.getConfig(ConfigCategory.Filelog, 'absent'),
            /Config not found/i
        );
    });

    it('deleteConfig removes existing file and leaves others untouched', async () => {
        const cfg1 = { shortName: 'a', label: 'A', pathPattern: 'x' };
        const cfg2 = { shortName: 'b', label: 'B', pathPattern: 'y' };
        await store.writeConfig(ConfigCategory.Filepath, 'a', cfg1);
        await store.writeConfig(ConfigCategory.Filepath, 'b', cfg2);
        await store.deleteConfig(ConfigCategory.Filepath, 'a');
        const names = await store.listConfigNames(ConfigCategory.Filepath);
        assert.deepStrictEqual(names, ['b']);
    });

    it('configExists returns accurate boolean values', async () => {
        assert.strictEqual(
            await store.configExists(ConfigCategory.Filepath, 'none'),
            false
        );
        await store.writeConfig(ConfigCategory.Filepath, 'z', { shortName: 'z', label: 'Z', pathPattern: 'p' });
        assert.strictEqual(
            await store.configExists(ConfigCategory.Filepath, 'z'),
            true
        );
    });

    it('subscribers are notified when a config is written', async () => {
        let notified = false;
        store.subscribeConfigAdded(ConfigCategory.Filelog, name => {
            if (name === 'x') {
                notified = true;
            }
        });
        await store.writeConfig(ConfigCategory.Filelog, 'x', {
            type: 'text',
            shortName: 'x',
            label: 'X',
            fields: []
        } as any);
        assert.strictEqual(notified, true);
    });
});