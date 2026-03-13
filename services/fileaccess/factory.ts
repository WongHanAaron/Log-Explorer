// compile-time-only type

type FileSourceConfig = import('../../domain/config/fileaccess/types.ts').FileSourceConfig;

import { LocalFileAdapter } from './LocalFileAdapter.ts';
import { SftpFileAdapter } from './SftpFileAdapter.ts';
import { SmbFileAdapter } from './SmbFileAdapter.ts';

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
