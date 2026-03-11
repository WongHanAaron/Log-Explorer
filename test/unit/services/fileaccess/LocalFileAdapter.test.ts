dimport { expect } from 'chai';
import { LocalFileAdapter } from '../../../services/fileaccess/LocalFileAdapter';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('LocalFileAdapter', () => {
    const tmpDir = path.join(__dirname, '..', '..', 'tmp-local-adapter');
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
        await expect(adapter.readFile('not-there.txt')).to.be.rejectedWith(Error);
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
