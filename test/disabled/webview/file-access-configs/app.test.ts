import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import sinon from 'sinon';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// stub acquireVsCodeApi before importing App
let lastMsg: any = null;
(global as any).acquireVsCodeApi = () => ({
    postMessage: (msg: any) => { lastMsg = msg; },
    getState: () => ({}),
    setState: (_: any) => { },
});

import { App } from '../../../../src/webview/file-access-configs/App.tsx';

describe('FileAccessConfigs App', () => {
    beforeEach(() => {
        lastMsg = null;
    });

    it('shows placeholder when there are no configs', () => {
        render(React.createElement(App));
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: [] } }));
        assert.ok(screen.getByText(/no file access configs/i));
    });

    it('filters list by search term and posts selectConfig on click', async () => {
        render(React.createElement(App));
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['one', 'two'] } }));
        await screen.findByText('one');
        const search = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
        fireEvent.change(search, { target: { value: 'tw' } });
        await new Promise(r => setTimeout(r, 250));
        assert.strictEqual(screen.queryByText('one'), null);
        const item = screen.getByText('two');
        fireEvent.click(item);
        assert.strictEqual(lastMsg.type, 'selectConfig');
        assert.strictEqual(lastMsg.name, 'two');
    });

    it('renders adapter type selector and shows/hides fields', async () => {
        render(React.createElement(App));
        // initial empty config
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: [] } }));
        // adapter dropdown should exist with three options
        const select = await screen.findByLabelText(/adapter type/i) as HTMLSelectElement;
        assert.ok(select);
        // ensure theming classes applied (VSCode input background)
        assert.ok(select.className.includes('bg-[--input-bg]'));
        assert.ok(select.className.includes('border-[--input-border]'));
        assert.ok(select.className.includes('appearance-none'));
        assert.ok(select.className.includes('text-foreground'));
        assert.strictEqual(select.style.backgroundColor, 'var(--input-bg)');
        assert.ok(select.querySelector('option[value="local"]'));
        assert.ok(select.querySelector('option[value="sftp"]'));
        assert.ok(select.querySelector('option[value="smb"]'));
        // default is local so basePath input should appear
        assert.ok(screen.getByLabelText(/base path/i));
        // switch to sftp
        fireEvent.change(select, { target: { value: 'sftp' } });
        assert.ok(screen.getByLabelText(/host/i));
        assert.ok(screen.getByLabelText(/username/i));
        // basePath should no longer be in document
        assert.strictEqual(screen.queryByLabelText(/base path/i), null);
        // switch to smb
        fireEvent.change(select, { target: { value: 'smb' } });
        assert.ok(screen.getByLabelText(/share/i));
        assert.strictEqual(screen.queryByLabelText(/host/i), null);
    });

    it('loads configData message and populates adapter settings', async () => {
        render(React.createElement(App));
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: [] } }));
        const cfg = { shortName: 'abc', adapterType: 'sftp', settings: { host: 'h', username: 'u' } };
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'configData', config: cfg } }));
        // dropdown should show sftp
        const select = await screen.findByLabelText(/adapter type/i) as HTMLSelectElement;
        assert.strictEqual(select.value, 'sftp');
        // host and username inputs should have values
        assert.strictEqual((screen.getByLabelText(/host/i) as HTMLInputElement).value, 'h');
        assert.strictEqual((screen.getByLabelText(/username/i) as HTMLInputElement).value, 'u');
    });

    // verify dirty logic doesn't make the blank form appear modified
    it('does not prompt or block selection when starting with a new/clean config', async () => {
        render(React.createElement(App));
        const confirmSpy = sinon.spy();
        window.confirm = confirmSpy;
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['foo'] } }));
        const item = await screen.findByText('foo');
        fireEvent.click(item);
        assert.strictEqual(lastMsg.type, 'selectConfig');
        assert.strictEqual(lastMsg.name, 'foo');
        assert.strictEqual(confirmSpy.called, false, 'should not have asked to discard unsaved changes');
    });

    it('prompts when the form has been modified and blocks selection if cancelled', async () => {
        render(React.createElement(App));
        const confirmStub = sinon.stub().returns(false);
        window.confirm = confirmStub;
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'init', configs: ['a', 'b'] } }));
        // make a change so the form becomes dirty
        const shortNameInput = await screen.findByLabelText(/short name/i) as HTMLInputElement;
        fireEvent.change(shortNameInput, { target: { value: 'changed' } });
        // try selecting the second item
        const item = await screen.findByText('b');
        fireEvent.click(item);
        // should not have posted a selectConfig message because confirm returned false
        assert.strictEqual(lastMsg, null);
        assert.ok(confirmStub.called, 'confirm should have been shown');
    });
});
