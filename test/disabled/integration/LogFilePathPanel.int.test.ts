import * as chai from 'chai';
const { expect } = chai;
import * as vscode from 'vscode';

import { ConfigStore, ConfigCategory } from '../../src/services/config-store';
import { LogFileSourcesPanel } from '../../src/panels/editors/LogFileSourcesPanel';

class FakeWebview {
    public html = '';
    public onMessage?: (msg: any) => void;
    onDidReceiveMessage(cb: (msg: any) => any): vscode.Disposable {
        this.onMessage = cb;
        return { dispose: () => { } } as any;
    }
    asWebviewUri(uri: vscode.Uri): vscode.Uri { return uri; }
    postMessage(message: any): Thenable<boolean> { return Promise.resolve(true); }
    cspSource = '';
}

class FakeWebviewView {
    constructor(public webview: FakeWebview) { }
}

// minimal fake filesystem provider to back ConfigStore
class InMemoryFs implements vscode.FileSystem {
    private files = new Map<string, Uint8Array>();
    async stat(uri: vscode.Uri) { return { type: vscode.FileType.File, ctime: 0, mtime: 0, size: 0 }; }
    async readDirectory(uri: vscode.Uri) { return []; }
    async readFile(uri: vscode.Uri) { return this.files.get(uri.fsPath) ?? new Uint8Array(); }
    async writeFile(uri: vscode.Uri, content: Uint8Array) { this.files.set(uri.fsPath, content); }
    async delete(uri: vscode.Uri) { this.files.delete(uri.fsPath); }
    // stubs
    copy() { return Promise.resolve(); }
    watch(): vscode.Disposable { return { dispose() { } }; }
    createDirectory() { return Promise.resolve(); }
    rename() { return Promise.resolve(); }
    isWritableFileSystem() { return true; }
}

// watcher factory that does nothing (ConfigStore subscription still works via our fake)
// use `any` to avoid relying on a non‑existent public API type
const dummyWatcherFactory: any = (_pattern: any) => {
    return { onDidCreate: () => ({ dispose() { } } as any), onDidChange: () => ({ dispose() { } } as any), onDidDelete: () => ({ dispose() { } } as any), dispose() { } } as any;
};

suite('Log File Path Panel Integration', function () {
    let store: ConfigStore;
    let panel: LogFileSourcesPanel;
    let fakeWebview: FakeWebview;
    let received: any[];

    setup(async () => {
        const root = vscode.Uri.parse('file:///workspace');
        store = new ConfigStore(root, new InMemoryFs(), dummyWatcherFactory as any);
        fakeWebview = new FakeWebview();
        const fakeView = new FakeWebviewView(fakeWebview) as unknown as vscode.WebviewView;
        panel = new LogFileSourcesPanel(vscode.Uri.file('dummy'), undefined as any, root, undefined, root);
        // override panel's webview with ours
        (panel as any)._panel = { webview: fakeWebview } as any;
        received = [];
        fakeWebview.postMessage = (msg: any) => { received.push(msg); return Promise.resolve(true); };
    });

    test('init message contains list of names', async () => {
        // write a config into store
        await store.writeConfig(ConfigCategory.Filepath, 'a', { shortName: 'a', pathPattern: '/x' } as any);
        // simulate panel ready
        fakeWebview.onMessage && fakeWebview.onMessage({ type: 'ready' });
        // wait a tick
        await new Promise(r => setTimeout(r, 0));
        expect(received.some(m => m.type === 'init' && m.configs.includes('a'))).to.be.true;
    });

    test('configData payload is an object when selection occurs', async () => {
        // ensure config exists and panel has been initialised
        await store.writeConfig(ConfigCategory.Filepath, 'a', { shortName: 'a', pathPattern: '/x' } as any);
        fakeWebview.onMessage && fakeWebview.onMessage({ type: 'ready' });
        await new Promise(r => setTimeout(r, 0));
        received = [];
        // simulate user clicking the name in webview
        fakeWebview.onMessage && fakeWebview.onMessage({ type: 'selectConfig', name: 'a' });
        await new Promise(r => setTimeout(r, 0));
        const msg = received.find(m => m.type === 'configData');
        expect(msg).to.exist;
        expect(msg.config).to.be.an('object');
        expect(msg.config.shortName).to.equal('a');
    });

    test('list updates when config added or removed', async () => {
        fakeWebview.onMessage && fakeWebview.onMessage({ type: 'ready' });
        await new Promise(r => setTimeout(r, 0));
        received = [];
        await store.writeConfig(ConfigCategory.Filepath, 'b', { shortName: 'b', pathPattern: '/y' } as any);
        // subscription should send configListChanged
        await new Promise(r => setTimeout(r, 0));
        expect(received.some(m => m.type === 'configListChanged' && m.configs.includes('b'))).to.be.true;
        received = [];
        await store.deleteConfig(ConfigCategory.Filepath, 'b');
        await new Promise(r => setTimeout(r, 0));
        expect(received.some(m => m.type === 'configListChanged' && !m.configs.includes('b'))).to.be.true;
    });
});
