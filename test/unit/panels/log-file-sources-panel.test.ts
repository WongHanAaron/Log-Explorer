import * as assert from 'assert';
import { LogFileSourcesPanel } from '../../../src/panels/editors/LogFileSourcesPanel.ts';
import { ConfigStore } from '../../../src/services/config-store';
import * as vscode from 'vscode';

// minimal stub types to satisfy constructor
class DummyWebview {
    html = '';
    onDidReceiveMessage(listener: any) {
        // simply return a disposable stub
        return { dispose: () => {} };
    }
    postMessage(_msg: any) {
        // no-op
    }
}

class DummyPanel {
    webview = new DummyWebview();
    reveal() {}
    dispose() {}
}

describe('LogFileSourcesPanel', () => {
    let writeStub: any;
    let createDirStub: any;

    beforeEach(() => {
        // stub ConfigStore.writeConfig
        writeStub = ConfigStore.prototype.writeConfig;
        ConfigStore.prototype.writeConfig = async () => { return; };
        // stub workspace fs createDirectory
        createDirStub = vscode.workspace.fs.createDirectory;
        vscode.workspace.fs.createDirectory = async () => { return; };
    });

    afterEach(() => {
        // restore originals
        ConfigStore.prototype.writeConfig = writeStub;
        vscode.workspace.fs.createDirectory = createDirStub;
    });

    it('handles filepath-config:save message by writing config through ConfigStore', async () => {
        const fakePanel = new DummyPanel() as any as vscode.WebviewPanel;
        const panel = new LogFileSourcesPanel(
            fakePanel,
            {} as any,
            vscode.Uri.file('/fake/config/dir'),
            undefined,
            vscode.Uri.file('/workspace')
        );

        // call the handler directly
        const msg = { type: 'filepath-config:save', config: { shortName: 'foo', pathPattern: '/tmp' } };
        // @ts-ignore access private method
        await panel['_handleMessage'](msg);

        assert.ok(createDirStub.calledOnce, 'directory should be created');
        assert.ok(writeStub.calledOnce, 'writeConfig should be invoked');
        const [cat, name, data] = writeStub.firstCall.args;
        assert.strictEqual(cat, 'Filepath');
        assert.strictEqual(name, 'foo');
        assert.deepStrictEqual(data, msg.config);
    });
});
