# Quickstart: Local VSIX Packaging & Install Scripts

**Feature**: 002-local-vsix-install  
**Date**: 2026-02-28

## Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **VSCode** 1.85+ with `code` CLI on your PATH  
  *(Windows: re-run the VSCode installer or tick "Add to PATH" in the installer)*
- **Git** (any recent version)
- Dependencies installed: `npm install`

---

## User Story 1 — Package the Extension

```bash
npm run package:local
```

**Expected output**:
```
 INFO  Detected VS Code engine version: ^1.85.0
 INFO  Using target platform: undefined
 INFO  Packaging extension...
 INFO  DONE  Packaged: releases/logexplorer-0.1.0.vsix (N files, X KB)
```

**Verify**: `releases/logexplorer-0.1.0.vsix` exists.

---

## User Story 2 — Install into Local VSCode

```bash
npm run install:local
```

**Expected output**:
```
Installing releases/logexplorer-0.1.0.vsix...
Extension 'logexplorer' was successfully installed.
Installed releases/logexplorer-0.1.0.vsix. Reload VSCode to activate.
```

**Verify**: Open VSCode → Extensions panel → search "LogExplorer" → version matches
`package.json`.

---

## User Story 3 — Full Release in One Command

From a clean state (no existing `dist/` or `releases/`):

```bash
npm run release:local
```

**Expected output**: Combined output of `package:local` followed by `install:local`, all in one
terminal session.

**Verify**: Same as US1 + US2 combined.

---

## Acceptance Checklist

Run these checks after executing the commands above:

- [ ] **US1**: `releases/logexplorer-{version}.vsix` exists after `package:local`
- [ ] **US1**: No marketplace credentials or internet were required
- [ ] **US1**: Running `package:local` again overwrites the previous `.vsix`
- [ ] **US1**: Introducing a TypeScript error causes `package:local` to fail with a non-zero exit code and no `.vsix` is produced
- [ ] **US2**: Extension appears in VSCode Extensions panel at the correct version after `install:local`
- [ ] **US2**: Running `install:local` with no `.vsix` in `releases/` prints a clear error
- [ ] **US2**: Running `install:local` when the extension is already installed replaces it
- [ ] **US3**: `release:local` succeeds end-to-end from a clean state
- [ ] **US3**: If `package:local` fails, `install:local` is NOT invoked

---

## Error Reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| `No .vsix found in releases/` | Package step not run yet | Run `npm run package:local` first |
| `code: command not found` | VSCode CLI not on PATH | On Windows: reinstall VSCode and tick "Add to PATH". On macOS: run *Shell Command: Install 'code' command* from Command Palette |
| `vsce: command not found` | devDependencies not installed | Run `npm install` |
| TypeScript compile error | Source error | Fix the TypeScript error flagged in the output |
| Non-zero exit, no message | Unexpected OS error | Check disk space and file permissions on `releases/` |
