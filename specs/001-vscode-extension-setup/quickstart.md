# Quickstart: LogExplorer VSCode Extension

**Feature**: 001-vscode-extension-setup  
**Date**: 2026-02-28

## Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **VSCode** 1.85+ ([code.visualstudio.com](https://code.visualstudio.com))
- **Git** (any recent version)

## Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd LogExplorer

# 2. Install dependencies
npm install
```

## Workflow

Follow the speckit workflow using feature branches. Each cycle (specify, plan, tasks, implement)
should occur on its own branch named `[###-short-description]`. Merge into `master` with a
squash merge for a linear history.

## Development

### Launch the extension

1. Open the project in VSCode
2. Press `F5` (or Run > Start Debugging)
3. Select "Run Extension" launch configuration
4. An Extension Development Host window opens with LogExplorer active
5. Click the LogExplorer icon in the Activity Bar to see the sidebar panel

### Build

```bash
# Compile TypeScript and bundle with esbuild
npm run build
```

### Watch mode

```bash
# Auto-rebuild on file changes
npm run watch
```

## Testing

```bash
# Run integration tests (launches VSCode)
npm test
```

Tests run inside a real VSCode instance via `@vscode/test-cli`. At least one sample test verifies extension activation.

## Packaging

```bash
# Package into a .vsix file
npm run package
```

The output `.vsix` file can be installed in any VSCode instance via:
- Command Palette → "Extensions: Install from VSIX..."
- Or: `code --install-extension logexplorer-<version>.vsix`

## Project Structure

```
src/
├── extension.ts              # Entry point: activate() and deactivate()
├── panels/
│   └── LogExplorerPanel.ts   # WebviewViewProvider for the sidebar panel
├── commands/
│   └── index.ts              # Command registrations
└── webview/
    ├── index.html            # Webview HTML template
    ├── main.js               # Client-side webview script
    └── styles.css            # Webview styles

resources/icons/
└── logexplorer.svg           # Activity Bar icon

test/
├── suite/
│   ├── extension.test.ts     # Sample integration test
│   └── index.ts              # Test runner entry
└── runTest.ts                # Test launcher
```

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Extension manifest: identity, contributions, scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `esbuild.mjs` | esbuild bundler configuration (2 entry points) |
| `.vscode/launch.json` | Debug launch configurations |
| `.vscode-test.mjs` | Test runner configuration |

## Common Tasks

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Build once | `npm run build` |
| Watch & rebuild | `npm run watch` |
| Run tests | `npm test` |
| Package .vsix | `npm run package` |
| Debug extension | Press `F5` in VSCode |
