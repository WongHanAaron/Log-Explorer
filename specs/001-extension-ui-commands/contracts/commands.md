# Command Contracts: Extension UI Commands & Panels

**Feature**: `001-extension-ui-commands`  
**Date**: 2026-02-28  
**Contract type**: VS Code Command Palette commands and View/Panel registrations

---

## Command Contracts

### `logexplorer.newSession`

| Property | Value |
|----------|-------|
| Command ID | `logexplorer.newSession` |
| Display title | `Log Explorer: New Session` |
| Category | `Log Explorer` |
| When | Always (no `when` clause — available whenever extension is active) |
| Panel title | `New Session` |
| Panel view type | `logexplorer.newSession` |

**Behaviour**: Opens a `vscode.WebviewPanel` in the main editor area titled "New Session". If a panel with this view type is already open, it is brought to focus via `reveal()` rather than creating a duplicate. Displays stub placeholder HTML.

**Preconditions**: Extension must be active.  
**Postconditions**: Exactly one "New Session" panel is visible and focused.  
**Error handling**: If webview creation fails, the error is caught and logged; no panel is left in an inconsistent state.

---

### `logexplorer.editLogFileSourceConfig`

| Property | Value |
|----------|-------|
| Command ID | `logexplorer.editLogFileSourceConfig` |
| Display title | `Log Explorer: Edit Log File Source Config` |
| Category | `Log Explorer` |
| When | Always |
| Panel title | `Log File Sources` |
| Panel view type | `logexplorer.logFileSources` |

**Behaviour**: Opens a `vscode.WebviewPanel` titled "Log File Sources". Singleton pattern — focuses existing panel if open. Displays stub placeholder HTML.

---

### `logexplorer.editFileLogLineConfig`

| Property | Value |
|----------|-------|
| Command ID | `logexplorer.editFileLogLineConfig` |
| Display title | `Log Explorer: Edit File Log Line Config` |
| Category | `Log Explorer` |
| When | Always |
| Panel title | `Log File Lines` |
| Panel view type | `logexplorer.logFileLines` |

**Behaviour**: Opens a `vscode.WebviewPanel` titled "Log File Lines". Singleton pattern — focuses existing panel if open. Displays stub placeholder HTML.

---

### `logexplorer.editSessionTemplates`

| Property | Value |
|----------|-------|
| Command ID | `logexplorer.editSessionTemplates` |
| Display title | `Log Explorer: Edit Session Templates` |
| Category | `Log Explorer` |
| When | Always |
| Panel title | `Session Templates` |
| Panel view type | `logexplorer.sessionTemplates` |

**Behaviour**: Opens a `vscode.WebviewPanel` titled "Session Templates". Singleton pattern — focuses existing panel if open. Displays stub placeholder HTML.

---

### `logexplorer.setupWorkspace`

| Property | Value |
|----------|-------|
| Command ID | `logexplorer.setupWorkspace` |
| Display title | `Log Explorer: Setup New Workspace` |
| Category | `Log Explorer` |
| When | `workspaceFolderCount > 0 && !logexplorer.workspaceInitialized` |
| Side effect | Creates `.logex/` at `vscode.workspace.workspaceFolders[0].uri` |

**Behaviour**:
1. Reads `vscode.workspace.workspaceFolders[0].uri` as workspace root.
2. Calls `vscode.workspace.fs.createDirectory(root/.logex)`.
3. On success: sets context key `logexplorer.workspaceInitialized = true`, shows info notification `"Log Explorer workspace initialised."`
4. On failure: shows error notification `"Log Explorer: Failed to initialise workspace."` (no technical detail); context key remains `false`.

**Preconditions**: At least one workspace folder open; `.logex` does not yet exist (enforced by `when` clause hiding the command otherwise).  
**Postconditions**: `.logex` folder exists at workspace root; command is no longer visible in Command Palette.  
**Error handling**: Catches all exceptions from `createDirectory`; logs error internally; surfaces user-friendly message only.

---

## View Registrations

### Activity Bar Container

| Property | Value |
|----------|-------|
| Container ID | `logexplorer-container` |
| Title | `LogExplorer` |
| Icon | `resources/icons/logexplorer.svg` |
| Location | Activity Bar |

**Status**: Already registered in `package.json`. Extended with new views below.

---

### Sidebar View: Session Tools

| Property | Value |
|----------|-------|
| View ID | `logexplorer.sessionTools` |
| Name | `Session Tools` |
| Type | `webview` |
| Container | `logexplorer-container` |
| Provider class | `SessionToolsViewProvider` |

**Behaviour**: Renders as a collapsible section within the Log Explorer sidebar. Displays stub placeholder HTML. Registered via `vscode.window.registerWebviewViewProvider`.

---

### Sidebar View: Log Details

| Property | Value |
|----------|-------|
| View ID | `logexplorer.logDetails` |
| Name | `Log Details` |
| Type | `webview` |
| Container | `logexplorer-container` |
| Provider class | `LogDetailsViewProvider` |

**Behaviour**: Renders as a collapsible section within the Log Explorer sidebar, below Session Tools. Displays stub placeholder HTML.

---

### Bottom Panel Container

| Property | Value |
|----------|-------|
| Container ID | `logexplorer-bottom` |
| Title | `Log Explorer` |
| Icon | `resources/icons/logexplorer.svg` |
| Location | Bottom panel (alongside Terminal, Output) |

---

### Bottom Panel View: Search Results

| Property | Value |
|----------|-------|
| View ID | `logexplorer.searchResults` |
| Name | `Search Results` |
| Type | `webview` |
| Container | `logexplorer-bottom` |
| Provider class | `SearchResultsViewProvider` |

**Behaviour**: Renders as a tab in the bottom panel area. Displays stub placeholder HTML.

---

## Webview Message Protocol

All webview ↔ extension messages (current phase and future) MUST conform to the following schema:

```typescript
interface WebviewMessage {
  type: string;     // discriminator — always required
  payload?: unknown; // message-specific data
}
```

**Defined message types (stub phase)**:

| Type | Direction | Description |
|------|-----------|-------------|
| `ready` | webview → extension | Webview has finished loading and is ready |

---

## `package.json` Contributes Delta

The following additions are required to `package.json` `contributes` for this feature:

```json
"viewsContainers": {
  "activitybar": [
    // existing: logexplorer-container (unchanged)
  ],
  "panel": [
    {
      "id": "logexplorer-bottom",
      "title": "Log Explorer",
      "icon": "resources/icons/logexplorer.svg"
    }
  ]
},
"views": {
  "logexplorer-container": [
    { "type": "webview", "id": "logexplorer.panel",        "name": "Log Explorer"   },
    { "type": "webview", "id": "logexplorer.sessionTools", "name": "Session Tools"  },
    { "type": "webview", "id": "logexplorer.logDetails",   "name": "Log Details"    }
  ],
  "logexplorer-bottom": [
    { "type": "webview", "id": "logexplorer.searchResults", "name": "Search Results" }
  ]
},
"commands": [
  { "command": "logexplorer.showPanel",               "title": "Show Panel",                    "category": "Log Explorer" },
  { "command": "logexplorer.newSession",              "title": "New Session",                   "category": "Log Explorer" },
  { "command": "logexplorer.editLogFileSourceConfig", "title": "Edit Log File Source Config",   "category": "Log Explorer" },
  { "command": "logexplorer.editFileLogLineConfig",   "title": "Edit File Log Line Config",     "category": "Log Explorer" },
  { "command": "logexplorer.editSessionTemplates",    "title": "Edit Session Templates",        "category": "Log Explorer" },
  { "command": "logexplorer.setupWorkspace",          "title": "Setup New Workspace",           "category": "Log Explorer" }
],
"menus": {
  "commandPalette": [
    {
      "command": "logexplorer.setupWorkspace",
      "when": "workspaceFolderCount > 0 && !logexplorer.workspaceInitialized"
    }
  ]
}
```
