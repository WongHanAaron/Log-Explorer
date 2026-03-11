// Configuration types for file access adapters

export interface LocalConfig {
    type: "local";
    basePath: string;
}

export interface SftpConfig {
    type: "sftp";
    host: string;
    port?: number;
    username?: string;
    password?: string;
    privateKey?: string | Buffer;
    root?: string;
}

export interface SmbConfig {
    type: "smb";
    share: string;
    username?: string;
    password?: string;
    domain?: string;
}

export type FileSourceConfig = LocalConfig | SftpConfig | SmbConfig;

export interface ListDirOptions {
    recursive?: boolean;
    maxDepth?: number;
}
