import * as vscode from 'vscode';
import { FilepathConfig, isFilepathConfig } from '../domain/filepath-config';
import { FileLogLineConfig, isFileLogLineConfig } from '../domain/filelog-config';
import { ConfigParser } from './config-parser';

// small abstraction so callers can inject a fake in tests.  The real
// workspace API exposes a `FileSystem` object which extends
// `FileSystemProvider` with additional helpers and events, so we alias that
// concrete type here rather than duplicating its members.
export type FsProvider = vscode.FileSystem;
export type FsChangeEventSource = {
    onDidChangeFile: vscode.Event<readonly vscode.FileChangeEvent[]>;
};

// ── Categories & directory helpers ───────────────────────────────────────────

/**
 * Represents one of the two supported configuration categories.
 * Used throughout the public API to avoid magic strings.
 */
export enum ConfigCategory {
    Filepath = 'filepath',
    Filelog = 'filelog',
}

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
    return vscode.Uri.joinPath(workspaceRoot, '.logex', subdir);
}


// ── Subscription infrastructure & high-level API ─────────────────────────────

export type ConfigAddedCallback = (shortName: string) => void;

class ConfigSubscriptionRegistry implements vscode.Disposable {
    private subscribers = new Map<ConfigCategory, Set<ConfigAddedCallback>>();
    private readonly fsSubscription: vscode.Disposable;

    constructor(
        private workspaceRoot: vscode.Uri,
        private fsEvents: FsChangeEventSource
    ) {
        this.fsSubscription = this.fsEvents.onDidChangeFile((changes: readonly vscode.FileChangeEvent[]) => {
            this.handleFileChanges(changes);
        });
    }

    dispose(): void {
        this.fsSubscription.dispose();
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
        return new vscode.Disposable(() => {
            if (disposed) {
                return;
            }
            disposed = true;
            set!.delete(cb);
        });
    }

    private handleFileChanges(changes: readonly vscode.FileChangeEvent[]): void {
        for (const change of changes) {
            if (change.type !== vscode.FileChangeType.Created) {
                continue;
            }

            const parsed = this.tryParseConfigAdded(change.uri);
            if (!parsed) {
                continue;
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

        for (const cb of set) {
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

    constructor(
        private workspaceRoot: vscode.Uri,
        private fs: FsProvider = vscode.workspace.fs,
        fsEvents: FsChangeEventSource = vscode.workspace.fs as unknown as FsChangeEventSource
    ) {
        this.subscriptions = new ConfigSubscriptionRegistry(workspaceRoot, fsEvents);
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
                    type === vscode.FileType.File && name.endsWith('.json')
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
        const uri = vscode.Uri.joinPath(dir, ConfigParser.configFilename(shortName));
        const bytes = await this.fs.readFile(uri);
        const json = Buffer.from(bytes).toString(ENCODING);
        return ConfigParser.parseFilepathConfig(json);
    }

    private async readFileLogLineConfig(
        dir: vscode.Uri,
        shortName: string
    ): Promise<FileLogLineConfig> {
        const uri = vscode.Uri.joinPath(dir, ConfigParser.configFilename(shortName));
        const bytes = await this.fs.readFile(uri);
        const json = Buffer.from(bytes).toString(ENCODING);
        return ConfigParser.parseFileLogLineConfig(json);
    }

    private async writeConfigInternal(
        dir: vscode.Uri,
        shortName: string,
        data: FilepathConfig | FileLogLineConfig
    ): Promise<void> {
        const uri = vscode.Uri.joinPath(dir, ConfigParser.configFilename(shortName));
        const json = JSON.stringify(data, null, 4);
        // `vscode.FileSystem.writeFile` accepts only uri and content on
        // current versions of the API (options are not needed).
        await this.fs.writeFile(uri, Buffer.from(json, ENCODING));
    }

    private async deleteConfigInternal(
        dir: vscode.Uri,
        shortName: string
    ): Promise<void> {
        const uri = vscode.Uri.joinPath(dir, ConfigParser.configFilename(shortName));
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
        const uri = vscode.Uri.joinPath(dir, ConfigParser.configFilename(shortName));
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

    writeConfig(
        category: ConfigCategory,
        shortName: string,
        data: FilepathConfig | FileLogLineConfig
    ): Promise<void> {
        return this.writeConfigInternal(
            this.getCategoryDir(category),
            shortName,
            data
        );
    }

    deleteConfig(category: ConfigCategory, shortName: string): Promise<void> {
        return this.deleteConfigInternal(
            this.getCategoryDir(category),
            shortName
        );
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

