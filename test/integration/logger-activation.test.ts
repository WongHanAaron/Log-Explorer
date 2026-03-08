import * as chai from 'chai';
const { expect } = chai;
import * as vscode from 'vscode';

// minimal fake output channel used by several tests
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

describe('Logger integration', function () {
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

    it('should append a message on activation', async () => {
        const { activate } = require('../../src/extension');
        const context: any = { subscriptions: [] };
        await activate(context);
        expect(created).to.exist;
        expect(created!.lines.some(l => l.includes('extension activated'))).to.be.true;
    });

    it('filters messages when configuration changes', () => {
        // stub configuration with a mutable store and change event emitter
        const cfg: any = { logLevel: 'info' };
        const handlers: Array<(e: vscode.ConfigurationChangeEvent) => void> = [];
        vscode.workspace.getConfiguration = () => ({
            get: (key: string, def: any) => cfg[key] ?? def
        }) as any;
        (vscode.workspace as any).onDidChangeConfiguration = (cb: any) => {
            handlers.push(cb);
            return { dispose: () => { } };
        };

        // re‑stub createOutputChannel again (in case previous test changed it)
        created = undefined;
        vscode.window.createOutputChannel = (name: string) => {
            created = new FakeChannel(name);
            return created as any;
        };

        const { OutputLogger, LogLevel } = require('../../src/utils/logger');
        const logger = new OutputLogger();
        logger.log(LogLevel.Info, 'one');
        // change to error-only
        cfg.logLevel = LogLevel.Error;
        handlers.forEach(h => h({ affectsConfiguration: () => true } as any));
        logger.log(LogLevel.Warn, 'two');
        logger.log(LogLevel.Error, 'three');

        const lines = created!.lines;
        expect(lines.some(l => l.includes('one'))).to.be.true;
        expect(lines.some(l => l.includes('two'))).to.be.false;
        expect(lines.some(l => l.includes('three'))).to.be.true;
    });
});