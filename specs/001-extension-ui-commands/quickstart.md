# Quickstart: Extension UI Commands & Panels

**Feature**: `001-extension-ui-commands`  
**Date**: 2026-02-28  
**Audience**: Developer implementing this feature on the `001-extension-ui-commands` branch

---

## Prerequisites

- Node.js 18+ installed
- VS Code 1.85.0+
- The repo open in VS Code with the Extension Development Host available (`F5`)

```bash
# Install dependencies (if not already done)
npm install
```

---

## Build

```bash
npm run build
# or watch mode for iterative development:
npm run watch
```

---

## Run the Extension

Press `F5` in VS Code (or run **Run > Start Debugging**) to launch the Extension Development Host.  
The `LogExplorer` extension will be active in the new window.

---

## Verify the 7 UI Surfaces

### 1. Activity Bar Icon

After launching, look for the **LogExplorer** icon in the Activity Bar (left side rail).  
Click it to open the Log Explorer sidebar.

Expected: Sidebar opens showing at least two collapsible sections — **Session Tools** and **Log Details** — each displaying stub placeholder text.

---

### 2. New Session Panel

Open the Command Palette (`Ctrl+Shift+P`), type `Log Explorer: New Session`, press Enter.

Expected: An editor tab opens in the main area titled **New Session** with stub placeholder content.  
Repeat the command — the existing tab should be focused, not duplicated.

---

### 3. Log File Sources Panel

Command Palette → `Log Explorer: Edit Log File Source Config`

Expected: Editor tab **Log File Sources** opens with stub content.

---

### 4. Log File Lines Panel

Command Palette → `Log Explorer: Edit File Log Line Config`

Expected: Editor tab **Log File Lines** opens with stub content.

---

### 5. Session Templates Panel

Command Palette → `Log Explorer: Edit Session Templates`

Expected: Editor tab **Session Templates** opens with stub content.

---

### 7. Setup New Workspace Command

Open a workspace folder that does **not** yet have a `.logex` directory.

Command Palette → `Log Explorer: Setup New Workspace`

Expected:
- A `.logex` folder appears at the workspace root (verify in the Explorer sidebar).
- An info notification `"Log Explorer workspace initialised."` is shown.
- The command disappears from the Command Palette immediately.

If `.logex` already exists: the command should not appear in the palette at all.

---

### 8. Search Results Bottom Panel

Open the bottom panel (`Ctrl+\`` or **View > Terminal**).  
Look for the **Search Results** tab in the panel tab bar.

Expected: **Search Results** tab is visible. Clicking it shows stub placeholder content.

---

## Run Tests

```bash
npm test
```

All tests must pass on the `001-extension-ui-commands` branch before submitting a PR.  
Test file: `test/suite/commands.test.ts` — verifies command registration for all 5 new commands and context key logic for `logexplorer.workspaceInitialized`.

---

## File Map (this feature)

| What | Where |
|------|-------|
| New editor panel classes | `src/panels/editors/` |
| New sidebar/bottom view providers | `src/panels/views/` |
| Workspace initialisation logic | `src/workspace/setupWorkspace.ts` |
| Command registrations | `src/commands/index.ts` |
| Extension activation wiring | `src/extension.ts` |
| Manifest contributions | `package.json` |
| Tests | `test/suite/commands.test.ts` |

---

## Package & Install Locally

```bash
npm run release:local
```

This builds, packages the `.vsix`, and installs it into your local VS Code instance.  
See [build-install-guide.md](../../docs/developer-references/build-install-guide.md) for details.

---

## Merging

When the feature is complete and all tests pass:

```bash
git checkout main
git merge --squash 001-extension-ui-commands
git commit -m "feat: extension UI commands and panel stubs (001)"
git push origin main
```

> Per constitution §IV: squash-and-merge to keep history linear.
