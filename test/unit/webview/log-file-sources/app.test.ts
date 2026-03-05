import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen, fireEvent } from '@testing-library/react';

// stub acquireVsCodeApi before importing App
let lastMsg: any = null;
(global as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => { lastMsg = msg; },
    getState: () => ({}),
    setState: (_: any) => { },
});

import { App } from '../../../../src/webview/log-file-sources/App';

// helper to fill the main form inputs
async function fillForm(shortName: string, pattern: string) {
    const shortInput = screen.getByLabelText(/short name/i);
    fireEvent.change(shortInput, { target: { value: shortName } });
    const pathInput = screen.getByLabelText(/path \/ glob pattern/i);
    fireEvent.change(pathInput, { target: { value: pattern } });
}

describe('LogFileSources App', () => {
    beforeEach(() => {
        lastMsg = null;
    });

    it('sends save message without label field', () => {
        render(React.createElement(App));
        fillForm('foo', '/var/log/foo.log');
        // submit
        fireEvent.click(screen.getByText(/save/i));
        assert.ok(lastMsg, 'message should have been posted');
        assert.strictEqual(lastMsg.type, 'filepath-config:save');
        assert.strictEqual(lastMsg.config.shortName, 'foo');
        assert.strictEqual(lastMsg.config.pathPattern, '/var/log/foo.log');
        // label property must not exist
        assert.strictEqual('label' in lastMsg.config, false);
    });
});
