# Commands Contract: File Source Setup (003)

**Feature**: 003-file-source-setup

---

## Registered Commands

All commands are registered in `src/commands/index.ts` and declared in `package.json` under `contributes.commands`.

---

### `logexplorer.initializeWorkspace`

**Title**: `Log Explorer: Initialize Workspace`
**When**: Available when a workspace folder is open (`workspaceFolderCount >= 1`).

**Behaviour**:
1. Read the first `vscode.workspace.workspaceFolders` entry as the workspace root.
2. Create `.logex/filepath-configs/` using `vscode.workspace.fs.createDirectory` (no-op if exists).
3. Create `.logex/filelog-configs/` using `vscode.workspace.fs.createDirectory` (no-op if exists).
4. If a `.gitignore` file exists at the workspace root and does not already contain `.logex/`:
   - Show a `vscode.window.showInformationMessage` quick-pick: `"Add .logex/ to .gitignore?"` with options **Yes** / **No**.
   - If Yes: append `\n# Log Explorer config\n.logex/\n` to `.gitignore`.
5. Show `vscode.window.showInformationMessage("Log Explorer workspace initialized.")`.

**Error states**:
- No workspace open → `showErrorMessage("Open a workspace folder first.")`.
- File system write failure → surface the error via `showErrorMessage`.

**package.json declaration**:
```json
{
    "command": "logexplorer.initializeWorkspace",
    "title": "Log Explorer: Initialize Workspace"
}
```

---

### `logexplorer.openFilepathConfigEditor`

**Title**: `Log Explorer: Open Filepath Config Editor`
**When**: Available when a workspace folder is open.

**Arguments** (optional):
- `shortName?: string` – If provided, load the existing config with this name. If omitted, open a blank new-config form.

**Behaviour**:
1. Verify `.logex/filepath-configs/` exists; if not, prompt the user to run `logexplorer.initializeWorkspace` first.
2. If `shortName` provided: read `.logex/filepath-configs/{shortName}.json`, parse and validate with `isFilepathConfig()`. On parse failure show an error.
3. Open a `WebviewPanel` (view type: `logexplorer.filepathConfigEditor`, column: `Active`).
4. Post a `load` message to the webview with the config data (or an empty template for new).

**package.json declaration**:
```json
{
    "command": "logexplorer.openFilepathConfigEditor",
    "title": "Log Explorer: Open Filepath Config Editor"
}
```

---

### `logexplorer.openFilelogConfigEditor`

**Title**: `Log Explorer: Open File Log Line Config Editor`
**When**: Available when a workspace folder is open.

**Arguments** (optional):
- `shortName?: string` – If provided, load the existing config with this name.

**Behaviour**:
1. Verify `.logex/filelog-configs/` exists; if not, prompt to initialize workspace.
2. If `shortName` provided: read `.logex/filelog-configs/{shortName}.json`, parse and validate with `isFileLogLineConfig()`.
3. Open a `WebviewPanel` (view type: `logexplorer.filelogConfigEditor`, column: `Active`).
4. Post a `load` message to the webview with the config data (or a `text`-type template for new).

**package.json declaration**:
```json
{
    "command": "logexplorer.openFilelogConfigEditor",
    "title": "Log Explorer: Open File Log Line Config Editor"
}
```
