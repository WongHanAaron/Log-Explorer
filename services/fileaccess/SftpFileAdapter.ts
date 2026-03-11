import { FileAccessAdapter } from './FileAccessAdapter';
import { SftpConfig, ListDirOptions } from '../../domain/config/fileaccess/types';
import Client from 'ssh2-sftp-client';
import { walkDir } from './utils';

export class SftpFileAdapter extends FileAccessAdapter {
    private client: Client;
    private connected = false;

    constructor(protected readonly config: SftpConfig) {
        super(config);
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
