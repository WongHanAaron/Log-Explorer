import { expect } from 'chai';
import { SmbFileAdapter } from '../../../../services/fileaccess/SmbFileAdapter.ts';
import type { SmbConfig } from '../../../../domain/config/fileaccess/types.ts';

class FakeSmb {
    private tree: Record<string, any[]> = {
        '': [{ filename: 'file1', attributes: { isDirectory: false } }, { filename: 'dirA', attributes: { isDirectory: true } }],
        'dirA': [{ filename: 'file2', attributes: { isDirectory: false } }, { filename: 'dirB', attributes: { isDirectory: true } }],
        'dirA/dirB': [{ filename: 'file3', attributes: { isDirectory: false } }],
    };
    readFile(path: string, cb: any) {
        if (path === 'file1') cb(null, Buffer.from('hi')); else cb(new Error('not found'));
    }
    readdir(path: string, cb: any) {
        cb(null, this.tree[path] || []);
    }
    stat(path: string, cb: any) {
        const parts = path.split('/');
        const name = parts.pop();
        const dir = parts.join('/');
        const list = this.tree[dir] || [];
        const entry = list.find((e: any) => e.filename === name);
        cb(null, { isDirectory: () => entry ? entry.attributes.isDirectory : false });
    }
    unlink(path: string, cb: any) {
        cb(null);
    }
}

describe('SmbFileAdapter (stub)', () => {
    const config: SmbConfig = { type: 'smb', share: '\\SERVER\\SHARE' };
    let adapter: SmbFileAdapter;

    beforeEach(() => {
        adapter = new SmbFileAdapter(config);
        (adapter as any).client = new FakeSmb();
    });

    it('reads file', async () => {
        const buf = await adapter.readFile('file1');
        expect(buf.toString()).to.equal('hi');
    });

    it('propagates not found error', async () => {
        await expect(adapter.readFile('missing')).to.be.rejectedWith(Error);
    });

    it('lists recursively', async () => {
        const list = await adapter.listDir('', { recursive: true, maxDepth: 2 });
        expect(list).to.include('file1');
        expect(list).to.include('dirA/file2');
    });
});
