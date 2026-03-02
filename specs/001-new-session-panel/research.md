# Research: New Session Panel

**Feature**: `001-new-session-panel`  
**Created**: 2026-02-28  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Finding 1: Extension ↔ Webview Messaging — Ready Handshake Pattern

**Decision**: Use a webview-initiated `ready` handshake. The webview posts `{ type: 'ready' }` as its first action after script load; the extension responds with a single `{ type: 'init', ... }` payload containing all initial data.

**Rationale**: `webview.postMessage()` silently drops messages sent before the webview's `window.addEventListener('message', ...)` listener is registered. Because the HTML is set synchronously but the bundled script executes asynchronously, there is a real race condition if the extension pushes data immediately on panel creation. The handshake eliminates this guarantee.

**Implementation pattern**:
```typescript
// Extension — inside NewSessionPanel constructor
this._panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.type === 'ready') {
        const [templates, recentSessions] = await Promise.all([
            loadTemplates(workspaceRoot),
            loadRecentSessions(workspaceRoot),
        ]);
        this._panel.webview.postMessage({ type: 'init', templates, recentSessions });
    }
    if (msg.type === 'submitSession') {
        await createSession(workspaceRoot, msg.payload);
        // on success, tell the webview to update recent sessions
    }
}, null, this._disposables);
```

**Alternatives Considered**: Immediate push on creation (race condition risk); `retainContextWhenHidden` + immediate push (memory overhead, unnecessary for a creation panel).

---

## Finding 2: Workspace File I/O — vscode.workspace.fs

**Decision**: Use `vscode.workspace.fs` exclusively for all directory scanning and file read/write operations.

**Rationale**: URI-based, fully async, and transparent across local and remote workspace types (SSH Remote, WSL, Dev Containers, GitHub Codespaces). Node.js `fs` breaks when the workspace root is a non-`file://` URI (e.g., `vscode-remote://ssh-remote+...`). `vscode.workspace.fs.createDirectory()` has built-in `mkdirp` semantics — no parent-existence checks required.

**Key patterns**:
```typescript
// Scan template files
const entries = await vscode.workspace.fs.readDirectory(templatesUri);
const jsonFiles = entries.filter(([, t]) => t === vscode.FileType.File && name.endsWith('.json'));

// Read a file
const raw = await vscode.workspace.fs.readFile(fileUri);
const data = JSON.parse(new TextDecoder().decode(raw));

// Write session
await vscode.workspace.fs.createDirectory(sessionFolderUri);
await vscode.workspace.fs.writeFile(sessionJsonUri, new TextEncoder().encode(JSON.stringify(data, null, 2)));
```

**Alternatives Considered**: Node.js `fs/promises` — breaks on remote workspaces; `fsPath` throws on non-`file://` URIs.

---

## Finding 3: Webview UI Technology — Vanilla TypeScript + VS Code CSS Variables

**Decision**: Plain TypeScript (compiled by esbuild, `format: iife`) styled exclusively with VS Code CSS custom properties. Do **not** use `@vscode/webview-ui-toolkit`.

**Rationale**: `@vscode/webview-ui-toolkit` was **archived by Microsoft in November 2024** and is no longer maintained. VS Code exposes its full theme as CSS custom properties (e.g., `--vscode-button-background`, `--vscode-input-background`, `--vscode-foreground`). Binding directly to these gives a complete, native VS Code look-and-feel with zero framework overhead and no CSP complications.

For the moderate UI complexity of this panel (live search filter, dynamic parameter rows, add/remove sources table), vanilla TypeScript DOM manipulation is sufficient and directly auditable. If future panels grow more complex, **Preact** (3 KB gzipped, JSX, hooks) is the clean upgrade path — esbuild supports it natively via `jsxFactory: 'h'`.

**Alternatives Considered**: `@vscode/webview-ui-toolkit` (archived); Vue 3 (requires `unsafe-eval` for runtime template compiler, violating CSP); React (45+ KB, disproportionate for single-panel use).

---

## Finding 4: esbuild Multi-Entry Bundling for New Session Webview

**Decision**: Add a dedicated `newSessionWebviewConfig` object in `esbuild.mjs` alongside the existing `extensionConfig` and `webviewConfig`, bundling `src/webview/new-session/main.ts` → `dist/webview/new-session.js`.

**Rationale**: The existing `esbuild.mjs` already uses the parallel-config pattern (`Promise.all([esbuild.build(extensionConfig), esbuild.build(webviewConfig)])`). Adding the new session webview is a direct extension. Each webview bundle must use `format: 'iife'` because the webview sandbox has no module loader.

**Pattern**:
```javascript
const newSessionWebviewConfig = {
    entryPoints: ['src/webview/new-session/main.ts'],
    bundle: true,
    outfile: 'dist/webview/new-session.js',
    format: 'iife',
    platform: 'browser',
    target: 'ES2020',
    sourcemap: !production,
    minify: production,
};
// Add to both watch and build Promise.all arrays
```

**Alternatives Considered**: Single entryPoints array with `outdir` (viable at 3+ webviews but requires path derivation changes); separate esbuild.mjs files per webview (over-engineered).

---

## Finding 5: Session Template JSON Schema

**Decision**: Store each template as a single JSON file under `.logex/session-templates/<template-name>.json`. The filename (without extension) is used as a stable identifier; the `name` field inside the file is the human-readable display name.

**Schema**:
```json
{
  "name": "My Template",
  "description": "What this template is for",
  "parameters": [
    { "name": "parameterLabel" }
  ],
  "sources": [
    {
      "machine": "prod-server-01",
      "location": "/var/log/app",
      "filenameFormat": "app-*.log",
      "lineFormat": "{timestamp} [{level}] {message}"
    }
  ]
}
```

**Rationale**: Single-file-per-template maximises simplicity (FR-019, FR-020). Re-reading all templates on panel open (FR-020) requires only a `readDirectory` + per-file `readFile` pass, with graceful skipping of malformed files.

---

## Finding 6: session.json Schema

**Decision**: Write `session.json` as a flat JSON file in `.logex/sessions/<kebab-name>/session.json` with the following schema (resolved from FR-016 + FR-018).

**Schema**:
```json
{
  "name": "My Session",
  "description": "Optional description",
  "templateName": "my-template",
  "parameters": {
    "parameterLabel": "value entered by user"
  },
  "timeStart": "2026-02-28T09:00:00.000Z",
  "sources": [
    {
      "machine": "prod-server-01",
      "location": "/var/log/app",
      "filenameFormat": "app-*.log",
      "lineFormat": "{timestamp} [{level}] {message}"
    }
  ]
}
```

`templateName` is `null` when no template was selected. `parameters` is an empty object `{}` when no template was used.
