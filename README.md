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
```

## Minimum VSCode Version

This extension requires **VSCode 1.85.0** or later. It will not activate on earlier versions.

## Packaging

```bash
npm run package
```

This produces a `.vsix` file that can be installed via:
- Command Palette → **Extensions: Install from VSIX...**
- CLI: `code --install-extension logexplorer-0.1.0.vsix`

## License

ISC
