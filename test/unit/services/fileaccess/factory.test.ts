import { expect } from 'chai';
import { createFileAdapter } from '../../../services/fileaccess/factory';
import { FileSourceConfig } from '../../../domain/config/fileaccess/types';
import { LocalFileAdapter } from '../../../services/fileaccess/LocalFileAdapter';
import { SftpFileAdapter } from '../../../services/fileaccess/SftpFileAdapter';
import { SmbFileAdapter } from '../../../services/fileaccess/SmbFileAdapter';

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
