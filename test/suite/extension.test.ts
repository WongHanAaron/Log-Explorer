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
        });

        suite('config store I/O', () => {
            const { writeConfig, listConfigs } = require('../../../src/services/config-store');

            test('writeConfig creates directory and file when missing', async () => {
                const dir = vscode.Uri.joinPath(root, '.logex', 'test-configs');
                try { await vscode.workspace.fs.delete(dir, { recursive: true }); } catch { }
                // create fake config object
                const obj = { shortName: 'foo', label: 'Foo', pathPattern: 'x' };
                await vscode.workspace.fs.createDirectory(dir); // ensure parent exists
                await writeConfig(dir, 'foo', obj);
                const names = await listConfigs(dir);
                assert.deepStrictEqual(names, ['foo']);
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

        test('watcher triggers sync when .logex is created manually', async () => {
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
