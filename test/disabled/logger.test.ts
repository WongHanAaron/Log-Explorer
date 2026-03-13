import * as chai from 'chai';
const { expect } = chai;
import * as vscode from './vscode.ts';
import { OutputLogger, LogLevel } from '../../src/utils/logger.ts';


class FakeChannel implements vscode.OutputChannel {
    name: string;
    public lines: string[] = [];
    constructor(name: string) {
        this.name = name;
    }
    append(value: string): void {
        // not used
    }
    appendLine(value: string): void {
        this.lines.push(value);
    }
    clear(): void { }
    show(preserveFocus?: boolean): void { }
    hide(): void { }
    dispose(): void { }
}

// helpers to stub configuration
function makeConfig(overrides: Partial<{ logLevel: LogLevel; allowedScopes: string[]; deniedScopes: string[] }>) {
    return {
        get: (key: string, defaultValue?: any) => {
            switch (key) {
                case 'logLevel':
                    return overrides.logLevel ?? defaultValue;
                case 'allowedScopes':
                    return overrides.allowedScopes;
                case 'deniedScopes':
                    return overrides.deniedScopes;
                default:
                    return defaultValue;
            }
        }
    } as any;
}

describe('OutputLogger', function () {
    let originalCreate: typeof vscode.window.createOutputChannel;
    let originalConfig: typeof vscode.workspace.getConfiguration;

    beforeEach(() => {
        // stub output channel factory
        originalCreate = vscode.window.createOutputChannel;
        vscode.window.createOutputChannel = (name: string) => new FakeChannel(name);
        // default configuration
        originalConfig = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => makeConfig({ logLevel: LogLevel.Debug });
    });

    afterEach(() => {
        vscode.window.createOutputChannel = originalCreate;
        vscode.workspace.getConfiguration = originalConfig;
    });

    it('formats level and scope correctly', () => {
        const logger = new OutputLogger('A');
        logger.log(LogLevel.Info, 'hello');
        const chan = (logger as any).channel as FakeChannel;
        expect(chan).to.exist;
        expect(chan.lines).to.have.length(1);
        expect(chan.lines[0]).to.match(/\[info\]\[A\] hello$/);
    });

    it('convenience helpers map to correct level', () => {
        const logger = new OutputLogger('scope');
        logger.debug('d');
        logger.info('i', 'other');
        logger.warn('w');
        logger.error('e');
        const lines = ((logger as any).channel as FakeChannel).lines;
        expect(lines.some(l => l.includes('[debug]'))).to.be.true;
        expect(lines.some(l => l.includes('[info] i'))).to.be.true;
        expect(lines.some(l => l.includes('[warn] w'))).to.be.true;
        expect(lines.some(l => l.includes('[error] e'))).to.be.true;
    });

    it('allows adhoc override of level and scope', () => {
        const logger = new OutputLogger('A');
        // use generic log to override both level and scope
        logger.log(LogLevel.Warn, 'warned', 'B');
        const chan = (logger as any).channel as FakeChannel;
        expect(chan.lines[0]).to.match(/\[warn\]\[B\] warned$/);
    });

    it('logs error objects with stack', () => {
        const logger = new OutputLogger();
        const err = new Error('oops');
        logger.error('failed', err);
        const line = ((logger as any).channel as FakeChannel).lines[0];
        expect(line).to.include('failed');
        expect(line).to.include('oops');
        expect(line).to.include('Error:'); // stack prefix
    });

    it('filters by level setting', () => {
        vscode.workspace.getConfiguration = () => makeConfig({ logLevel: LogLevel.Warn });
        const logger = new OutputLogger();
        logger.log(LogLevel.Info, 'skip');
        logger.log(LogLevel.Error, 'show');
        const lines = ((logger as any).channel as FakeChannel).lines;
        expect(lines.some(l => l.includes('skip'))).to.be.false;
        expect(lines.some(l => l.includes('show'))).to.be.true;
    });

    it('filters by allowedScopes', () => {
        vscode.workspace.getConfiguration = () => makeConfig({ allowedScopes: ['x'] });
        const logger = new OutputLogger('x');
        logger.log(LogLevel.Info, 'yes');
        logger.log(LogLevel.Info, 'no', 'y');
        const lines = ((logger as any).channel as FakeChannel).lines;
        expect(lines.some(l => l.includes('yes'))).to.be.true;
        expect(lines.some(l => l.includes('no'))).to.be.false;
    });

    it('updates when configuration changes at runtime', () => {
        // stub event emitter
        const changeHandlers: Array<(e: vscode.ConfigurationChangeEvent) => void> = [];
        (vscode.workspace as any).onDidChangeConfiguration = (cb: any) => {
            changeHandlers.push(cb);
            return { dispose: () => { } };
        };
        vscode.workspace.getConfiguration = () => makeConfig({ logLevel: LogLevel.Info });
        const logger = new OutputLogger();
        logger.log(LogLevel.Info, 'first');
        // now change config to error-only
        vscode.workspace.getConfiguration = () => makeConfig({ logLevel: LogLevel.Error });
        changeHandlers.forEach(h => h({ affectsConfiguration: () => true } as any));
        logger.log(LogLevel.Info, 'second');
        logger.log(LogLevel.Error, 'third');
        const lines = ((logger as any).channel as FakeChannel).lines;
        expect(lines.some(l => l.includes('first'))).to.be.true;
        expect(lines.some(l => l.includes('second'))).to.be.false;
        expect(lines.some(l => l.includes('third'))).to.be.true;
    });

    it('close() removes channel but keeps configuration listener', () => {
        const cfg: any = { logLevel: LogLevel.Info };
        let changed = false;
        (vscode.workspace as any).onDidChangeConfiguration = (cb: any) => {
            changed = true;
            return { dispose: () => { } };
        };
        vscode.workspace.getConfiguration = () => makeConfig({ logLevel: LogLevel.Info });
        const logger = new OutputLogger();
        logger.log(LogLevel.Info, 'before');
        logger.close();
        // simulate config change - should still run callback
        vscode.workspace.getConfiguration = () => makeConfig({ logLevel: LogLevel.Error });
        (vscode.workspace as any).onDidChangeConfiguration((e: any) => { }
        );
        expect(changed).to.be.true;
        // channel undefined so new log creates it again
        expect((logger as any).channel).to.be.undefined;
        logger.log(LogLevel.Info, 'after');
        const chan = (logger as any).channel as FakeChannel;
        expect(chan).to.exist;
    });
});
