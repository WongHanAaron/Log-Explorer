import * as vscode from 'vscode';
import { FilepathConfig, isFilepathConfig } from '../domain/filepath-config';
import { FileLogLineConfig, isFileLogLineConfig } from '../domain/filelog-config';

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
export function getConfigDir(
    workspaceRoot: vscode.Uri,
    category: ConfigCategory
): vscode.Uri {
    const subdir =
        category === ConfigCategory.Filepath
            ? 'filepath-configs'
            : 'filelog-configs';
    return vscode.Uri.joinPath(workspaceRoot, '.logex', subdir);
}


// ── Pure parsing helpers (unit-testable without vscode) ───────────────────────

/** Returns the JSON filename for the given short name. */
export function configFilename(shortName: string): string {
    return `${shortName}.json`;
}

/**
 * Parses a JSON string into a validated `FilepathConfig`.
 * @throws if the JSON is malformed or the object fails schema validation.
 */
export function parseFilepathConfig(json: string): FilepathConfig {
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

/**
 * Parses a JSON string into a validated `FileLogLineConfig`.
 * @throws if the JSON is malformed or the object fails schema validation.
 */
export function parseFileLogLineConfig(json: string): FileLogLineConfig {
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
export function subscribeConfigAdded(
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

/**
 * Lists all `.json` config files in the given directory.
 * Returns an array of short names (filenames without the `.json` extension).
 */
export async function listConfigs(dir: vscode.Uri): Promise<string[]> {
    try {
        const entries = await vscode.workspace.fs.readDirectory(dir);
        return entries
            .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.json'))
            .map(([name]) => name.slice(0, -5)); // strip .json
    } catch {
        return [];
    }
}

/**
 * Reads and parses a filepath config from disk.
 * @throws on I/O error or schema validation failure.
 */
export async function readFilepathConfig(
    dir: vscode.Uri,
    shortName: string
): Promise<FilepathConfig> {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    const bytes = await vscode.workspace.fs.readFile(uri);
    const json = Buffer.from(bytes).toString(ENCODING);
    return parseFilepathConfig(json);
}

/**
 * Reads and parses a file log line config from disk.
 * @throws on I/O error or schema validation failure.
 */
export async function readFileLogLineConfig(
    dir: vscode.Uri,
    shortName: string
): Promise<FileLogLineConfig> {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    const bytes = await vscode.workspace.fs.readFile(uri);
    const json = Buffer.from(bytes).toString(ENCODING);
    return parseFileLogLineConfig(json);
}

/**
 * Serialises and writes a config object to disk.
 * Overwrites any existing file with the same name.
 */
export async function writeConfig(
    dir: vscode.Uri,
    shortName: string,
    data: FilepathConfig | FileLogLineConfig
): Promise<void> {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    const json = JSON.stringify(data, null, 4);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(json, ENCODING));
    // notify subscribers based on which kind of object was written
    // determine category by inspecting `data` type discriminator
    const category =
        (data as any).pathPattern !== undefined
            ? ConfigCategory.Filepath
            : ConfigCategory.Filelog;
    notifyConfigAdded(category, shortName);
}

/**
 * Deletes the config file for the given short name.
 * Silently succeeds if the file does not exist.
 */
export async function deleteConfig(dir: vscode.Uri, shortName: string): Promise<void> {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    try {
        await vscode.workspace.fs.delete(uri);
    } catch {
        // file already absent — treat as success
    }
}

/**
 * Returns true if a config file for `shortName` exists in the directory.
 */
export async function configExists(dir: vscode.Uri, shortName: string): Promise<boolean> {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}

// ── High-level workspace-aware helpers ───────────────────────────────────────

/**
 * Returns all existing config short names for the given category in the workspace.
 */
export async function listConfigNames(
    workspaceRoot: vscode.Uri,
    category: ConfigCategory
): Promise<string[]> {
    const dir = getConfigDir(workspaceRoot, category);
    return await listConfigs(dir);
}

/**
 * Returns the config object for the given category/shortName.  Throws if the
 * file is missing or if parsing/validation fails.
 */
export async function getConfig(
    workspaceRoot: vscode.Uri,
    category: ConfigCategory,
    shortName: string
): Promise<FilepathConfig | FileLogLineConfig> {
    const dir = getConfigDir(workspaceRoot, category);
    try {
        switch (category) {
            case ConfigCategory.Filepath:
                return await readFilepathConfig(dir, shortName);
            case ConfigCategory.Filelog:
                return await readFileLogLineConfig(dir, shortName);
            default:
                throw new Error(`Unknown category: ${category}`);
        }
    } catch (err: any) {
        // If the error is due to missing file, normalize the message
        if (err && err.code === 'FileNotFound' /* as thrown by vscode */) {
            throw new Error(`Config not found: ${category}/${shortName}`);
        }
        // rethrow validation/parse errors or other I/O errors
        throw err;
    }
}

// ── Object-oriented wrapper for convenience ─────────────────────────────────

/**
 * Thin class wrapper around the free functions, binding a workspace root.
 * Consumers may prefer this style for dependency injection or testability.
 */
export class ConfigStore {
    constructor(private workspaceRoot: vscode.Uri) {}

    listConfigNames(category: ConfigCategory): Promise<string[]> {
        return listConfigNames(this.workspaceRoot, category);
    }

    getConfig(category: ConfigCategory, shortName: string): Promise<FilepathConfig | FileLogLineConfig> {
        return getConfig(this.workspaceRoot, category, shortName);
    }

    subscribeConfigAdded(category: ConfigCategory, cb: ConfigAddedCallback): vscode.Disposable {
        return subscribeConfigAdded(category, cb);
    }

    writeConfig(category: ConfigCategory, shortName: string, data: FilepathConfig | FileLogLineConfig): Promise<void> {
        const dir = getConfigDir(this.workspaceRoot, category);
        return writeConfig(dir, shortName, data);
    }

    deleteConfig(category: ConfigCategory, shortName: string): Promise<void> {
        const dir = getConfigDir(this.workspaceRoot, category);
        return deleteConfig(dir, shortName);
    }

    configExists(category: ConfigCategory, shortName: string): Promise<boolean> {
        const dir = getConfigDir(this.workspaceRoot, category);
        return configExists(dir, shortName);
    }
}

