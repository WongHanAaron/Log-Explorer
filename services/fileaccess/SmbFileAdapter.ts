import { FileAccessAdapter } from './FileAccessAdapter';
import { SmbConfig, ListDirOptions } from '../../domain/config/fileaccess/types';
const SMB2 = require('smb2') as Smb2Constructor;
import { walkDir } from './utils';

type Smb2CallbackError = NodeJS.ErrnoException | null;

interface Smb2Stats {
    isDirectory(): boolean;
}

interface Smb2Client {
    readFile(path: string, callback: (err: Smb2CallbackError, data: Buffer) => void): void;
    readdir(path: string, callback: (err: Smb2CallbackError, files: string[]) => void): void;
    stat(path: string, callback: (err: Smb2CallbackError, stats: Smb2Stats) => void): void;
    unlink(path: string, callback: (err: Smb2CallbackError) => void): void;
}

type Smb2Constructor = new (options: {
    share: string;
    username?: string;
    password?: string;
    domain?: string;
}) => Smb2Client;

export class SmbFileAdapter extends FileAccessAdapter {
    private client: Smb2Client;

    constructor(protected readonly config: SmbConfig) {
        super(config);
        this.client = new SMB2({
            share: this.config.share,
            username: this.config.username,
            password: this.config.password,
            domain: this.config.domain,
        });
    }

    private async ensureReady() {
        // SMB2 client is ready immediately; nothing to do
        return;
    }

    async readFile(p: string): Promise<Buffer> {
        await this.ensureReady();
        const normalized = this.normalizePath(p);
        return new Promise<Buffer>((resolve, reject) => {
            this.client.readFile(normalized, (err: Smb2CallbackError, data: Buffer) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    }

    async listDir(p: string, options: ListDirOptions = {}): Promise<string[]> {
        await this.ensureReady();
        const normalized = this.normalizePath(p) || '';
        const readdir = (path: string) =>
            new Promise<any[]>((resolve, reject) => {
                this.client.readdir(path, (err: Smb2CallbackError, files: string[]) => {
                    if (err) return reject(err);
                    resolve(files);
                });
            });
        const statFn = (path: string) =>
            new Promise<{ isDirectory: boolean }>((resolve, reject) => {
                this.client.stat(path, (err: Smb2CallbackError, stats: Smb2Stats) => {
                    if (err) return reject(err);
                    resolve({ isDirectory: stats.isDirectory() });
                });
            });
        return walkDir(readdir, statFn, normalized, options);
    }

    async stat(p: string) {
        await this.ensureReady();
        return new Promise<any>((resolve, reject) => {
            this.client.stat(this.normalizePath(p), (err: Smb2CallbackError, stats: Smb2Stats) => {
                if (err) return reject(err);
                resolve(stats);
            });
        });
    }

    async delete(p: string): Promise<void> {
        await this.ensureReady();
        return new Promise<void>((resolve, reject) => {
            this.client.unlink(this.normalizePath(p), (err: Smb2CallbackError) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}
