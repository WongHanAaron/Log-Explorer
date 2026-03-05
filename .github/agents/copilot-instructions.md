# LogExplorer Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-28

## Active Technologies
- TypeScript 5.x + `vscode.workspace.fs` / `vscode.Uri`; `WebviewPanel`; manual type-predicate validation (no Ajv/Zod); native `RegExp` named capture groups; dot-notation JSON path accessor; kebab-case helpers (003-file-source-setup)
- TypeScript 5.x / Node.js 18+ (ESM `.mjs` helper scripts) + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH) (002-local-vsix-install)
- N/A — output artefacts written to `releases/` on local filesystem (002-local-vsix-install)
- Node.js 18+ / ESM `.mjs` helper scripts; PowerShell 7+ (`pwsh`) for `.ps1` convenience scripts + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH); `pwsh` (PowerShell 7+, optional for `.ps1` scripts) (002-local-vsix-install)
- Shell script (POSIX bash) with optional Node.js argv + Docker CLI; `curl`/`http` for HTTP checks; Node.js for (001-kibana-integration)
- N/A (transient containers). (001-kibana-integration)
- TypeScript 5.x targeting ES2020 + `@types/vscode ^1.85.0`, `esbuild` (bundler), `typescript ^5.x` (001-extension-ui-commands)
- N/A — stub UI only, no persistence required (001-extension-ui-commands)
- Local workspace filesystem — `.logex` folder created via `vscode.workspace.fs` (cross-platform, no native I/O) (001-extension-ui-commands)
- TypeScript 5.x, target ES2020 + VS Code API ^1.85.0; esbuild ^0.27 (001-new-session-panel)
- Filesystem — `.logex/session-templates/*.json` (read) and `.logex/sessions/<name>/session.json` (read/write) via `vscode.workspace.fs` (001-new-session-panel)
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (001-react-logfile-source)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (001-react-logfile-source)

- TypeScript 5.x, Node.js 18+ + @types/vscode (extension API types), esbuild (bundler) (001-vscode-extension-setup)

## Project Structure

```text
src/
  commands/          # VS Code command registrations
  domain/            # Domain interfaces and validation (filepath-config.ts, filelog-config.ts)
  panels/            # WebviewPanel host classes
  services/          # File I/O services (config-store.ts)
  webview/           # Webview entry points (messages.ts, filepath-editor/, filelog-editor/)
  extension.ts       # Extension activation
specs/               # Feature specs (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)
tools/               # Developer CLI tools (loggen.ts, loggen.js)
test/                # Mocha unit + e2e tests
docs/                # Developer references
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x, Node.js 18+: Follow standard conventions.  When authoring
TypeScript code, consult `docs/typescript-guidelines.md` for our project‑wide
rules on file/class isolation, exports, dependency injection, etc.

## Recent Changes
- 001-react-logfile-source: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 001-new-session-panel: Added TypeScript 5.x, target ES2020 + VS Code API ^1.85.0; esbuild ^0.27
- 001-extension-ui-commands: Added TypeScript 5.x targeting ES2020 + `@types/vscode ^1.85.0`, `esbuild` (bundler), `typescript ^5.x`


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
