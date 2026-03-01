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

## E2E Data Tool

As part of end-to-end testing we include a small Node.js utility that can
generate synthetic log files and optionally deploy them into a running Docker
container. This allows tests to populate an environment (e.g. Kibana with
Elasticsearch) with sample data without needing external dependencies.

The tool lives in `tools/loggen.js` (TypeScript source) and is invoked via the
npm helper script:

```bash
# generate two text log files using the bundled sample config
npm run loggen -- generate --config tools/samples/sample-log-config.json \
    --output /tmp/logs --count 2

# filename pattern example (creates `sub/roll-0-123456789.log`, etc.)
npm run loggen -- generate --config tools/samples/sample-log-config.json \
    --output /tmp/logs --count 3 --filename "sub/roll-{i}-{random}.log"

# push the files into a container path
npm run loggen -- deploy --target mycontainer:/var/logs --source /tmp/logs

# remove the files from the container again
npm run loggen -- cleanup --target mycontainer:/var/logs
```

You can also customise the timestamp produced for `iso` fields by specifying a
`format` string (e.g. `yyyyMMdd-HHmmss`) in the log configuration file.  The
included sample config already shows a verbose ISO pattern.

Unit tests for the generator and deploy/cleanup logic are run with
`npm run test:e2e-data`. An end-to-end test (skipped when Docker is not
available) starts a temporary Alpine container, runs the full workflow, and
then tears down the container.

## Kibana Integration (for extension testing)

To assist with development of the LogExplorer extension against a live backend,
this repository includes a small helper script and integration tests that
spin up a Kibana server in Docker.

* **Prerequisite**: Docker must be installed and running. The script will
  abort early with a clear message if Docker is unavailable.
* `kibana-versions.txt` at the repo root lists one or more Kibana versions
  (e.g. `7.16.3`, `8.4.0`) that are exercised by the integration tests. You can
  override via `KIBANA_VERSIONS` environment variable (comma-separated).
* `scripts/kibana.sh` provides `start`, `status`, and `stop` commands for a
  Kibana container (image path `docker.elastic.co/kibana/kibana:<version>`).
  It supports `--version` and `--port` flags and reports the host port in JSON
  output. Alternatively, a `docker-compose.yml` is supplied to bring up both
  Elasticsearch and Kibana together (useful when running under WSL or if you
  need Elasticsearch as well).
* Run the tests manually with `npm run test:kibana`; the command compiles tests
  and then executes the integration suite. It loops over the configured
  versions and verifies that `GET /api/status` returns HTTP 200.

These tests also execute on CI (see `.github/workflows/ci.yml`).

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
