import { expect } from 'chai';
import { walkDir } from '../../../services/fileaccess/utils';
import { ListDirOptions } from '../../../domain/config/fileaccess/types';

describe('walkDir helper', () => {
    // simulate a simple tree:
    // /root
    //   file1
    //   dirA/
    //     file2
    //     dirB/
    //       file3
    const tree: Record<string, { name: string; isDirectory: boolean }[]> = {
        '': [{ name: 'file1', isDirectory: false }, { name: 'dirA', isDirectory: true }],
        'dirA': [{ name: 'file2', isDirectory: false }, { name: 'dirB', isDirectory: true }],
        'dirA/dirB': [{ name: 'file3', isDirectory: false }],
    };

    const readdir = async (p: string) => {
        const key = p === '.' ? '' : p.replace(/\/g, '/');
    return tree[key] || [];
    };
    const stat = async (p: string) => {
        const parts = p.split('/');
        const name = parts.pop();
        const parent = parts.join('/');
        const list = tree[parent] || [];
        const entry = list.find(e => e.name === name);
        return { isDirectory: !!entry && entry.isDirectory };
    };

    it('lists non-recursively', async () => {
        const res = await walkDir(readdir, stat, '.', { recursive: false });
        expect(res).to.deep.equal(['file1', 'dirA']);
    });

    it('lists recursively with maxDepth', async () => {
        const res = await walkDir(readdir, stat, '.', { recursive: true, maxDepth: 1 });
        expect(res).to.include('file1');
        expect(res).to.include('dirA');
        expect(res).to.include('dirA/file2');
        expect(res).to.not.include('dirA/dirB/file3');
    });
});
