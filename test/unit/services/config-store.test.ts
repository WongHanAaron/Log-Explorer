import * as assert from 'assert';
import * as path from 'path';
import * as sinon from 'sinon';
import type * as VscTypes from 'vscode';


// because there is no real `vscode` package available when running under
// mocha/ts-node, we provide a minimal runtime stub.  We keep the type-only
// import above so our fake implementation satisfies the expected interfaces.
const vscode: any = {
    FileType: { File: 1, Directory: 2 },
    FileChangeType: { Created: 1, Changed: 2, Deleted: 3 },
    Disposable: class { constructor(cb: any) { this.dispose = cb; } dispose() { } },
    EventEmitter: class {
        listeners: any[] = [];
        event(l: any) { this.listeners.push(l); return {} as any; }
        fire(e: any) { for (const l of this.listeners) l(e); }
    },

    Uri: {
        joinPath: (base: any, ...parts: string[]) => ({ fsPath: base.fsPath ? base.fsPath + '/' + parts.join('/') : parts.join('/') }),
        parse: (s: string) => ({ fsPath: s }),
        file: (f: string) => ({ fsPath: f })
    },
    RelativePattern: class { base: any; pattern: string; constructor(base: any, pattern: string) { this.base = base; this.pattern = pattern; } },
    FileSystemError: { FileNotFound: () => new Error('notfound') }
};

// import directly from TypeScript sources (ts-node will compile on the fly)
// @ts-ignore TS5097: allow .ts imports for ts-node loader
import { ConfigStore, ConfigCategory, vscodeRuntime } from '../../../src/services/config-store.ts';
import { logger } from '../../../src/utils/logger';


// copy stub into the module's runtime proxy so the implementation can use it
Object.assign(vscodeRuntime, vscode);


class FakeFs implements VscTypes.FileSystem {
    private files = new Map<string, Uint8Array>();
    private dirs = new Set<string>();
    readonly fileChangeEmitter = new vscode.EventEmitter();
    readonly onDidChangeFile: VscTypes.Event<VscTypes.FileChangeEvent[]> =
        this.fileChangeEmitter.event;

    // helpers
    private normalize(p: string) {
        return path.posix.normalize(p.replace(/\\/g, '/'));
    }

    // additional members required by vscode.FileSystem
    copy(source: VscTypes.Uri, target: VscTypes.Uri, options?: { overwrite?: boolean }): Thenable<void> {
        // no-op for tests
        return Promise.resolve();
    }
    isWritableFileSystem(scheme: string): boolean | undefined {
        // allow everything
        return true;
    }

    watch(_uri: VscTypes.Uri): VscTypes.Disposable {
        // no-op watcher
        return new vscode.Disposable(() => { });
    }

    stat(uri: VscTypes.Uri): Thenable<VscTypes.FileStat> {
        const p = this.normalize(uri.fsPath);
        if (this.files.has(p)) {
            return Promise.resolve({ type: vscode.FileType.File, ctime: 0, mtime: 0, size: this.files.get(p)!.length });
        }
        if (this.dirs.has(p)) {
            return Promise.resolve({ type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0 });
        }
        return Promise.reject(vscode.FileSystemError.FileNotFound());
    }

    readDirectory(uri: VscTypes.Uri): Thenable<[string, VscTypes.FileType][]> {
        const p = this.normalize(uri.fsPath);
        // map value type is the *type* from vscode; use stub for runtime values
        const entries = new Map<string, VscTypes.FileType>();
        for (const fp of Array.from(this.files.keys())) {
            const dir = path.posix.dirname(fp);
            if (dir === p) {
                entries.set(path.posix.basename(fp), vscode.FileType.File);
            }
        }
        for (const dp of Array.from(this.dirs)) {
            const parent = path.posix.dirname(dp);
            if (parent === p) {
                entries.set(path.posix.basename(dp), vscode.FileType.Directory);
            }
        }
        return Promise.resolve(Array.from(entries));
    }

    createDirectory(uri: VscTypes.Uri): Thenable<void> {
        this.dirs.add(this.normalize(uri.fsPath));
        return Promise.resolve();
    }

    readFile(uri: VscTypes.Uri): Thenable<Uint8Array> {
        const p = this.normalize(uri.fsPath);
        const contents = this.files.get(p);
        if (!contents) {
            return Promise.reject(vscode.FileSystemError.FileNotFound());
        }
        return Promise.resolve(contents);
    }

    writeFile(uri: VscTypes.Uri, content: Uint8Array): Thenable<void> {
        const p = this.normalize(uri.fsPath);
        const existed = this.files.has(p);
        // ensure parent directory exists
        const dir = path.posix.dirname(p);
        this.dirs.add(dir);
        this.files.set(p, content);
        this.fileChangeEmitter.fire([
            {
                type: existed
                    ? vscode.FileChangeType.Changed
                    : vscode.FileChangeType.Created,
                uri,
            },
        ]);
        return Promise.resolve();
    }

    delete(uri: VscTypes.Uri, _options?: { recursive?: boolean }): Thenable<void> {
        const p = this.normalize(uri.fsPath);
        const existed = this.files.delete(p);
        // note: directories are not removed for simplicity
        if (existed) {
            this.fileChangeEmitter.fire([
                {
                    type: vscode.FileChangeType.Deleted,
                    uri,
                },
            ]);
        }
        return Promise.resolve();
    }

    rename(oldUri: VscTypes.Uri, newUri: VscTypes.Uri, _options?: { overwrite?: boolean }): Thenable<void> {
        const oldp = this.normalize(oldUri.fsPath);
        const newp = this.normalize(newUri.fsPath);
        const data = this.files.get(oldp);
        if (!data) {
            throw vscode.FileSystemError.FileNotFound();
        }
        this.files.delete(oldp);
        this.files.set(newp, data);
        this.fileChangeEmitter.fire([
            {
                type: vscode.FileChangeType.Deleted,
                uri: oldUri,
            },
            {
                type: vscode.FileChangeType.Created,
                uri: newUri,
            },
        ]);
        return Promise.resolve();
    }
}

describe('ConfigStore (pure parsing)', function () {
    // ── configFilename ────────────────────────────────────────────────────────

    describe('configFilename', function () {
        it('appends .json to the short name', () => {
            assert.strictEqual(ConfigStore.configFilename('nginx-access'), 'nginx-access.json');
        });
        it('works for single-word names', () => {
            assert.strictEqual(ConfigStore.configFilename('app'), 'app.json');
        });
    });

    // ── parseFilepathConfig ───────────────────────────────────────────────────

    describe('parseFilepathConfig', function () {
        it('returns a valid FilepathConfig on valid JSON', async () => {
            const json = JSON.stringify({
                shortName: 'my-log',
                pathPattern: '/var/log/app.log'
            });
            const [cfg, err] = await (await import('../../../src/domain/filepath-config')).FilepathConfig.fromJson(json);
            assert.strictEqual(cfg?.shortName, 'my-log');
            assert.strictEqual(cfg?.pathPattern, '/var/log/app.log');
        });

        it('throws on malformed JSON', async () => {
            const json = '{invalid';
            const [cfg, err] = await (await import('../../../src/domain/filepath-config')).FilepathConfig.fromJson(json);
            assert.strictEqual(cfg, null);
            assert.ok(err);
        });

        it('throws on valid JSON but invalid schema', async () => {
            const json = JSON.stringify({ shortName: 'INVALID NAME', pathPattern: 'y' });
            const [cfg, err] = await (await import('../../../src/domain/filepath-config')).FilepathConfig.fromJson(json);
            assert.strictEqual(cfg, null);
            assert.ok(err);
            assert.strictEqual(err[0].property, 'shortName');
        });

        it('preserves optional description field', async () => {
            const json = JSON.stringify({
                shortName: 'app',
                pathPattern: '*.log',
                description: 'main app'
            });
            const [cfg, err] = await (await import('../../../src/domain/filepath-config')).FilepathConfig.fromJson(json);
            assert.strictEqual(cfg?.description, 'main app');
        });
    });

    // ── parseFileLogLineConfig ────────────────────────────────────────────────

    describe('parseFileLogLineConfig', function () {
        it('returns TextLineConfig on valid text JSON', async () => {
            const json = JSON.stringify({
                type: 'text',
                shortName: 'iis',
                fields: [{ name: 'ts', extraction: { kind: 'prefix-suffix', prefix: '[', suffix: ']' } }]
            });
            const [cfg, err] = await (await import('../../../src/domain/filelog-config')).TextLineConfig.fromJson(json);
            assert.strictEqual(cfg?.type, 'text');
            assert.strictEqual(cfg?.shortName, 'iis');
        });

        it('returns JsonLineConfig on valid json-type JSON', async () => {
            const json = JSON.stringify({
                type: 'json',
                shortName: 'structured',
                fields: [{ name: 'level', jsonPath: 'level' }]
            });
            const [cfg, err] = await (await import('../../../src/domain/filelog-config')).JsonLineConfig.fromJson(json);
            assert.strictEqual(cfg?.type, 'json');
        });

        it('throws on malformed JSON', () => {
            assert.throws(async () => {
                const [cfg, err] = await (await import('../../../src/domain/filelog-config')).TextLineConfig.fromJson('{{');
                if (!err) throw new Error('expected error');
            }, /malformed/i);
        });

        it('throws on valid JSON but invalid schema', () => {
            const json = JSON.stringify({ type: 'unknown', shortName: 'x', fields: [] });
            assert.throws(async () => {
                // choose TextLineConfig arbitrarily – it will reject due to type
                const [cfg, err] = await (await import('../../../src/domain/filelog-config')).TextLineConfig.fromJson(json);
                if (!err) throw new Error('expected error');
            }, /Invalid FileLogLineConfig/);
        });
        it('accepts tags in filelog JSON', async () => {
            const json = JSON.stringify({
                type: 'text',
                shortName: 'foo',

                fields: [],
                tags: ['a', 'b']
            });
            const [cfg, err] = await (await import('../../../src/domain/filelog-config')).TextLineConfig.fromJson(json);
            assert.deepStrictEqual(cfg?.tags, ['a', 'b']);
        });
    });


});
// ── filesystem-interaction tests ─────────────────────────────────────────

describe('ConfigStore (filesystem interactions)', function () {
    let store: ConfigStore;
    let fs: FakeFs;

    // helper factory that creates a watcher forwarding fs change events matching
    // the relative glob pattern (simplified for tests).
    function makeWatcherFactory(fs: FakeFs, root: VscTypes.Uri) {
        return (pattern: VscTypes.GlobPattern): VscTypes.FileSystemWatcher => {
            const emitter = new vscode.EventEmitter();
            const w: VscTypes.FileSystemWatcher = {
                onDidCreate: emitter.event,
                onDidChange: emitter.event,
                onDidDelete: emitter.event,
                dispose: () => emitter.dispose(),
            } as any;
            fs.fileChangeEmitter.event((changes: VscTypes.FileChangeEvent[]) => {
                for (const c of changes) {
                    // forward both create and delete events
                    if (c.type !== vscode.FileChangeType.Created && c.type !== vscode.FileChangeType.Deleted) {
                        continue;
                    }
                    const pat = (pattern as VscTypes.RelativePattern).pattern.replace('*', '');
                    if (c.uri.path.includes(pat)) {
                        emitter.fire(c.uri);
                    }
                }
            });
            return w;
        };
    }

    beforeEach(() => {
        fs = new FakeFs();
        const root = vscode.Uri.parse('file:///workspace');
        store = new ConfigStore(root, fs, makeWatcherFactory(fs, root));
        // stub logger to capture messages
        sinon.stub(logger, 'info');
    });

    it('can write, list and read a filepath config', async () => {
        const cfg: any = { shortName: 'foo', pathPattern: '/tmp/foo.log' };
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
        const cfg1: any = { shortName: 'a', pathPattern: 'x' };
        const cfg2: any = { shortName: 'b', pathPattern: 'y' };
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
        await store.writeConfig(ConfigCategory.Filepath, 'z', { shortName: 'z', pathPattern: 'p' } as any);
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

            fields: []
        } as any);
        // our fake watcher should fire asynchronously; allow a tick
        await new Promise((r) => setTimeout(r, 0));
        assert.strictEqual(notified, true);
    });

    it('subscriber and logger react when a config file is deleted externally', async () => {
        let notified = false;
        store.subscribeConfigAdded(ConfigCategory.Filepath, name => {
            if (name === 'z') {
                notified = true;
            }
        });
        // write then delete via fs to simulate external removal
        await store.writeConfig(ConfigCategory.Filepath, 'z', { shortName: 'z', pathPattern: 'p' } as any);
        (fs as any).delete(vscode.Uri.file('/workspace/.logex/filepath-configs/z.json'));
        await new Promise(r => setTimeout(r, 0));
        assert.strictEqual(notified, true);
        // logger should have been called *once* for deletion only
        sinon.assert.calledOnce(logger.info);
        sinon.assert.calledWith(logger.info, sinon.match(/deleted config/i));
    });

    it('logs create and update actions using OutputLogger', async () => {
        const cfg: any = { shortName: 'foo', pathPattern: '/tmp/foo.log' };
        // first write should be a create
        await store.writeConfig(ConfigCategory.Filepath, 'foo', cfg);
        sinon.assert.calledWith(logger.info, sinon.match(/Config create: filepath\/foo/));
        // clear stub history
        (logger.info as any).resetHistory();
        // second write should be an update
        await store.writeConfig(ConfigCategory.Filepath, 'foo', cfg);
        sinon.assert.calledWith(logger.info, sinon.match(/Config update: filepath\/foo/));
    });

    it('logs delete action using OutputLogger', async () => {
        const cfg: any = { shortName: 'bar', pathPattern: '/tmp/bar.log' };
        await store.writeConfig(ConfigCategory.Filepath, 'bar', cfg);
        (logger.info as any).resetHistory();
        await store.deleteConfig(ConfigCategory.Filepath, 'bar');
        sinon.assert.calledWith(logger.info, sinon.match(/Config delete: filepath\/bar/));
    });

    afterEach(() => {
        sinon.restore();
    });
});