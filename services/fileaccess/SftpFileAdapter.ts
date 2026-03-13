import { FileAccessAdapter } from './FileAccessAdapter.ts';
// types are only needed for compile-time; use `import()`-style aliases so
// no runtime `import` statement is generated (which would fail because the
// module only exports interfaces/type aliases).
type SftpConfig = import('../../domain/config/fileaccess/types.ts').SftpConfig;
type ListDirOptions = import('../../domain/config/fileaccess/types.ts').ListDirOptions;

import Client from 'ssh2-sftp-client';
import { walkDir } from './utils.ts';

export class SftpFileAdapter extends FileAccessAdapter {
    private client: Client;
    private connected = false;

    protected readonly config: SftpConfig;

    constructor(config: SftpConfig) {
        super(config);
        this.config = config;
        this.client = new Client();
    }

    private async ensureConnected() {
        if (!this.connected) {
            await this.client.connect({
                host: this.config.host,
                port: this.config.port || 22,
                username: this.config.username,
                password: this.config.password,
                privateKey: this.config.privateKey
            });
            this.connected = true;
            // ssh2-sftp-client no longer accepts a cwd argument; if a root
            // directory is configured we will prefix paths manually instead of
            // relying on the client to change directory.
        }
    }

    private makePath(p: string): string {
        const normalized = this.normalizePath(p);
        return this.config.root && normalized
            ? `${this.config.root.replace(/\/+$/, '')}/${normalized}`
            : this.config.root || normalized;
    }

    async readFile(p: string): Promise<Buffer> {
        await this.ensureConnected();
        const full = this.makePath(p);
        const data = await this.client.get(full);
        return data as Buffer;
    }

    async listDir(p: string, options: ListDirOptions = {}): Promise<string[]> {
        await this.ensureConnected();
        const normalized = this.makePath(p) || '.';
        const entries = await this.client.list(normalized);
        const statFn = async (path: string) => {
            const s = await this.client.stat(path);
            return { isDirectory: s.isDirectory };
        };
        return walkDir(
            async (path) => await this.client.list(path),
            statFn,
            normalized,
            options
        );
    }

    async stat(p: string) {
        await this.ensureConnected();
        return this.client.stat(this.makePath(p));
    }

    async delete(p: string): Promise<void> {
        await this.ensureConnected();
        await this.client.delete(this.makePath(p));
    }

    async close(): Promise<void> {
        await this.client.end();
    }
}
