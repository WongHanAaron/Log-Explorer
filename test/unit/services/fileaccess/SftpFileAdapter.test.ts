import { expect } from 'chai';
import { SftpFileAdapter } from '../../../services/fileaccess/SftpFileAdapter';
import { SftpConfig } from '../../../domain/config/fileaccess/types';

// stub client for tests
class FakeSftp {
    private tree: Record<string, any[]> = {
        '.': [{ name: 'file1', type: '-' }, { name: 'dirA', type: 'd' }],
        './dirA': [{ name: 'file2', type: '-' }, { name: 'dirB', type: 'd' }],
        './dirA/dirB': [{ name: 'file3', type: '-' }],
    };
    sftp: boolean = true;
    async connect(opts: any) { return; }
    cwd(root: string) { return Promise.resolve(); }
    async get(path: string) {
        if (path === 'file1') return Buffer.from('hi');
        throw new Error('not found');
    }
    async list(path: string) {
        return this.tree[path] || [];
    }
    async stat(path: string) {
        const entries = this.tree[path] || [];
        return { isDirectory: !!entries && entries.length >= 0, isDirectory: () => false };
    }
    async delete(path: string) { }
}

describe('SftpFileAdapter (stub)', () => {
    const config: SftpConfig = { type: 'sftp', host: 'x' };
    let adapter: SftpFileAdapter;

    beforeEach(() => {
        adapter = new SftpFileAdapter(config);
        // override internal client
        (adapter as any).client = new FakeSftp();
    });

    it('reads file', async () => {
        const buf = await adapter.readFile('file1');
        expect(buf.toString()).to.equal('hi');
    });

    it('propagates not found error', async () => {
        await expect(adapter.readFile('missing')).to.be.rejectedWith(Error);
    });

    it('lists recursively', async () => {
        const list = await adapter.listDir('.', { recursive: true, maxDepth: 2 });
        expect(list).to.include('file1');
        expect(list).to.include('./dirA/file2');
    });
});
