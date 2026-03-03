"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configFilename = configFilename;
exports.parseFilepathConfig = parseFilepathConfig;
exports.parseFileLogLineConfig = parseFileLogLineConfig;
exports.listConfigs = listConfigs;
exports.readFilepathConfig = readFilepathConfig;
exports.readFileLogLineConfig = readFileLogLineConfig;
exports.writeConfig = writeConfig;
exports.deleteConfig = deleteConfig;
exports.configExists = configExists;
const vscode = __importStar(require("vscode"));
const filepath_config_1 = require("../domain/filepath-config");
const filelog_config_1 = require("../domain/filelog-config");
// ── Pure parsing helpers (unit-testable without vscode) ───────────────────────
/** Returns the JSON filename for the given short name. */
function configFilename(shortName) {
    return `${shortName}.json`;
}
/**
 * Parses a JSON string into a validated `FilepathConfig`.
 * @throws if the JSON is malformed or the object fails schema validation.
 */
function parseFilepathConfig(json) {
    let obj;
    try {
        obj = JSON.parse(json);
    }
    catch {
        throw new Error(`Malformed JSON: could not parse filepath config`);
    }
    if (!(0, filepath_config_1.isFilepathConfig)(obj)) {
        throw new Error(`Invalid FilepathConfig: schema validation failed`);
    }
    return obj;
}
/**
 * Parses a JSON string into a validated `FileLogLineConfig`.
 * @throws if the JSON is malformed or the object fails schema validation.
 */
function parseFileLogLineConfig(json) {
    let obj;
    try {
        obj = JSON.parse(json);
    }
    catch {
        throw new Error(`Malformed JSON: could not parse filelog config`);
    }
    if (!(0, filelog_config_1.isFileLogLineConfig)(obj)) {
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
async function listConfigs(dir) {
    try {
        const entries = await vscode.workspace.fs.readDirectory(dir);
        return entries
            .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.json'))
            .map(([name]) => name.slice(0, -5)); // strip .json
    }
    catch {
        return [];
    }
}
/**
 * Reads and parses a filepath config from disk.
 * @throws on I/O error or schema validation failure.
 */
async function readFilepathConfig(dir, shortName) {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    const bytes = await vscode.workspace.fs.readFile(uri);
    const json = Buffer.from(bytes).toString(ENCODING);
    return parseFilepathConfig(json);
}
/**
 * Reads and parses a file log line config from disk.
 * @throws on I/O error or schema validation failure.
 */
async function readFileLogLineConfig(dir, shortName) {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    const bytes = await vscode.workspace.fs.readFile(uri);
    const json = Buffer.from(bytes).toString(ENCODING);
    return parseFileLogLineConfig(json);
}
/**
 * Serialises and writes a config object to disk.
 * Overwrites any existing file with the same name.
 */
async function writeConfig(dir, shortName, data) {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    const json = JSON.stringify(data, null, 4);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(json, ENCODING));
}
/**
 * Deletes the config file for the given short name.
 * Silently succeeds if the file does not exist.
 */
async function deleteConfig(dir, shortName) {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    try {
        await vscode.workspace.fs.delete(uri);
    }
    catch {
        // file already absent — treat as success
    }
}
/**
 * Returns true if a config file for `shortName` exists in the directory.
 */
async function configExists(dir, shortName) {
    const uri = vscode.Uri.joinPath(dir, configFilename(shortName));
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=config-store.js.map