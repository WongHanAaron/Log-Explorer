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
    onShortNameBlur: () => { },
    onSave: () => { },
    onCancel: () => { },
    originalShortName: null,
    canSave: false,
};

describe('LogFileSources FormPage', () => {
    it('does not render a Label input field', () => {
        render(React.createElement(FormPage, baseProps));
        // the old "Label" field should no longer exist
        const labelInput = screen.queryByLabelText(/Label/i);
        assert.strictEqual(labelInput, null);
    });

    it('only shows Save button when canSave is true', () => {
        // when canSave is false it should not render
        render(React.createElement(FormPage, { ...baseProps, canSave: false }));
        assert.strictEqual(screen.queryByText(/save/i), null);

        // re-render with canSave true and button should appear
        render(React.createElement(FormPage, { ...baseProps, canSave: true }));
        const saveBtn = screen.getByText(/save/i);
        assert.ok(saveBtn);
    });
});
