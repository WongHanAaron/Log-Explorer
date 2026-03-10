import type * as vscode from 'vscode';

// runtime proxy: when running inside actual VSCode the real module is
// available, but during unit tests there is no such package.  We lazily
// require it and fall back to an empty object so that tests can supply their
// own substitutes (e.g. fake FileType, FileSystemError, Uri, etc.) via
// augmentation or by mutating this object.
export const vscodeRuntime: Partial<typeof vscode> = (() => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-return
        return require('vscode');
    } catch {
        return {} as any;
    }
})();

import { FilepathConfig } from '../domain/filepath-config';
import { FileLogLineConfig } from '../domain/filelog-config';
import { logger } from '../utils/logger';


// small abstraction so callers can inject a fake in tests.  The real
// workspace API exposes a `FileSystem` object which extends
// `FileSystemProvider` with additional helpers and events, so we alias that
// concrete type here rather than duplicating its members.
export type FsProvider = vscode.FileSystem;
// A factory used to create filesystem watchers.  This is injectable for
// unit tests; the default uses `vscode.workspace.createFileSystemWatcher`.
export type WatcherFactory = (
    pattern: vscode.GlobPattern
) => vscode.FileSystemWatcher;

// ── Categories & directory helpers ───────────────────────────────────────────

/**
 * Represents one of the two supported configuration categories.
 * Used throughout the public API to avoid magic strings.
 */
// Use a plain const object and string union instead of a TypeScript enum.
// ts-node in "strip-only" mode had trouble with enums during tests, so this
// pattern keeps the runtime values available while avoiding the enum syntax.
export const ConfigCategory = {
    Filepath: 'filepath',
    Filelog: 'filelog',
} as const;
export type ConfigCategory = typeof ConfigCategory[keyof typeof ConfigCategory];


/**
 * Returns the workspace-relative directory URI for the given category.
 */
function getConfigDir(
    workspaceRoot: vscode.Uri,
    category: ConfigCategory
): vscode.Uri {
    const subdir =
        category === ConfigCategory.Filepath
            ? 'filepath-configs'
            : 'filelog-configs';
    return (vscodeRuntime.Uri as any).joinPath(workspaceRoot, '.logex', subdir);
}


// ── Subscription infrastructure & high-level API ─────────────────────────────

export type ConfigAddedCallback = (shortName: string) => void;

class ConfigSubscriptionRegistry implements vscode.Disposable {
    private subscribers = new Map<ConfigCategory, Set<ConfigAddedCallback>>();
    // reuse logger to emit file watch diagnostics
    private readonly logger = logger;
    private readonly watchers: vscode.FileSystemWatcher[] = [];
    private workspaceRoot: vscode.Uri;
    private watcherFactory: WatcherFactory;

    constructor(
        workspaceRoot: vscode.Uri,
        watcherFactory: WatcherFactory
    ) {
        this.workspaceRoot = workspaceRoot;
        this.watcherFactory = watcherFactory;
        // create watchers for both category directories
        const fpPattern = new (vscodeRuntime.RelativePattern as any)(
            this.workspaceRoot,
            '.logex/filepath-configs/*.json'
        );
        const flPattern = new (vscodeRuntime.RelativePattern as any)(
            this.workspaceRoot,
            '.logex/filelog-configs/*.json'
        );
        this.watchers.push(this.watcherFactory(fpPattern));
        this.watchers.push(this.watcherFactory(flPattern));

        for (const w of this.watchers) {
            w.onDidCreate((uri) => this.handleFileChanges([{ type: (vscodeRuntime.FileChangeType as any).Created, uri }]));
            w.onDidDelete((uri) => this.handleFileChanges([{ type: (vscodeRuntime.FileChangeType as any).Deleted, uri }]));
        }
    }

    dispose(): void {
        for (const w of this.watchers) {
            w.dispose();
        }
        this.subscribers.clear();
    }

    subscribe(
        category: ConfigCategory,
        cb: ConfigAddedCallback
    ): vscode.Disposable {
        let set = this.subscribers.get(category);
        if (!set) {
            set = new Set();
            this.subscribers.set(category, set);
        }

        set.add(cb);

        let disposed = false;
        return new (vscodeRuntime.Disposable as any)(() => {
            if (disposed) {
                return;
            }
            disposed = true;
            set!.delete(cb);
        });
    }

    private handleFileChanges(changes: readonly vscode.FileChangeEvent[]): void {
        for (const change of changes) {
            if (change.type !== (vscodeRuntime.FileChangeType as any).Created &&
                change.type !== (vscodeRuntime.FileChangeType as any).Deleted) {
                continue;
            }

            const parsed = this.tryParseConfigAdded(change.uri);
            if (!parsed) {
                continue;
            }

            // only log deletion events here; create/update are already logged in writeConfig
            if (change.type === (vscodeRuntime.FileChangeType as any).Deleted) {
                logger.info(`filesystem deleted config: ${parsed.category}/${parsed.shortName}`);
            }

            this.notify(parsed.category, parsed.shortName);
        }
    }

    private tryParseConfigAdded(
        uri: vscode.Uri
    ): { category: ConfigCategory; shortName: string } | undefined {
        if (!uri.path.endsWith('.json')) {
            return undefined;
        }

        const normalizedPath = uri.path.toLowerCase();
        for (const category of [ConfigCategory.Filepath, ConfigCategory.Filelog]) {
            const categoryDir = getConfigDir(this.workspaceRoot, category)
                .path
                .toLowerCase();
            const prefix = `${categoryDir}/`;
            if (!normalizedPath.startsWith(prefix)) {
                continue;
            }

            const relative = uri.path.slice(prefix.length);
            if (relative.includes('/')) {
                return undefined;
            }

            return {
                category,
                shortName: relative.slice(0, -5),
            };
        }

        return undefined;
    }

    private notify(category: ConfigCategory, shortName: string): void {
        const set = this.subscribers.get(category);
        if (!set) {
            return;
        }

        for (const cb of Array.from(set)) {
            try {
                cb(shortName);
            } catch (err) {
                console.error(`subscriber error for ${category}/${shortName}`, err);
            }
        }
    }
}

// ── vscode.workspace.fs I/O helpers ──────────────────────────────────────────

const ENCODING = 'utf-8';

// These lower-level operations are now implemented as private instance
// methods on `ConfigStore` so that tests can inject a fake filesystem.  The
// free functions earlier were moved inside the class; they are no longer
// needed outside and therefore have been removed.

// ── (high-level helpers are now methods on the ConfigStore class) ───────────


// ── Object-oriented wrapper for convenience ─────────────────────────────────

/**
 * Thin class wrapper around the free functions, binding a workspace root.
 * Consumers may prefer this style for dependency injection or testability.
 */
export class ConfigStore {
    private readonly subscriptions: ConfigSubscriptionRegistry;
    private workspaceRoot: vscode.Uri;
    private fs: FsProvider;
    private watcherFactory: WatcherFactory;

    // formerly the standalone helper
    static configFilename(shortName: string): string {
        return `${shortName}.json`;
    }

    constructor(
        workspaceRoot: vscode.Uri,
        fs?: FsProvider,
        watcherFactory?: WatcherFactory
    ) {
        // Determine real vscode module if available (in extension runtime); fall
        // back to the injected runtime proxy used for testing.
        const realVscode: any = (() => {
            try {
                return require('vscode');
            } catch {
                return vscodeRuntime;
            }
        })();

        this.workspaceRoot = workspaceRoot;
        this.fs = fs ?? realVscode.workspace.fs;
        // bind watcher factory to workspace since callers expect that signature
        this.watcherFactory = watcherFactory ?? realVscode.workspace.createFileSystemWatcher.bind(realVscode.workspace);
        this.subscriptions = new ConfigSubscriptionRegistry(workspaceRoot, this.watcherFactory);
    }

    dispose(): void {
        this.subscriptions.dispose();
    }

    private getCategoryDir(category: ConfigCategory): vscode.Uri {
        return getConfigDir(this.workspaceRoot, category);
    }

    // lower-level helpers operate on a directory and use the injected fs

    private async listConfigs(dir: vscode.Uri): Promise<string[]> {
        try {
            const entries = await this.fs.readDirectory(dir);
            return entries
                .filter(([name, type]) =>
                    type === (vscodeRuntime.FileType as any).File && name.endsWith('.json')
                )
                .map(([name]) => name.slice(0, -5));
        } catch {
            return [];
        }
    }

    private async readFilepathConfig(
        dir: vscode.Uri,
        shortName: string
    ): Promise<FilepathConfig> {
        const uri = (vscodeRuntime.Uri as any).joinPath(dir, ConfigStore.configFilename(shortName));
        const bytes = await this.fs.readFile(uri);
        const json = Buffer.from(bytes).toString(ENCODING);
        const [cfg, err] = await FilepathConfig.fromJson(json);
        if (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Malformed JSON: could not parse filepath config`);
            }
            throw err;
        }
        return cfg as FilepathConfig;
    }

    private async readFileLogLineConfig(
        dir: vscode.Uri,
        shortName: string
    ): Promise<FileLogLineConfig> {
        const uri = (vscodeRuntime.Uri as any).joinPath(dir, ConfigStore.configFilename(shortName));
        const bytes = await this.fs.readFile(uri);
        const json = Buffer.from(bytes).toString(ENCODING);

        // mirror the dispatch logic from the old parser
        let plain: any;
        try {
            plain = JSON.parse(json);
        } catch {
            throw new Error(`Malformed JSON: could not parse filelog config`);
        }

        let tuple: [FileLogLineConfig | null, any | null];
        switch (plain.type) {
            case 'text':
                tuple = await (require('../domain/filelog-config').TextLineConfig as any).fromJson(json);
                break;
            case 'xml':
                tuple = await (require('../domain/filelog-config').XmlLineConfig as any).fromJson(json);
                break;
            case 'json':
                tuple = await (require('../domain/filelog-config').JsonLineConfig as any).fromJson(json);
                break;
            default:
                throw new Error(`Invalid FileLogLineConfig: unknown type`);
        }

        const [cfg, err] = tuple;
        if (err) {
            throw err;
        }
        return cfg as FileLogLineConfig;
    }

    private async writeConfigInternal(
        dir: vscode.Uri,
        shortName: string,
        data: FilepathConfig | FileLogLineConfig
    ): Promise<void> {
        const uri = (vscodeRuntime.Uri as any).joinPath(dir, ConfigStore.configFilename(shortName));
        // if the object has a toJson method use it; otherwise fall back to
        // JSON.stringify (this lets us write plain objects during migration).
        let json: string;
        if (typeof (data as any).toJson === 'function') {
            json = (data as any).toJson();
        } else {
            json = JSON.stringify(data, null, 4);
        }
        // `vscode.FileSystem.writeFile` accepts only uri and content on
        // current versions of the API (options are not needed).
        await this.fs.writeFile(uri, Buffer.from(json, ENCODING));
    }

    private async deleteConfigInternal(
        dir: vscode.Uri,
        shortName: string
    ): Promise<void> {
        const uri = (vscodeRuntime.Uri as any).joinPath(dir, ConfigStore.configFilename(shortName));
        try {
            await this.fs.delete(uri);
        } catch {
            // silent
        }
    }

    private async configExistsInternal(
        dir: vscode.Uri,
        shortName: string
    ): Promise<boolean> {
        const uri = (vscodeRuntime.Uri as any).joinPath(dir, ConfigStore.configFilename(shortName));
        try {
            await this.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    // public API -----------------------------------------------------------

    listConfigNames(category: ConfigCategory): Promise<string[]> {
        return this.listConfigs(this.getCategoryDir(category));
    }

    async getConfig(
        category: ConfigCategory,
        shortName: string
    ): Promise<FilepathConfig | FileLogLineConfig> {
        const dir = this.getCategoryDir(category);
        try {
            switch (category) {
                case ConfigCategory.Filepath:
                    return await this.readFilepathConfig(dir, shortName);
                case ConfigCategory.Filelog:
                    return await this.readFileLogLineConfig(dir, shortName);
                default:
                    throw new Error(`Unknown category: ${category}`);
            }
        } catch (err: any) {
            if (err && err.code === 'FileNotFound') {
                throw new Error(`Config not found: ${category}/${shortName}`);
            }
            throw err;
        }
    }

    subscribeConfigAdded(
        category: ConfigCategory,
        cb: ConfigAddedCallback
    ): vscode.Disposable {
        return this.subscriptions.subscribe(category, cb);
    }

    async writeConfig(
        category: ConfigCategory,
        shortName: string,
        data: FilepathConfig | FileLogLineConfig
    ): Promise<void> {
        const dir = this.getCategoryDir(category);
        // determine whether this is a create or update
        let action = 'create';
        try {
            const exists = await this.configExistsInternal(dir, shortName);
            if (exists) {
                action = 'update';
            }
        } catch {
            // if stat fails for any reason, treat as create
            action = 'create';
        }
        await this.writeConfigInternal(dir, shortName, data);
        logger.info(`Config ${action}: ${category}/${shortName}`);
    }

    async deleteConfig(category: ConfigCategory, shortName: string): Promise<void> {
        await this.deleteConfigInternal(
            this.getCategoryDir(category),
            shortName
        );
        logger.info(`Config delete: ${category}/${shortName}`);
    }

    configExists(
        category: ConfigCategory,
        shortName: string
    ): Promise<boolean> {
        return this.configExistsInternal(
            this.getCategoryDir(category),
            shortName
        );
    }

}

