import * as assert from 'assert';
import * as vscode from '../vscode.ts';
import { GenericConfigPanel } from '../../../src/panels/editors/GenericConfigPanel.ts';
import { ConfigCategory } from '../../../src/services/config-store.ts';

class FakeWebview {
    public posts: any[] = [];
    public onMsg?: (msg: any) => any;
    onDidReceiveMessage(cb: (msg: any) => any): vscode.Disposable {
        this.onMsg = cb;
        return { dispose() { } } as any;
    }
    postMessage(message: any): Thenable<boolean> {
        this.posts.push(message);
        return Promise.resolve(true);
    }
    // uri type is intentionally loose; the stub is simple and tests don't
    // depend on its shape.
    asWebviewUri(uri: any): any { return uri; }
    cspSource = '';
}

class FakePanel {
    public webview: FakeWebview;
    constructor(webview: FakeWebview) { this.webview = webview; }
    dispose() { }
    onDidDispose(cb: () => any): vscode.Disposable {
        // mimic VSCode API
        return { dispose() { } } as any;
    }
}

class DummyStore {
    names: string[] = [];
    listeners: ((name: string) => void)[] = [];
    listConfigNames() { return Promise.resolve(this.names); }
    getConfig(_c: any, name: string) { return Promise.resolve({ toJson: () => JSON.stringify({ shortName: name }) }); }
    subscribeConfigAdded(_c: any, cb: (n: string) => void) {
        this.listeners.push(cb);
        return { dispose() { } };
    }
}

class TestPanel extends GenericConfigPanel {
    protected getWebviewContent(_webview: vscode.Webview): string {
        return '<html></html>';
    }
    // expose internal for testing
    public sendInit(name?: string) { this._sendInit(name); }
}

describe('GenericConfigPanel', function () {
    let panel: TestPanel;
    let fakeWeb: FakeWebview;
    let store: DummyStore;

    beforeEach(() => {
        fakeWeb = new FakeWebview();
        store = new DummyStore();
        // the VSCode WebviewPanel interface is large; we only need the bits used
        // by GenericConfigPanel.  cast via `any` and then to the *real* vscode
        // type so the constructor signature lines up (our stub lives in a
        // different module namespace).
        const fakePanel = new FakePanel(fakeWeb) as unknown as any as import('vscode').WebviewPanel;
        panel = new TestPanel(fakePanel, vscode.Uri.file('ext'), vscode.Uri.file('cfg'), ConfigCategory.Filepath, undefined, vscode.Uri.file('root'), store as any);
    });

    it('sends init message with names', async () => {
        store.names = ['a', 'b'];
        panel.sendInit();
        // the implementation sends messages asynchronously via a microtask
        await new Promise(r => setTimeout(r, 0));
        assert.deepStrictEqual(fakeWeb.posts[0].type, 'init');
        assert.deepStrictEqual(fakeWeb.posts[0].configs, ['a', 'b']);
    });

    it('includes error field when init current load fails', async () => {
        store.names = ['x'];
        // make getConfig throw
        store.getConfig = (_c: any, _n: string) => Promise.reject(new Error('not found')) as any;
        panel.sendInit('x');
        await new Promise(r => setTimeout(r, 0));
        const msg = fakeWeb.posts.find(m => m.type === 'init');
        assert.ok(msg);
        assert.strictEqual(msg.error, 'not found');
    });

    it('forwards store change events as configListChanged', async () => {
        store.names = ['x'];
        panel.sendInit();
        // wait for init to complete before clearing messages
        await new Promise(r => setTimeout(r, 0));
        fakeWeb.posts = [];
        // simulate change
        store.names.push('y');
        store.listeners.forEach(cb => cb('y'));
        // allow async
        await new Promise(r => setTimeout(r, 0));
        assert.deepStrictEqual(fakeWeb.posts[0].type, 'configListChanged');
        assert.deepStrictEqual(fakeWeb.posts[0].configs, ['x', 'y']);
    });

    it('responds to selectConfig with configData object', async () => {
        store.names = ['foo'];
        panel.sendInit();
        fakeWeb.posts = [];
        fakeWeb.onMsg && fakeWeb.onMsg({ type: 'selectConfig', name: 'foo' });
        await new Promise(r => setTimeout(r, 0));
        const msg = fakeWeb.posts.find(m => m.type === 'configData');
        assert.ok(msg);
        assert.strictEqual(typeof msg.config, 'object');
        assert.strictEqual(msg.config.shortName, 'foo');
    });

    it('includes error field when config retrieval fails', async () => {
        store.names = ['foo'];
        panel.sendInit();
        fakeWeb.posts = [];
        // make store throw
        store.getConfig = (_c: any, _n: string) => Promise.reject(new Error('bad json')) as any;
        fakeWeb.onMsg && fakeWeb.onMsg({ type: 'selectConfig', name: 'foo' });
        await new Promise(r => setTimeout(r, 0));
        const msg = fakeWeb.posts.find(m => m.type === 'configData');
        assert.ok(msg);
        assert.strictEqual(msg.config, null);
        assert.strictEqual(msg.error, 'bad json');
    });
});
