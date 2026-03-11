import { FileSourceConfig, ListDirOptions } from '../../domain/config/fileaccess/types';

export abstract class FileAccessAdapter {
    constructor(protected readonly config: FileSourceConfig) { }

    abstract readFile(path: string): Promise<Buffer>;
    abstract listDir(path: string, options?: ListDirOptions): Promise<string[]>;

    // optional helpers
    stat?(path: string): Promise<any>;
    delete?(path: string): Promise<void>;

    protected normalizePath(p: string): string {
        // ensure no leading/trailing slashes, resolve relative to config if necessary
        if (p.startsWith("/")) {
            return p.slice(1);
        }
        return p;
    }
}
