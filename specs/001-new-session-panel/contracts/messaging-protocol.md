# Contract: Webview ↔ Extension Messaging Protocol

**Feature**: `001-new-session-panel`  
**Panel**: `NewSessionPanel` (`logexplorer.newSession`)  
**Created**: 2026-02-28

---

## Overview

All communication between the New Session webview and the extension host uses `postMessage`. Every message MUST include a `type` discriminator field. The protocol is one of two flows:

1. **Initialisation** — webview announces readiness; extension responds with data.
2. **Session creation** — webview submits form; extension creates files and responds with result.

---

## Messages: Webview → Extension

### `ready`

Sent immediately when the webview script has finished loading and registered its message listener. MUST be the first message sent.

```typescript
{ type: 'ready' }
```

---

### `submitSession`

Sent when the user clicks "Create Session" and client-side validation passes (session name non-empty).

```typescript
{
  type: 'submitSession',
  payload: {
    name: string;          // Required. Raw session name as typed by user.
    description: string;   // Optional. Empty string if not filled.
    templateName: string | null;  // null if no template selected.
    parameters: Record<string, string>;  // {} if no template.
    timeStart: string;     // ISO 8601 date-time string. Empty string if not filled.
    sources: Array<{
      type: 'file' | 'kibana';
      sourceConfig: string;  // name of FileSourceConfig or KibanaSourceConfig
      logConfig: string;     // name of FileLogConfig or KibanaLogConfig
    }>;
  }
}
```

---

## Messages: Extension → Webview

### `init`

Sent in response to `ready`. Delivers all data the webview needs to render the panel.

```typescript
{
  type: 'init',
  templates: Array<{
    id: string;            // Filename without .json extension (stable identifier)
    name: string;          // Display name from template JSON
    description: string;
    parameters: Array<{ name: string }>;
    sources: Array<{
      type: 'file' | 'kibana';
      sourceConfig: string;  // name of FileSourceConfig or KibanaSourceConfig
      logConfig: string;     // name of FileLogConfig or KibanaLogConfig
    }>;
  }>,
  recentSessions: Array<{
    name: string;
    description: string;
    folderName: string;    // Kebab-case folder name (used as identifier)
  }>
}
```

---

### `sessionCreated`

Sent after a `submitSession` message is successfully processed and the session files are written to disk.

```typescript
{
  type: 'sessionCreated',
  session: {
    name: string;
    description: string;
    folderName: string;
  }
}
```

The webview MUST add the new session to the Recent Sessions list upon receiving this message, without requiring a panel re-open.

---

### `sessionError`

Sent when session creation fails (e.g., I/O error, duplicate name).

```typescript
{
  type: 'sessionError',
  message: string;   // User-facing error message. No internal stack traces or paths.
}
```

---

## Sequence Diagram

```
Webview                         Extension Host
  │                                   │
  │──── { type: 'ready' } ──────────►│
  │                                   │  loadTemplates()
  │                                   │  loadRecentSessions()
  │◄─── { type: 'init', ... } ────────│
  │                                   │
  │  [user fills form & clicks]       │
  │──── { type: 'submitSession' } ───►│
  │                                   │  createDirectory()
  │                                   │  writeFile(session.json)
  │◄─── { type: 'sessionCreated' } ───│
  │  [update recent sessions list]    │
```
