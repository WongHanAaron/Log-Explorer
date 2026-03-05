import 'jsdom-global/register.js';
import * as React from 'react';
import * as assert from 'assert';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagSet } from '../../../src/webview/shared/components/tag/TagSet';

describe('TagSet component', () => {
    it('displays initial tags and adds a new one', () => {
        const tags: string[] = ['one'];
        let added: string | null = null;
        const add = (tag: string) => { added = tag; };
        let renamedIndex: number | null = null;
        let renamedValue: string | null = null;
        const rename = (idx: number, v: string) => { renamedIndex = idx; renamedValue = v; };
        let removedIndex: number | null = null;
        const remove = (idx: number) => { removedIndex = idx; };

        render(
            React.createElement(TagSet, { tags, onAdd: add, onRename: rename, onRemove: remove })
        );

        // initial pill should show exact lowercase text and be centered
        const pill = screen.getByText('one');
        assert.strictEqual(pill !== null, true);
        // styling: ensure we didn't accidentally apply capitalize and text is centered
        const pillElement = pill.closest('button');
        assert.ok(pillElement, 'pill should be a button');
        assert.strictEqual(pillElement?.classList.contains('capitalize'), false);
        assert.strictEqual(pillElement?.classList.contains('text-center'), true);
        // vertical shift applied to text
        const span = pillElement?.querySelector('span');
        assert.ok(span?.classList.contains('relative'));
        assert.ok(span?.classList.contains('-top-px'));
        // icon is present but initially hidden via opacity utility class
        const svg = pillElement?.querySelector('svg');
        assert.ok(svg, 'should have remove icon');
        assert.strictEqual(svg?.classList.contains('opacity-0'), true);
        // simulate hover to reveal icon and shift text
        fireEvent.mouseOver(pillElement!);
        assert.strictEqual(svg?.classList.contains('opacity-100'), true);
        const span2 = pillElement?.querySelector('span');
        assert.ok(span2?.classList.contains('-translate-x-2'));
        // click add
        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        const input = screen.getByRole('textbox');
        // input text should be centered
        assert.strictEqual(input.classList.contains('text-center'), true);
        fireEvent.change(input, { target: { value: 'two' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        assert.strictEqual(added, 'two');
    });

    it('converts uppercase input to lowercase when adding', () => {
        const tags: string[] = [];
        let added: string | null = null;
        const add = (tag: string) => { added = tag; };
        const rename = () => { };
        const remove = () => { };

        render(
            React.createElement(TagSet, { tags, onAdd: add, onRename: rename, onRemove: remove })
        );

        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'NEW' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        assert.strictEqual(added, 'new');
    });

    it('merges duplicate tags case-insensitively', () => {
        let tags = ['Foo'];
        const add = (tag: string) => { tags.push(tag); };
        let renameCalled = false;
        const rename = (idx: number, v: string) => { renameCalled = true; };
        const remove = () => { };

        render(
            React.createElement(TagSet, { tags, onAdd: add, onRename: rename, onRemove: remove })
        );

        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'foo' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // since merge happens internally, rename or remove should have been called
        assert.strictEqual(renameCalled, true);
    });
});
