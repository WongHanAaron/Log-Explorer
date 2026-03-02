import * as vscode from 'vscode';
import { FilepathConfig, isFilepathConfig } from '../domain/filepath-config';
import { FileLogLineConfig, isFileLogLineConfig } from '../domain/filelog-config';

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
