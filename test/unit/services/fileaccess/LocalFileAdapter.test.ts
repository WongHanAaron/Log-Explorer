import { expect } from 'chai';
import * as assert from 'assert';
import { LocalFileAdapter } from '../../../../services/fileaccess/LocalFileAdapter.ts';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('LocalFileAdapter', () => {
    // use workspace root rather than __dirname since tests run under ESM
    const tmpDir = path.join(process.cwd(), 'test', 'unit', 'services', 'fileaccess', 'tmp-local-adapter');
    const config = { type: 'local' as const, basePath: tmpDir };
    let adapter: LocalFileAdapter;

    before(async () => {
        await fs.mkdir(tmpDir, { recursive: true });
    });
    after(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    beforeEach(() => {
        adapter = new LocalFileAdapter(config);
    });

    it('reads existing file', async () => {
        const filepath = path.join(tmpDir, 'foo.txt');
        await fs.writeFile(filepath, 'hello');
        const data = await adapter.readFile('foo.txt');
        expect(data.toString()).to.equal('hello');
    });

    it('throws when file does not exist', async () => {
        await assert.rejects(() => adapter.readFile('not-there.txt'));
    });

    it('lists directory contents', async () => {
        await fs.writeFile(path.join(tmpDir, 'a.txt'), 'a');
        await fs.mkdir(path.join(tmpDir, 'sub'));
        await fs.writeFile(path.join(tmpDir, 'sub', 'b.txt'), 'b');
        const list = await adapter.listDir('.', { recursive: true });
        expect(list).to.include('a.txt');
        expect(list).to.include(path.join('sub', 'b.txt'));
    });
});
