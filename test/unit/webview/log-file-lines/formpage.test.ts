import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen } from '@testing-library/react';
import { FormPage, TextField, XmlField, JsonField } from '../../../../src/webview/log-file-lines/components/FormPage';

const baseProps = {
    shortName: '',
    setShortName: (_: string) => { },
    description: '',
    setDescription: (_: string) => { },
    tags: [] as string[],
    onAddTag: (_: string) => { },
    onRenameTag: (_: number, __: string) => { },
    onRemoveTag: (_: number) => { },
    lineType: 'text' as const,
    setLineType: (_: any) => { },
    rootXpath: '',
    setRootXpath: (_: string) => { },
    textFields: [] as TextField[],
    setTextFields: (_: any) => { },
    xmlFields: [] as XmlField[],
    setXmlFields: (_: any) => { },
    jsonFields: [] as JsonField[],
    setJsonFields: (_: any) => { },
    isNew: true,
    errors: {},
    status: null,
    validateForm: () => true,
    onSubmit: (_: React.FormEvent) => { },
    onCancel: () => { },
    onTestRegex: (_: number) => { },
};

describe('LogFileLines FormPage', () => {
    it('does not render Label field and shows TagSet', () => {
        render(React.createElement(FormPage, baseProps));
        const labelInput = screen.queryByLabelText(/Label/i);
        assert.strictEqual(labelInput, null);
        assert.ok(screen.getByText(/Tags/i));
    });
});
