import * as chai from 'chai';
const { expect } = chai;
import { isLogMessage } from '../../src/utils/logMessage';
import { LogLevel, OutputLogger } from '../../src/utils/logger';
import * as vscode from 'vscode';

describe('Webview message validation (unit)', function () {
    it('isLogMessage returns false for malformed objects', () => {
        expect(isLogMessage(null)).to.be.false;
        expect(isLogMessage({})).to.be.false;
        expect(isLogMessage({ type: 'log', level: 'oops', text: 'hi' })).to.be.false;
        expect(isLogMessage({ type: 'log', level: LogLevel.Info, text: 5 })).to.be.false;
        expect(isLogMessage({ type: 'log', level: LogLevel.Info, text: 'hi', scope: 123 })).to.be.false;
    });

    it('host handler ignores malformed messages without throwing', () => {
        // stub output channel to detect if logger.log is called
        const lines: any[] = [];
        const originalCreate = vscode.window.createOutputChannel;
        vscode.window.createOutputChannel = (name: string) => ({
            append: () => { },
            appendLine: (v: string) => lines.push(v),
            clear: () => { },
            show: () => { },
            hide: () => { },
            dispose: () => { },
            name,
        } as any);

        const logger = new OutputLogger();
        // fake handler mimicking panel code
        const handle = (message: any) => {
            if (isLogMessage(message)) {
                logger.log(message.level, message.text, message.scope);
            }
        };

        expect(() => handle({})).to.not.throw();
        expect(() => handle({ type: 'log', level: 'x', text: 'y' })).to.not.throw();
        expect(lines).to.be.empty;

        vscode.window.createOutputChannel = originalCreate;
    });
});