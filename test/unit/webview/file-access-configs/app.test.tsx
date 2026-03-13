import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen } from '@testing-library/react';
import { App } from '../../../../src/webview/file-access-configs/App.tsx';

// stub acquireVsCodeApi before importing App
let lastMsg: any = null;
(global as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => { lastMsg = msg; },
    getState: () => ({}),
    setState: (_: any) => { },
});

describe('FileAccessConfigs webview', () => {
    it('normalises settings when non-object received from host', () => {
        render(React.createElement(App));
        // send init to populate names
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['foo'] } }));
        expect(screen.getByText('foo'));
        // simulate click via message event (we can't click list easily)
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'configData', config: { shortName: 'foo', adapterType: 'local', settings: [] } } }));
        // the form should render without throwing; verify that the short name input has value
        const input = screen.getByLabelText(/short name/i) as HTMLInputElement;
        assert.strictEqual(input.value, 'foo');
    });
});
