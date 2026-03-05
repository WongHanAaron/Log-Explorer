import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen, fireEvent } from '@testing-library/react';

let lastMsg: any = null;
(global as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => { lastMsg = msg; },
    getState: () => ({}),
    setState: (_: any) => {},
});

import { App } from '../../../../src/webview/log-file-lines/App';

function fillShortAndSubmit() {
    const shortInput = screen.getByLabelText(/short name/i);
    fireEvent.change(shortInput, { target: { value: 'foo' } });
}

describe('LogFileLines App', () => {
    beforeEach(() => { lastMsg = null; });

    it('sends tags in save payload', () => {
        render(React.createElement(App));
        fillShortAndSubmit();
        // add a tag via UI (first Add button corresponds to tags)
        const addButtons = screen.getAllByRole('button', { name: /add/i });
        fireEvent.click(addButtons[0]);
        const textboxes = screen.getAllByRole('textbox');
        // first is shortName, second is tag input
        const input = textboxes[1];
        fireEvent.change(input, { target: { value: 'tag1' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        // submit form
        fireEvent.click(screen.getByText(/save/i));
        assert.ok(lastMsg);
        assert.strictEqual(lastMsg.type, 'filelog-config:save');
        assert.ok(Array.isArray(lastMsg.config.tags));
        assert.deepStrictEqual(lastMsg.config.tags, ['tag1']);
    });
});
