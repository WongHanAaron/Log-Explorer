# LogExplorer Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-28

## Active Technologies
- TypeScript 5.x / Node.js 18+ (ESM `.mjs` helper scripts) + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH) (002-local-vsix-install)
- N/A — output artefacts written to `releases/` on local filesystem (002-local-vsix-install)
- Node.js 18+ / ESM `.mjs` helper scripts; PowerShell 7+ (`pwsh`) for `.ps1` convenience scripts + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH); `pwsh` (PowerShell 7+, optional for `.ps1` scripts) (002-local-vsix-install)

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
- 002-local-vsix-install: Added Node.js 18+ / ESM `.mjs` helper scripts; PowerShell 7+ (`pwsh`) for `.ps1` convenience scripts + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH); `pwsh` (PowerShell 7+, optional for `.ps1` scripts)
- 002-local-vsix-install: Added TypeScript 5.x / Node.js 18+ (ESM `.mjs` helper scripts) + `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH)

- 001-vscode-extension-setup: Added TypeScript 5.x, Node.js 18+ + @types/vscode (extension API types), esbuild (bundler)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
