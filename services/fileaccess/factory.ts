import { FileSourceConfig } from '../../domain/config/fileaccess/types';
import { LocalFileAdapter } from './LocalFileAdapter';
import { SftpFileAdapter } from './SftpFileAdapter';
import { SmbFileAdapter } from './SmbFileAdapter';

export function createFileAdapter(config: FileSourceConfig) {
    switch (config.type) {
        case 'local':
            return new LocalFileAdapter(config);
        case 'sftp':
            return new SftpFileAdapter(config);
        case 'smb':
            return new SmbFileAdapter(config);
        default:
            throw new Error(`unsupported file adapter type: ${(config as any).type}`);
    }
}
