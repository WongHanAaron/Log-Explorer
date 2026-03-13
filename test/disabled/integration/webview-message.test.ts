import * as chai from 'chai';
const { expect } = chai;
import * as vscode from 'vscode';

// fake channel to capture logs
class FakeChannel {
    name: string;
    public lines: string[] = [];
    constructor(name: string) {
        this.name = name;
    }
    append(value: string): void { }
    appendLine(value: string): void {
        this.lines.push(value);
    }
    clear(): void { }
    show(..._args: any[]): void { }
    hide(): void { }
    dispose(): void { }
}

// minimal fake webview that allows registering a message handler
class FakeWebview {
    public options: vscode.WebviewOptions = {} as any;
    public html: string = '';
    public onMessage?: (msg: any) => void;
    onDidReceiveMessage(cb: (msg: any) => any): vscode.Disposable {
        this.onMessage = cb;
        return { dispose: () => { } };
    }
    asWebviewUri(uri: vscode.Uri): vscode.Uri { return uri; }
    postMessage(message: any): Thenable<boolean> { return Promise.resolve(true); }
    // placeholder to satisfy interface when casting
    cspSource = '';
}

class FakeWebviewView {
    constructor(public webview: FakeWebview) { }
    // we only need the webview property for our tests
}

describe('Webview logger integration', function () {
    let originalCreate: typeof vscode.window.createOutputChannel;
    let created: FakeChannel | undefined;

    beforeEach(() => {
        originalCreate = vscode.window.createOutputChannel;
        vscode.window.createOutputChannel = (name: string) => {
            created = new FakeChannel(name);
            return created as any;
        };
    });

    afterEach(() => {
        vscode.window.createOutputChannel = originalCreate;
        created = undefined;
    });

    it('forwards valid log messages from a panel webview', () => {
        const { LogExplorerPanel } = require('../../src/panels/LogExplorerPanel');
        const panel = new LogExplorerPanel(vscode.Uri.file('dummy'));
        const fakeWebview = new FakeWebview();
        const fakeView = new FakeWebviewView(fakeWebview) as unknown as vscode.WebviewView;

        panel.resolveWebviewView(fakeView, {} as any, {} as any);
        // simulate a well-formed log message
        fakeWebview.onMessage!({ type: 'log', level: 'info', text: 'hello', scope: 'ui' });

        expect(created).to.exist;
        expect(created!.lines.some(l => l.includes('hello'))).to.be.true;
    });

    it('ignores malformed log messages without throwing', () => {
        const { LogExplorerPanel } = require('../../src/panels/LogExplorerPanel');
        const panel = new LogExplorerPanel(vscode.Uri.file('dummy'));
        const fakeWebview = new FakeWebview();
        const fakeView = new FakeWebviewView(fakeWebview) as unknown as vscode.WebviewView;
        panel.resolveWebviewView(fakeView, {} as any, {} as any);
        // simulate invalid payloads
        expect(() => fakeWebview.onMessage!({})).to.not.throw();
        expect(() => fakeWebview.onMessage!({ type: 'log', level: 'bad', text: 123 })).to.not.throw();
        // channel should still be empty
        expect(created!.lines.length).to.equal(0);
    });
});