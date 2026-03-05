import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen } from '@testing-library/react';
import { FormPage } from '../../../../src/webview/log-file-sources/components/FormPage.tsx';

// Minimal props for rendering; most handlers can be no-op
const baseProps = {
    shortName: '',
    setShortName: (_: string) => { },
    pathPattern: '',
    setPathPattern: (_: string) => { },
    description: '',
    setDescription: (_: string) => { },
    tags: [] as string[],
    onAddTag: (_: string) => { },
    onRenameTag: (_: number, __: string) => { },
    onRemoveTag: (_: number) => { },
    isNew: true,
    errors: {},
    status: null,
    validateForm: () => true,
    onShortNameBlur: () => { },
    onSubmit: (_: React.FormEvent) => { },
    onCancel: () => { },
    originalShortName: null,
};

describe('LogFileSources FormPage', () => {
    it('does not render a Label input field', () => {
        render(React.createElement(FormPage, baseProps));
        // the old "Label" field should no longer exist
        const labelInput = screen.queryByLabelText(/Label/i);
        assert.strictEqual(labelInput, null);
    });
});
