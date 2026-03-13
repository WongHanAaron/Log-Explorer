import { expect } from 'chai';
import { createFileAdapter } from '../../../../services/fileaccess/factory.ts';
import { FileSourceConfig } from '../../../../domain/config/fileaccess/types.ts';
import { LocalFileAdapter } from '../../../../services/fileaccess/LocalFileAdapter.ts';
import { SftpFileAdapter } from '../../../../services/fileaccess/SftpFileAdapter.ts';
import { SmbFileAdapter } from '../../../../services/fileaccess/SmbFileAdapter.ts';

describe('createFileAdapter', () => {
    it('returns LocalFileAdapter for local config', () => {
        const cfg: FileSourceConfig = { type: 'local', basePath: '/tmp' };
        const adapter = createFileAdapter(cfg);
        expect(adapter).to.be.instanceOf(LocalFileAdapter);
    });

    it('returns SftpFileAdapter for sftp config', () => {
        const cfg: FileSourceConfig = { type: 'sftp', host: 'x' };
        const adapter = createFileAdapter(cfg);
        expect(adapter).to.be.instanceOf(SftpFileAdapter);
    });

    it('returns SmbFileAdapter for smb config', () => {
        const cfg: FileSourceConfig = { type: 'smb', share: '\\server\\share' };
        const adapter = createFileAdapter(cfg);
        expect(adapter).to.be.instanceOf(SmbFileAdapter);
    });

    it('throws for unknown type', () => {
        const cfg = { type: 'foo' } as any as FileSourceConfig;
        expect(() => createFileAdapter(cfg)).to.throw(/unsupported/);
    });
});
