# LogExplorer

A VSCode extension for exploring and analyzing log files, featuring a custom sidebar panel with webview-based UI.

## Prerequisites

- **Node.js** 18+ — [nodejs.org](https://nodejs.org)
- **VSCode** 1.85+ — [code.visualstudio.com](https://code.visualstudio.com)
- **Git** — any recent version

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd LogExplorer

# 2. Install dependencies
npm install

# 3. Open in VSCode
code .
```

Then press **F5** to launch the Extension Development Host with LogExplorer active.

Click the **LogExplorer icon** in the Activity Bar to open the sidebar panel.

## Development

| Task | Command |
|------|---------|
| Build once | `npm run build` |
| Watch & rebuild | `npm run watch` |
| Run tests | `npm test` |
| Package .vsix | `npm run package` |
| Debug extension | Press `F5` in VSCode |

### Launch Configurations

- **Run Extension** — Opens an Extension Development Host with the extension loaded
- **Extension Tests** — Runs the integration test suite inside a VSCode instance

### npm Scripts

| Script | Purpose |
|--------|---------|
| `build` | Compile TypeScript and bundle with esbuild |
| `watch` | Auto-rebuild on file changes (background task) |
| `pretest` | Build extension + compile tests before running |
| `test` | Run integration tests via @vscode/test-cli |
| `package` | Package into a distributable .vsix file |
| `vscode:prepublish` | Production build (minified, no sourcemaps) |

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
    ├── main.ts               # Client-side webview script
    └── styles.css            # Webview styles

resources/icons/
└── logexplorer.svg           # Activity Bar icon

test/
├── suite/
│   ├── extension.test.ts     # Integration tests
│   └── index.ts              # Test runner entry
└── runTest.ts                # Test launcher

dist/                         # Build output (gitignored)
├── extension.js              # Bundled extension host code
├── webview.js                # Bundled webview client code
└── webview.css               # Webview styles
```

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Extension manifest: identity, contributions, scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `esbuild.mjs` | esbuild bundler config (2 entry points: extension + webview) |
| `.vscode/launch.json` | Debug launch configurations |
| `.vscode/tasks.json` | Build tasks (watch mode as default) |
| `.vscode-test.mjs` | @vscode/test-cli configuration |
| `.vscodeignore` | Files excluded from the packaged extension |

## Extension Features

- **Activity Bar Icon** — LogExplorer icon in the sidebar
- **Webview Sidebar Panel** — Custom panel with placeholder content, theme-aware styling
- **Command Palette** — `LogExplorer: Show Panel` command
- **Content Security Policy** — Nonce-based CSP for webview security
- **State Persistence** — Webview state preserved across visibility toggles

## Minimum VSCode Version

This extension requires **VSCode 1.85.0** or later.

## Packaging

```bash
npm run package
```

This produces a `.vsix` file that can be installed via:
- Command Palette → **Extensions: Install from VSIX...**
- CLI: `code --install-extension logexplorer-0.1.0.vsix`

## Local Install

Three helper scripts are provided for creating and installing a local `.vsix` package:

| Command | Description |
|---------|-------------|
| `npm run package:local` | Build & package extension into `releases/logexplorer-<version>.vsix` |
| `npm run install:local` | Install the latest `.vsix` into the active VSCode using the `code` CLI |
| `npm run release:local` | Do both of the above in sequence (build → install) |

Additionally, for developers with PowerShell 7+ installed (`pwsh`), the same
behaviour is exposed via standalone scripts. These are optional shortcuts and are run
with `pwsh -NoProfile -File scripts/package-local.ps1` or
`scripts/install-local.ps1`. They do not modify `package.json`.

(See `specs/002-local-vsix-install/quickstart.md` for usage examples and acceptance tests.)

## Cross-Platform

The extension targets Windows, macOS, and Linux. All file paths use platform-agnostic APIs (`vscode.Uri.joinPath`, `path.join`). The webview uses VSCode CSS variables for consistent theming across platforms.

## Workflow & Git

- Work on a dedicated feature branch for each speckit cycle (specify, plan, tasks, implement).
  Branch names should follow the `[###-short-description]` pattern.
- Merge back into `master` using squash‑and‑merge to maintain a clean, linear history.
- Rebase or sync long-lived branches frequently to avoid conflicts.

## License

ISC
## License

ISC
