import { expect } from 'chai';
import { FileAccessAdapter } from '../../../../services/fileaccess/FileAccessAdapter.ts';
// types only
import type { FileSourceConfig, ListDirOptions } from '../../../../domain/config/fileaccess/types.ts';

class DummyAdapter extends FileAccessAdapter {
    readFile(path: string): Promise<Buffer> {
        if (path === 'exists.txt') {
            return Promise.resolve(Buffer.from('hello'));
        }
        return Promise.reject(new Error('not found'));
    }
    listDir(path: string, options?: ListDirOptions): Promise<string[]> {
        if (path === '.') {
            return Promise.resolve(['a.txt', 'b', 'b/c.txt']);
        }
        return Promise.resolve([]);
    }
}

describe('FileAccessAdapter base class', () => {
    const config: FileSourceConfig = { type: 'local', basePath: '/tmp' };
    const adapter = new DummyAdapter(config);

    it('should normalize path removing leading slash', () => {
        // @ts-ignore
        expect(adapter.normalizePath('/foo')).to.equal('foo');
    });

    it('readFile forwards to subclass and error propagates', async () => {
        const data = await adapter.readFile('exists.txt');
        expect(data.toString()).to.equal('hello');
        await expect(adapter.readFile('missing')).to.be.rejectedWith('not found');
    });
});
