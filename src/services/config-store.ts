import * as vscode from 'vscode';
import { FilepathConfig, isFilepathConfig } from '../domain/filepath-config';
import { FileLogLineConfig, isFileLogLineConfig } from '../domain/filelog-config';

// small abstraction so callers can inject a fake in tests.  The real
// workspace API exposes a `FileSystem` object which extends
// `FileSystemProvider` with additional helpers and events, so we alias that
// concrete type here rather than duplicating its members.
export type FsProvider = vscode.FileSystem;

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


// ── Pure parsing logic encapsulated in a standalone class ──────────────────

/**
 * Helper class that provides filename conversion and JSON parsing for both
 * filepath and filelog configurations.  All methods are static so callers may
 * use them without instantiating the class.
 */
export class ConfigParser {
    static configFilename(shortName: string): string {
        return `${shortName}.json`;
    }

    static parseFilepathConfig(json: string): FilepathConfig {
        let obj: unknown;
        try {
            obj = JSON.parse(json);
        } catch {
            throw new Error(`Malformed JSON: could not parse filepath config`);
        }
        if (!isFilepathConfig(obj)) {
            throw new Error(`Invalid FilepathConfig: schema validation failed`);
        }
        return obj;
    }

    static parseFileLogLineConfig(json: string): FileLogLineConfig {
        let obj: unknown;
        try {
            obj = JSON.parse(json);
        } catch {
            throw new Error(`Malformed JSON: could not parse filelog config`);
        }
        if (!isFileLogLineConfig(obj)) {
            throw new Error(`Invalid FileLogLineConfig: schema validation failed`);
        }
        return obj;
    }
}

// ── Subscription infrastructure & high-level API ─────────────────────────────

export type ConfigAddedCallback = (shortName: string) => void;

// maintain a set of callbacks per category
const subscribers: Map<ConfigCategory, Set<ConfigAddedCallback>> = new Map();

/**
 * Subscribe to notifications when a new config is added to the given category.
 *
 * Returns a `Disposable` which may be used to cancel the subscription.  The
 * disposal operation is idempotent.
 */
function subscribeConfigAdded(
    category: ConfigCategory,
    cb: ConfigAddedCallback
): vscode.Disposable {
    let set = subscribers.get(category);
    if (!set) {
        set = new Set();
        subscribers.set(category, set);
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

/**
 * Internal helper invoked after a config file has been written.
 */
function notifyConfigAdded(category: ConfigCategory, shortName: string): void {
    const set = subscribers.get(category);
    if (!set) {
        return;
    }
    for (const cb of set) {
        try {
            cb(shortName);
        } catch (err) {
            // ignore subscriber errors to avoid cascading failures
            console.error(`subscriber error for ${category}/${shortName}`, err);
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
    constructor(
        private workspaceRoot: vscode.Uri,
        private fs: FsProvider = vscode.workspace.fs
    ) { }

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
        const category =
            (data as any).pathPattern !== undefined
                ? ConfigCategory.Filepath
                : ConfigCategory.Filelog;
        notifyConfigAdded(category, shortName);
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
        return subscribeConfigAdded(category, cb);
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

