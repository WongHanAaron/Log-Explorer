import * as assert from 'assert';
import * as vscode from 'vscode';

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
});
