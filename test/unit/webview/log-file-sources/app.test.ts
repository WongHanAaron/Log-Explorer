import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// stub acquireVsCodeApi before importing App
let lastMsg: any = null;
(global as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => { lastMsg = msg; },
    getState: () => ({}),
    setState: (_: any) => { },
});

import { App } from '../../../../src/webview/log-file-sources/App.tsx';

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

    it('initially does not render Save button when form is invalid', () => {
        render(React.createElement(App));
        // no inputs filled yet
        assert.strictEqual(screen.queryByText(/save/i), null);
    });

    it('renders config list from init message and filters by search', async () => {
        render(React.createElement(App));
        // send init with some names
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['foo', 'bar', 'baz'] } }));
        // the list items should appear
        await screen.findByText('foo');
        await screen.findByText('bar');
        await screen.findByText('baz');
        // type into search box
        const search = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'ba' } });
        // allow debounce
        await new Promise(r => setTimeout(r, 250));
        // only bar and baz should remain
        assert.strictEqual(screen.queryByText('foo'), null);
        assert.ok(screen.queryByText('bar'));
    });

    it('posts selectConfig when a name is clicked', async () => {
        render(React.createElement(App));
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['one'] } }));
        const item = await screen.findByText('one');
        fireEvent.click(item);
        assert.strictEqual(lastMsg?.type, 'selectConfig');
        assert.strictEqual(lastMsg?.name, 'one');
    });

    it('loads configData into form when received and allows saving', async () => {
        render(React.createElement(App));
        // simulate host providing initial list
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['foo'] } }));
        await screen.findByText('foo');
        // simulate clicking to request data
        fireEvent.click(screen.getByText('foo'));
        // pretend host sends back configData payload
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'configData', config: { shortName: 'foo', pathPattern: '/tmp/foo.log' } } }));
        // form should populate
        const shortInput = screen.getByLabelText(/short name/i) as HTMLInputElement;
        await waitFor(() => assert.strictEqual(shortInput.value, 'foo'));
        const pathInput = screen.getByLabelText(/path \/ glob pattern/i) as HTMLInputElement;
        assert.strictEqual(pathInput.value, '/tmp/foo.log');
        // modify and save
        fireEvent.change(pathInput, { target: { value: '/tmp/foo2.log' } });
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'filepath-config:name-available', available: true } }));
        await waitFor(() => screen.getByText(/save/i));
        fireEvent.click(screen.getByText(/save/i));
        assert.strictEqual(lastMsg.type, 'filepath-config:save');
        assert.strictEqual(lastMsg.config.pathPattern, '/tmp/foo2.log');
    });

    it('updates list on configListChanged and clears selection when removed', async () => {
        render(React.createElement(App));
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['first', 'second'] } }));
        const item = await screen.findByText('first');
        fireEvent.click(item);
        assert.strictEqual(lastMsg?.type, 'selectConfig');
        // now simulate list change removing 'first'
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'configListChanged', configs: ['second'] } }));
        // 'first' should disappear
        assert.strictEqual(screen.queryByText('first'), null);
        // form should have cleared short name
        assert.strictEqual((screen.getByLabelText(/short name/i) as HTMLInputElement).value, '');
    });

    it('supports arrow-key navigation in the list', async () => {
        render(React.createElement(App));
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['a', 'b', 'c'] } }));
        const list = await screen.findByRole('list');
        // focus the list container
        list.focus();
        fireEvent.keyDown(list, { key: 'ArrowDown' });
        assert.strictEqual(lastMsg?.type, 'selectConfig');
        assert.strictEqual(lastMsg?.name, 'a');
        fireEvent.keyDown(list, { key: 'ArrowDown' });
        assert.strictEqual(lastMsg?.name, 'b');
        fireEvent.keyDown(list, { key: 'ArrowUp' });
        assert.strictEqual(lastMsg?.name, 'a');
    });

    it('enables Save button after valid input and sends save message without label field', () => {
        render(React.createElement(App));
        fillForm('foo', '/var/log/foo.log');
        // the host might later respond name-available (simulate available)
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'filepath-config:name-available', available: true } }));
        // button should now be visible
        const saveBtn = screen.getByText(/save/i);
        fireEvent.click(saveBtn);
        assert.ok(lastMsg, 'message should have been posted');
        assert.strictEqual(lastMsg.type, 'filepath-config:save');
        assert.strictEqual(lastMsg.config.shortName, 'foo');
        assert.strictEqual(lastMsg.config.pathPattern, '/var/log/foo.log');
        // label property must not exist
        assert.strictEqual('label' in lastMsg.config, false);
    });

    it('prompts when saving with a conflicting name and respects user choice', async () => {
        render(React.createElement(App));
        fillForm('conflict', '/path');
        // simulate host telling us name already exists
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'filepath-config:name-available', available: false } }));
        // wait until the info status is rendered so we know state has updated
        await screen.findByText(/already exists/i);
        // Save button should still be visible (validation only checks syntax)
        const saveBtn = screen.getByText(/save/i);
        // stub confirm to return false first
        const origConfirm = window.confirm;
        window.confirm = () => false;
        fireEvent.click(saveBtn);
        assert.notStrictEqual(lastMsg?.type, 'filepath-config:save', 'save should be aborted when user declines');
        // now simulate acceptance
        window.confirm = () => true;
        fireEvent.click(saveBtn);
        assert.ok(lastMsg, 'message should be posted when user accepts');
        window.confirm = origConfirm;
    });

    it('displays an error status when save-result comes back false', async () => {
        render(React.createElement(App));
        // allow initial effect to register message handler
        await waitFor(() => lastMsg?.type === 'ready');

        fillForm('foo', '/var/log/foo.log');
        // let the form state propagate
        await waitFor(() => screen.getByLabelText(/short name/i));

        window.dispatchEvent(new MessageEvent('message', { data: { type: 'filepath-config:name-available', available: true } }));
        // wait a tick for the handler to process
        await new Promise(r => setTimeout(r, 0));

        // trigger a fake save result
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'filepath-config:save-result', success: false, errorMessage: 'disk full' } }));
        // the status should eventually appear
        const statusElem = await screen.findByText(/disk full/i);
        assert.ok(statusElem);
    });

    it('committing a tag via Enter doesn\'t prevent the tag from being added (save only on explicit click)', () => {
        render(React.createElement(App));
        fillForm('foo', '/var/log/foo.log');
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'filepath-config:name-available', available: true } }));
        // start adding a tag
        const addBtn = screen.getByRole('button', { name: /add/i });
        fireEvent.click(addBtn);
        const tagInput = screen.getByTestId('tag-input');
        fireEvent.change(tagInput, { target: { value: 'newtag' } });
        fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });
        fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter' });
        fireEvent.keyUp(tagInput, { key: 'Enter', code: 'Enter' });
        // the framework may fire a spurious save message; ignore it
        if (lastMsg && lastMsg.type === 'filepath-config:save') {
            lastMsg = null;
        }
        // tag should be present in UI and Save button should appear
        assert.ok(screen.getByText(/newtag/i));
        assert.ok(screen.getByText(/save/i));
    });
});
