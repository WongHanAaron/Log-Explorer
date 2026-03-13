// compile-time-only types

type FileSourceConfig = import('../../domain/config/fileaccess/types.ts').FileSourceConfig;
type ListDirOptions = import('../../domain/config/fileaccess/types.ts').ListDirOptions;


export abstract class FileAccessAdapter {
    protected readonly config: FileSourceConfig;

    constructor(config: FileSourceConfig) {
        this.config = config;
    }

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
