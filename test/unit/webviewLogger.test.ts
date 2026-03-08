import * as chai from 'chai';
const { expect } = chai;
import { WebViewLogger } from '../..//src/webview/webviewLogger';

describe('WebViewLogger', function () {
    let posted: any[] = [];
    beforeEach(() => {
        posted = [];
        // create fake acquireVsCodeApi
        (global as any).acquireVsCodeApi = () => ({
            postMessage: (msg: any) => posted.push(msg),
        });
    });

    afterEach(() => {
        delete (global as any).acquireVsCodeApi;
    });

    it('posts basic messages with default level', () => {
        WebViewLogger.log('hello');
        expect(posted).to.have.length(1);
        expect(posted[0]).to.deep.equal({ type: 'log', text: 'hello', level: 'info' });
    });

    it('includes level and scope when provided', () => {
        WebViewLogger.log('warned', 'warn', 'ui');
        expect(posted[0]).to.deep.equal({ type: 'log', text: 'warned', level: 'warn', scope: 'ui' });
    });
});
