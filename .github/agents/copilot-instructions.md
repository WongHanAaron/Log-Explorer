# LogExplorer Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-28

## Active Technologies
- TypeScript 5.x / Node.js 18+ (ESM `.mjs` helper scripts) + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH) (002-local-vsix-install)
- N/A — output artefacts written to `releases/` on local filesystem (002-local-vsix-install)
- Node.js 18+ / ESM `.mjs` helper scripts; PowerShell 7+ (`pwsh`) for `.ps1` convenience scripts + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH); `pwsh` (PowerShell 7+, optional for `.ps1` scripts) (002-local-vsix-install)
- Shell script (POSIX bash) with optional Node.js argv + Docker CLI; `curl`/`http` for HTTP checks; Node.js for (001-kibana-integration)
- N/A (transient containers). (001-kibana-integration)
- TypeScript 5.x targeting ES2020 + `@types/vscode ^1.85.0`, `esbuild` (bundler), `typescript ^5.x` (001-extension-ui-commands)
- N/A — stub UI only, no persistence required (001-extension-ui-commands)
- Local workspace filesystem — `.logex` folder created via `vscode.workspace.fs` (cross-platform, no native I/O) (001-extension-ui-commands)

- TypeScript 5.x, Node.js 18+ + @types/vscode (extension API types), esbuild (bundler) (001-vscode-extension-setup)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x, Node.js 18+: Follow standard conventions

## Recent Changes
- 001-extension-ui-commands: Added TypeScript 5.x targeting ES2020 + `@types/vscode ^1.85.0`, `esbuild` (bundler), `typescript ^5.x`
- 001-extension-ui-commands: Added TypeScript 5.x targeting ES2020 + `@types/vscode ^1.85.0`, `esbuild` (bundler), `typescript ^5.x`
- 001-kibana-integration: Added Shell script (POSIX bash) with optional Node.js argv + Docker CLI; `curl`/`http` for HTTP checks; Node.js for


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
