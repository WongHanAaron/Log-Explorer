/**
 * Shared webview ↔ host message types for the File Source Setup editors.
 *
 * Constitution §II requirement: every message has a `type` discriminant string.
 * Both panels validate every inbound message before acting on it.
 */
import type { FilepathConfig } from '../domain/config/filepath-config';
import type { FileLogLineConfig } from '../domain/config/filelog-config';

// ════════════════════════════════════════════════════════════════════
// Filepath Config Editor messages
// ════════════════════════════════════════════════════════════════════

// ── Host → Webview ────────────────────────────────────────────────

export interface FilepathConfigLoadMessage {
    type: 'filepath-config:load';
    config: FilepathConfig | null;
    isNew: boolean;
}

export interface FilepathConfigSaveResultMessage {
    type: 'filepath-config:save-result';
    success: boolean;
    errorMessage?: string;
}

export interface FilepathConfigNameAvailableMessage {
    type: 'filepath-config:name-available';
    available: boolean;
}

// ── Webview → Host ────────────────────────────────────────────────

export interface FilepathConfigSaveMessage {
    type: 'filepath-config:save';
    config: FilepathConfig;
}

export interface FilepathConfigValidateNameMessage {
    type: 'filepath-config:validate-name';
    shortName: string;
}

// ════════════════════════════════════════════════════════════════════
// File Log Line Config Editor messages
// ════════════════════════════════════════════════════════════════════

// ── Host → Webview ────────────────────────────────────────────────

export interface FilelogConfigLoadMessage {
    type: 'filelog-config:load';
    config: FileLogLineConfig | null;
    isNew: boolean;
}

export interface FilelogConfigSaveResultMessage {
    type: 'filelog-config:save-result';
    success: boolean;
    errorMessage?: string;
}

export interface FilelogConfigRegexTestResultMessage {
    type: 'filelog-config:regex-test-result';
    fieldIndex: number;
    matched: boolean;
    groups?: Record<string, string>;
    errorMessage?: string;
}

export interface FilelogConfigNameAvailableMessage {
    type: 'filelog-config:name-available';
    available: boolean;
}

// ── Webview → Host ────────────────────────────────────────────────

export interface FilelogConfigSaveMessage {
    type: 'filelog-config:save';
    config: FileLogLineConfig;
}

export interface FilelogConfigTestRegexMessage {
    type: 'filelog-config:test-regex';
    fieldIndex: number;
    pattern: string;
    sampleLine: string;
}

export interface FilelogConfigValidateNameMessage {
    type: 'filelog-config:validate-name';
    shortName: string;
}

// ════════════════════════════════════════════════════════════════════
// Union types used by panels for type-safe dispatch
// ════════════════════════════════════════════════════════════════════

// generic panel messages
export interface GenericInitMessage {
    type: 'init';
    configs: string[];
    current?: any;
}
export interface GenericConfigListChangedMessage {
    type: 'configListChanged';
    configs: string[];
}
export interface GenericConfigDataMessage {
    type: 'configData';
    config: any;
}

export type HostToWebviewMessage =
    | GenericInitMessage
    | GenericConfigListChangedMessage
    | GenericConfigDataMessage
    | FilepathConfigLoadMessage
    | FilepathConfigSaveResultMessage
    | FilepathConfigNameAvailableMessage
    | FilelogConfigLoadMessage
    | FilelogConfigSaveResultMessage
    | FilelogConfigRegexTestResultMessage
    | FilelogConfigNameAvailableMessage;

// generic panel -> host messages
export interface GenericSelectConfigMessage {
    type: 'selectConfig';
    name: string;
}

export type WebviewToHostMessage =
    | GenericSelectConfigMessage
    | FilepathConfigSaveMessage
    | FilepathConfigValidateNameMessage
    | FilelogConfigSaveMessage
    | FilelogConfigTestRegexMessage
    | FilelogConfigValidateNameMessage;
