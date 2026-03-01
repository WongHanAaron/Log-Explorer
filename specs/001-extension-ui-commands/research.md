# Research: Extension UI Commands & Panels

**Feature**: `001-extension-ui-commands`  
**Date**: 2026-02-28  
**Status**: Complete — all NEEDS CLARIFICATION resolved

## Research Questions

The following unknowns were identified from the Technical Context during planning:

1. How do editor-area panels implement focus-reuse (FR-014) in VS Code?
2. How is a custom bottom panel tab registered in VS Code?
3. How are multiple views added to the same Activity Bar sidebar container?
4. What is the correct minimal stub webview HTML pattern respecting the constitution's CSP rules?
5. How should the `.logex` folder be created cross-platform without native Node.js `fs` calls?
6. How can a VS Code command be hidden/shown based on a runtime filesystem check?

---

## Finding 1: WebviewPanel Singleton / Focus-Reuse Pattern

**Decision**: Use a `static currentPanel: T | undefined` property on each editor-panel class. On command invocation, call `currentPanel._panel.reveal()` if the instance exists; otherwise create a new `vscode.WebviewPanel` and assign `currentPanel`. Clear on `onDidDispose`.

**Rationale**: VS Code has no built-in "find existing editor panel" API. The static reference is the only reliable pattern for deduplication across repeated command invocations. `reveal()` moves the panel to the target column and gives it focus, directly satisfying FR-014.

**Code pattern**:
```typescript
export class NewSessionPanel {
  public static currentPanel: NewSessionPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;

  public static createOrShow(extensionUri: vscode.Uri): void {
    if (NewSessionPanel.currentPanel) {
      NewSessionPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'logexplorer.newSession',
      'New Session',
      vscode.ViewColumn.One,
      { enableScripts: false }
    );
    NewSessionPanel.currentPanel = new NewSessionPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getStubHtml();
    this._panel.onDidDispose(() => {
      NewSessionPanel.currentPanel = undefined;
    });
  }
}
```

**Alternatives considered**:
- Scanning `vscode.window.tabGroups` (1.85+ API) — more fragile, vendor-dependent iteration
- Boolean `isOpen` guard — does not survive extension host restarts
- `WebviewPanelSerializer` — needed for state restoration on reload, not for deduplication

---

## Finding 2: Bottom Panel Registration

**Decision**: Declare a new container under `contributes.viewsContainers.panel` in `package.json`, then list views under `contributes.views["<container-id>"]` with `"type": "webview"`. Register a `WebviewViewProvider` per view in `activate()`.

**Rationale**: The `panel` key in `viewsContainers` is the only first-class VS Code API for placing a custom tab in the bottom panel area (alongside Terminal, Output, Problems). It renders as a persistent tab that users can pin.

**`package.json` additions**:
```json
"viewsContainers": {
  "panel": [
    {
      "id": "logexplorer-bottom",
      "title": "Log Explorer",
      "icon": "resources/icons/logexplorer.svg"
    }
  ]
},
"views": {
  "logexplorer-bottom": [
    {
      "id": "logexplorer.searchResults",
      "name": "Search Results",
      "type": "webview"
    }
  ]
}
```

**Alternatives considered**:
- Output Channel (`vscode.window.createOutputChannel`) — read-only plain text, no custom rendering
- TreeView in bottom panel — viable for data lists but no HTML content
- Editor tab in `ViewColumn.Below` — creates an editor tab, not a persistent panel tab

---

## Finding 3: Multiple Views in One Sidebar Container

**Decision**: Add multiple entries to `contributes.views["logexplorer-container"]`, each with a unique `id` and `"type": "webview"`. Register a separate `WebviewViewProvider` per view ID in `activate()`.

**Rationale**: VS Code renders each view as a collapsible section within the container. Providers are independent — VS Code calls `resolveWebviewView` for each one as it becomes visible. There is no shared-provider API.

**`package.json` additions** (to existing container):
```json
"views": {
  "logexplorer-container": [
    { "type": "webview", "id": "logexplorer.panel",       "name": "Log Explorer" },
    { "type": "webview", "id": "logexplorer.sessionTools", "name": "Session Tools" },
    { "type": "webview", "id": "logexplorer.logDetails",  "name": "Log Details" }
  ]
}
```

**Alternatives considered**:
- Single provider routing all view IDs — not possible; `registerWebviewViewProvider` maps 1:1
- TreeView for non-interactive panes — no HTML rendering
- Single webview with internal tab routing — loses native collapse/expand per section

---

## Finding 4: Stub Webview HTML with CSP Nonce

**Decision**: Generate a per-render random 32-character nonce. Use it in `Content-Security-Policy` restricting `script-src` to `'nonce-${nonce}'`. Use `'unsafe-inline'` for `style-src` during the stub phase (no bundled CSS). Self-contain all styling as inline `<style>` tags; no external script src.

**Rationale**: This is VS Code's own recommended webview pattern. Nonce-gated CSP prevents injected content from running unauthorised scripts. `'unsafe-inline'` for styles is acceptable at stub phase and will be tightened when bundled CSS is introduced.

**Minimal stub HTML template**:
```typescript
private _getStubHtml(title: string, message: string): string {
  const nonce = this._getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline';">
  <title>${title}</title>
  <style>
    body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
    h1   { font-size: 1.2em; margin-bottom: 8px; }
    p    { color: var(--vscode-descriptionForeground); font-style: italic; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`;
}
```

**Alternatives considered**:
- Loading HTML from a template file (existing pattern in `LogExplorerPanel.ts`) — adds file I/O and path resolution overhead for a stub that has no bundled assets
- Shared single HTML file — not suitable because each panel has a distinct title/description

---

## Finding 5: Cross-Platform Folder Creation with `vscode.workspace.fs`

**Decision**: Use `vscode.workspace.fs.createDirectory(uri)` to create the `.logex` folder. Build the target URI via `vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.logex')`.

**Rationale**: `vscode.workspace.fs` is the VS Code-sanctioned virtual file system API. It is cross-platform by design (works on Windows, macOS, Linux and even remote workspaces over SSH/WSL), does not require importing Node's `fs` module, and handles already-existing directories without throwing on most implementations. Using it also keeps us inside the VS Code API surface, consistent with the constitution's "no native binaries / OS-specific assumptions" constraint.

**Code pattern**:
```typescript
import * as vscode from 'vscode';

export async function createLogexFolder(): Promise<'created' | 'exists' | 'error'> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!root) { return 'error'; }
  const target = vscode.Uri.joinPath(root, '.logex');
  try {
    await vscode.workspace.fs.createDirectory(target);
    return 'created';
  } catch (err: unknown) {
    // FileSystemError with code FileExists is not thrown by createDirectory;
    // other errors (permissions etc.) are surfaced here.
    console.error('LogExplorer: createDirectory failed', err);
    return 'error';
  }
}
```

**Alternatives considered**:
- `fs.mkdirSync` / `fs.promises.mkdir` — works but violates the "no OS-specific assumptions" principle and doesn't operate on remote workspaces
- `child_process.exec('mkdir ...')` — fragile across platforms, completely unnecessary

---

## Finding 6: Command Visibility via VS Code Context Keys

**Decision**: Set a custom context key `logexplorer.workspaceInitialized` using `vscode.commands.executeCommand('setContext', 'logexplorer.workspaceInitialized', value)`. Gate the command's `when` clause on `workspaceFolderCount > 0 && !logexplorer.workspaceInitialized`.

**Rationale**: VS Code `when` clauses evaluate built-in context variables plus custom keys set via `setContext`. This is the only first-class mechanism for dynamically showing/hiding commands without unregistering them. The context key is set on every activation (by checking for `.logex` existence) and after successful folder creation, keeping the command visibility in sync with the real filesystem state.

**Code pattern**:
```typescript
// On activation — check and set initial state
async function syncWorkspaceContext(): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri;
  let initialized = false;
  if (root) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, '.logex'));
      initialized = true; // stat succeeds → folder exists
    } catch {
      initialized = false; // FileNotFound → folder absent
    }
  }
  await vscode.commands.executeCommand('setContext', 'logexplorer.workspaceInitialized', initialized);
}

// package.json when clause:
// "when": "workspaceFolderCount > 0 && !logexplorer.workspaceInitialized"
```

**Alternatives considered**:
- `contributes.menus` `when` clause only — hides from menus but not Command Palette unless the command itself has a `when` clause
- Unregistering/re-registering the command dynamically — not possible; VS Code command IDs are permanent once registered
- `enablement` field on command — greys out the command but does not hide it; does not meet FR-016 requirement

---

## Summary of Resolved Decisions

| Unknown | Resolution |
|---------|-----------|
| Editor panel focus-reuse | Static `currentPanel` + `reveal()` singleton per class |
| Bottom panel registration | `viewsContainers.panel` + `WebviewViewProvider` |
| Multiple sidebar views | Multiple view IDs in same container, one provider per ID |
| Stub webview CSP | Inline HTML with per-render nonce; `unsafe-inline` styles at stub phase |
| Icon availability | `resources/icons/logexplorer.svg` confirmed present in repo |
| Cross-platform folder creation | `vscode.workspace.fs.createDirectory()` via `vscode.Uri.joinPath` |
| Command visibility based on filesystem | `setContext('logexplorer.workspaceInitialized', bool)` + `when` clause in manifest |

All unknowns resolved. No NEEDS CLARIFICATION items remain.
