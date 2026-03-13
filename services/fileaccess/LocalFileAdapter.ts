import { promises as fs } from 'fs';
import * as path from 'path';
import { FileAccessAdapter } from './FileAccessAdapter.ts';
// compile-time-only types

type LocalConfig = import('../../domain/config/fileaccess/types.ts').LocalConfig;
type ListDirOptions = import('../../domain/config/fileaccess/types.ts').ListDirOptions;


export class LocalFileAdapter extends FileAccessAdapter {
    protected readonly config: LocalConfig;

    constructor(config: LocalConfig) {
        super(config);
        this.config = config;
    }

    async readFile(p: string): Promise<Buffer> {
        const normalized = this.normalizePath(p);
        const full = path.resolve(this.config.basePath, normalized);
        return fs.readFile(full);
    }

    async listDir(p: string, options: ListDirOptions = {}): Promise<string[]> {
        const normalized = this.normalizePath(p) || '.';
        const full = path.resolve(this.config.basePath, normalized);
        return this.walk(full, options, 0);
    }

    private async walk(dir: string, options: ListDirOptions, depth: number): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const results: string[] = [];
        for (const entry of entries) {
            const rel = path.join(dir, entry.name).substring(this.config.basePath.length + 1);
            if (entry.isDirectory()) {
                results.push(rel);
                if (options.recursive) {
                    if (options.maxDepth === undefined || depth < options.maxDepth) {
                        const sub = await this.walk(path.join(dir, entry.name), options, depth + 1);
                        results.push(...sub);
                    }
                }
            } else {
                results.push(rel);
            }
        }
        return results;
    }

    async stat(p: string) {
        const normalized = this.normalizePath(p);
        const full = path.resolve(this.config.basePath, normalized);
        return fs.stat(full);
    }

    async delete(p: string): Promise<void> {
        const normalized = this.normalizePath(p);
        const full = path.resolve(this.config.basePath, normalized);
        await fs.unlink(full);
    }
}
