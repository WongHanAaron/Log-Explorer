# Data Model: Extension UI Commands & Panels

**Feature**: `001-extension-ui-commands`  
**Date**: 2026-02-28  
**Note**: All panels in this feature are stub UIs. No persistent data or backend state is involved. This document defines the logical entities that these panels will eventually manage, and the transient runtime state used by panel lifecycle.

---

## Logical Entities

These entities are not persisted in this feature (stub phase), but define what each UI surface represents conceptually.

### Session

The top-level unit of work in Log Explorer. A session groups together a set of log sources, parsing rules, and search activity under a named context.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `name` | string | Human-readable session name |
| `createdAt` | datetime | When the session was created |
| `templateId` | string \| null | Optional reference to the session template used |

**Relationships**: A session contains zero or more LogFileSources and zero or more LogLineConfigs.  
**Validation**: `name` must be non-empty.  
**State transitions**: Draft → Active → Closed (future phases)

---

### LogFileSource

Defines the origin of raw log data. Linked to a Session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `sessionId` | string | Parent session reference |
| `label` | string | Display name for this source |
| `filePath` | string | Absolute or relative file system path to the log file |
| `encoding` | string | File encoding (e.g., `utf-8`) |

**Relationships**: Belongs to one Session.  
**Validation**: `filePath` must not be empty; `label` must not be empty.

---

### LogLineConfig

Defines how individual lines from a log file are parsed into structured fields.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `sessionId` | string | Parent session reference |
| `name` | string | Config name / descriptor |
| `pattern` | string | Regex or format string for line parsing |
| `fields` | string[] | Named capture groups extracted by the pattern |

**Relationships**: Belongs to one Session.  
**Validation**: `pattern` must be a valid regular expression.

---

### SessionTemplate

A reusable blueprint for common session configurations. Decoupled from any specific session instance.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `name` | string | Template display name |
| `description` | string | Optional description |
| `defaultSources` | LogFileSource[] | Pre-configured log sources |
| `defaultLineConfigs` | LogLineConfig[] | Pre-configured parsing rules |

**Relationships**: Zero or more Sessions may reference a SessionTemplate.  
**Validation**: `name` must be non-empty.

---

### WorkspaceFolder

Represents the Log Explorer initialised workspace directory on disk. This is the only entity in this feature that interacts with the file system.

| Field | Type | Description |
|-------|------|-------------|
| `rootUri` | `vscode.Uri` | The URI of the first VS Code workspace folder |
| `logexFolderUri` | `vscode.Uri` | `rootUri/.logex` — the managed Log Explorer data directory |
| `isInitialized` | boolean | Whether `.logex` exists at `rootUri`; drives the `logexplorer.workspaceInitialized` context key |

**Validation**: `rootUri` is derived from `vscode.workspace.workspaceFolders[0]`; command is hidden when no workspace is open so this is always valid at invocation time.  
**State transitions**: `isInitialized: false → true` after successful `createDirectory`; never transitions back to `false` within a session.

---

## Runtime State (Panel Lifecycle)

These are transient in-memory objects held by the extension host — not persisted to disk.

### EditorPanelState

Each editor-area WebviewPanel has an associated static singleton tracking its open/closed state.

| Field | Type | Description |
|-------|------|-------------|
| `currentPanel` | `T \| undefined` | Static reference to the open panel instance; `undefined` when closed |

**Used by**: `NewSessionPanel`, `LogFileSourcesPanel`, `LogFileLinesPanel`, `SessionTemplatesPanel`  
**Lifecycle**: Set when panel is created; cleared in `onDidDispose` callback.

### WebviewMessage

All messages passed between the extension host and any webview panel MUST include a `type` discriminator field (constitution §II).

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Message type discriminator (e.g., `'ready'`, `'update'`) |
| `payload` | unknown | Optional message-specific data |

---

## Scope Note

In this stub phase, no entity (except `WorkspaceFolder`) is actually created, read, updated, or deleted. The panels render placeholder HTML only. The entities defined here document the intent for future implementation phases. `WorkspaceFolder` is the sole entity with real side-effects: the `.logex` directory is written to disk by the `Setup New Workspace` command.
