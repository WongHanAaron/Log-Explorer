import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormPage } from '../../../../src/webview/new-session/components/FormPage';
import type { FormValues, TemplateData, SourceLogConfigReference } from '../../../../src/webview/new-session/types.ts';

// minimal props for rendering the form; most handlers are no-op
const baseProps = {
    selectedTemplate: null as TemplateData | null,
    form: {
        name: '',
        description: '',
        timeStart: '',
        parameters: {},
        sources: [],
    } as FormValues,
    onFormChange: (_: FormValues) => { },
    error: null as string | null,
    onBack: () => { },
    onSubmit: (_: FormValues) => { },
    onSaveTemplate: (_: Omit<TemplateData, 'id'>) => { },
    fileConfigs: [] as string[],
    logConfigs: [] as string[],
};

describe.skip('NewSession FormPage', () => {
    it('allows the user to update the timeStart field without throwing', () => {
        let form = { ...baseProps.form };
        const props = {
            ...baseProps,
            form,
            onFormChange: (v: FormValues) => { form = v; },
        };

        render(React.createElement(FormPage, props));

        const input = screen.getByLabelText(/Time Start/i) as HTMLInputElement;
        // simulate picking a date/time
        fireEvent.change(input, { target: { value: '2026-03-12T10:00' } });
        assert.strictEqual(form.timeStart, '2026-03-12T10:00');
    });

    it('does not crash when the `sources` array is missing and the user edits time', () => {
        // mimic a session that forgot to include the sources property
        let form: any = { ...baseProps.form, sources: undefined };
        const props = {
            ...baseProps,
            form,
            onFormChange: (v: FormValues) => { form = v; },
        } as any;

        // rendering should not throw even though sources is undefined
        assert.doesNotThrow(() => render(React.createElement(FormPage, props)));
        const input = screen.getByLabelText(/Time Start/i) as HTMLInputElement;
        // editing the time also shouldn't throw
        assert.doesNotThrow(() => fireEvent.change(input, { target: { value: '2026-03-12T12:00' } }));
    });
});
