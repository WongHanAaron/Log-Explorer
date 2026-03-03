import * as assert from 'assert';
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

suite('LogExplorer Extension', () => {
    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('logexplorer.logexplorer');
        assert.ok(extension, 'Extension should be found in installed extensions');
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('logexplorer.logexplorer');
        assert.ok(extension, 'Extension should be found');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension!.isActive, 'Extension should be active');
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes('logexplorer.showPanel'),
            'logexplorer.showPanel command should be registered'
        );
    });

    suite('workspace context helpers', () => {
        let root: vscode.Uri;
        let ConfigStore: any;
        let ConfigCategory: any;
        // ensure there's at least one workspace folder for our file operations
        setup(async () => {
            if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
                const tmpDir = path.join(os.tmpdir(), 'logexplorer-test');
                await fs.promises.mkdir(tmpDir, { recursive: true });
                vscode.workspace.updateWorkspaceFolders(0, null, { uri: vscode.Uri.file(tmpDir) });
                // give the extension host a moment to pick up the change
                await new Promise((r) => setTimeout(r, 200));
            }
            // after update attempt, grab the first folder
            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                root = vscode.workspace.workspaceFolders[0].uri;
            } else {
                throw new Error('Failed to create workspace folder');
            }

            // activate extension and pull exports
            const ext = vscode.extensions.getExtension('logexplorer.logexplorer');
            assert.ok(ext, 'Extension should be present for tests');
            const activated = await ext.activate();
            // activated value may be our export object or void
            const exportsObj = (ext.exports || activated) as any;
            ConfigStore = exportsObj.ConfigStore;
            ConfigCategory = exportsObj.ConfigCategory;
        });

        suite('config store I/O', () => {
            // config-store methods will be accessed via the store instance


            test('writeConfig creates directory and file when missing', async () => {
                // use store to perform write
                const store = new ConfigStore(root);
                const dir = vscode.Uri.joinPath(root, '.logex', 'test-configs');
                try { await vscode.workspace.fs.delete(dir, { recursive: true }); } catch { }
                const obj = { shortName: 'foo', label: 'Foo', pathPattern: 'x' };
                await store.writeConfig(ConfigCategory.Filepath, 'foo', obj);
                // verify via listConfigNames
                const names = await store.listConfigNames(ConfigCategory.Filepath);
                assert.deepStrictEqual(names, ['foo']);
            });

            test('listConfigNames returns all names for filepath and filelog categories', async () => {
                const store = new ConfigStore(root);
                // ensure clean state by deleting directories
                const fpDir = vscode.Uri.joinPath(root, '.logex', 'filepath-configs');
                const flDir = vscode.Uri.joinPath(root, '.logex', 'filelog-configs');
                try { await vscode.workspace.fs.delete(fpDir, { recursive: true }); } catch { }
                try { await vscode.workspace.fs.delete(flDir, { recursive: true }); } catch { }
                // write entries via store
                await store.writeConfig(ConfigCategory.Filepath, 'one', { shortName: 'one', label: 'One', pathPattern: 'p' });
                await store.writeConfig(ConfigCategory.Filelog, 'two', { type: 'text', shortName: 'two', label: 'Two', fields: [] });
                const fpNames = await store.listConfigNames(ConfigCategory.Filepath);
                const flNames = await store.listConfigNames(ConfigCategory.Filelog);
                assert.deepStrictEqual(fpNames, ['one']);
                assert.deepStrictEqual(flNames, ['two']);
            });

            test('subscribeConfigAdded notifies on new config in both categories', async () => {
                const store = new ConfigStore(root);
                const fpDir = vscode.Uri.joinPath(root, '.logex', 'filepath-configs');
                const flDir = vscode.Uri.joinPath(root, '.logex', 'filelog-configs');
                try { await vscode.workspace.fs.delete(fpDir, { recursive: true }); } catch { }
                try { await vscode.workspace.fs.delete(flDir, { recursive: true }); } catch { }
                const notified: Array<{ cat: string; name: string }> = [];
                const dispFp = store.subscribeConfigAdded(ConfigCategory.Filepath, (n: string) => notified.push({ cat: 'filepath', name: n }));
                const dispFl = store.subscribeConfigAdded(ConfigCategory.Filelog, (n: string) => notified.push({ cat: 'filelog', name: n }));
                await store.writeConfig(ConfigCategory.Filepath, 'alpha', { shortName: 'alpha', label: 'A', pathPattern: '*' });
                await store.writeConfig(ConfigCategory.Filelog, 'beta', { type: 'text', shortName: 'beta', label: 'B', fields: [] });
                // allow any asynchronous callback to run
                await new Promise((r) => setTimeout(r, 50));
                assert.deepStrictEqual(notified, [
                    { cat: 'filepath', name: 'alpha' },
                    { cat: 'filelog', name: 'beta' }
                ]);
                dispFp.dispose();
                dispFl.dispose();
            });
        });
        // We don't import the workspace module directly here; instead we
        // perform the necessary actions via internal commands that the
        // extension registers purely for test purposes.  This keeps the test
        // bundle completely self-contained and avoids TypeScript rootDir
        // issues.
        async function getLastContext() {
            return (await vscode.commands.executeCommand('logexplorer._getWorkspaceContext')) as any;
        }
        async function syncWorkspaceContext() {
            await vscode.commands.executeCommand('logexplorer._syncWorkspaceContext');
        }
        async function executeSetupWorkspace() {
            await vscode.commands.executeCommand('logexplorer.setupWorkspace');
        }

        test('syncWorkspaceContext reports folder exists but not ready when only .logex present', async () => {
            const logexUri = vscode.Uri.joinPath(root, '.logex');
            // ensure fresh state
            try {
                await vscode.workspace.fs.delete(logexUri, { recursive: true });
            } catch { }
            await vscode.workspace.fs.createDirectory(logexUri);

            await syncWorkspaceContext();
            const lastWorkspaceContext = await getLastContext();
            assert.strictEqual(lastWorkspaceContext.folderExists, true);
            assert.strictEqual(lastWorkspaceContext.ready, false);
        });

        test('executeSetupWorkspace creates subdirs and marks context ready', async () => {
            await executeSetupWorkspace();
            const lastWorkspaceContext = await getLastContext();
            assert.strictEqual(lastWorkspaceContext.ready, true);

            for (const sub of ['filepath-configs', 'filelog-configs']) {
                const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, '.logex', sub));
                assert.ok(stat, `subdirectory ${sub} should exist`);
            }
        });

        test.skip('watcher triggers sync when .logex is created manually', async () => {
            const logexUri = vscode.Uri.joinPath(root, '.logex');

            // start from clean slate
            try {
                await vscode.workspace.fs.delete(logexUri, { recursive: true });
            } catch { }
            await syncWorkspaceContext();
            const lastWorkspaceContext = await getLastContext();
            assert.strictEqual(lastWorkspaceContext.folderExists, false);
            assert.strictEqual(lastWorkspaceContext.ready, false);

            // create folder using Node FS to simulate an external change
            await fs.promises.mkdir(logexUri.fsPath, { recursive: true });

            // allow a moment for the watcher event to fire (longer on CI)
            await new Promise((r) => setTimeout(r, 1000));

            // watcher should have invoked syncWorkspaceContext and updated state
            const lastWorkspaceContext2 = await getLastContext();
            assert.strictEqual(lastWorkspaceContext2.folderExists, true);
        });

    });
});
