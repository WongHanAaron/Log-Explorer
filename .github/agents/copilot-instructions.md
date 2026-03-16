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
- TypeScript (ES2021 w/ React 18) + VSCode Extension API, React, Tailwind CSS, existing (001-tag-component)
- configuration files stored on local filesystem; tags are a simple (001-tag-component)
- TypeScript (ES2021) with React 18 and TailwindCSS. + `vscode` extension API, React, `@testing-library/react`, `ts-node`/Mocha for unit tests. (004-logfile-source-save)
- File system under workspace (`.logex/filepath-configs/*.json`) via `vscode.workspace.fs` and `ConfigStore`. (004-logfile-source-save)
- TypeScript 5.x targeting ES2020; Node 18 runtime in VSCode extension host.  Decorators are not currently enabled in tsconfig. + existing dependencies plus new packages for serialization/validation (likely `class-transformer` and `class-validator` or similar).  Also `reflect-metadata` may be required. (005-config-model-serialization)
- JSON files under `.logex/*-configs` accessed via `ConfigStore` (file system through vscode.workspace.fs). (005-config-model-serialization)
- TypeScript 5.x targeting Node/ES2021 in a VSCode + vscode API (`@types/vscode`), React/tailwind libs used (001-logfile-path-ui)
- Configurations are persisted via `ConfigStore` to the workspace (001-logfile-path-ui)
- TypeScript 5.x targeting ES2020/ES2022, Node.js 18+ (per project constraints) + built‑in Node modules (`fs`, `path`), `ssh2-sftp-client` for SFTP, `smb2` for SMB, occasionally `chai`/`mocha` for tests. (008-file-adapters)
- file system accesses only; no database. (008-file-adapters)
- TypeScript 5.x on Node.js 18+ + `@vscode/test-electron`, `@vscode/test-cli`, `mocha`, `chai`, `ts-node`, browser automation runner (`playwright` candidate) (001-ui-e2e-automation)
- File-based test fixtures and run artifacts under `test/e2e/ui/fixtures` and `test/e2e/ui/artifacts` (001-ui-e2e-automation)

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

> **Agent behavior:**
> When applying or suggesting code changes, the assistant should execute `npm run typecheck` (or equivalent `tsc --noEmit`) afterward and surface any resulting diagnostics.  This ensures the errors seen in VS Code are reproduced and fixed iteratively.

## Code Style

TypeScript 5.x, Node.js 18+: Follow standard conventions.  When authoring
TypeScript code, consult `docs/typescript-guidelines.md` for our project‑wide
rules on file/class isolation, exports, dependency injection, etc.

*💡 TypeScript tip:* use strongly typed types wherever possible — prefer
specific interfaces, enums, and generics over `any` or implicit `any` to keep
the codebase robust and self-documenting.

# React UI Development. 
When authoring UI code, consult the 'docs/react-ui-guidelines.md' for our conventions on webview structure, messaging, styling, and documentation.

## Recent Changes
- 001-ui-e2e-automation: Added TypeScript 5.x on Node.js 18+ + `@vscode/test-electron`, `@vscode/test-cli`, `mocha`, `chai`, `ts-node`, browser automation runner (`playwright` candidate)
- 008-file-adapters: Added TypeScript 5.x targeting ES2020/ES2022, Node.js 18+ (per project constraints) + built‑in Node modules (`fs`, `path`), `ssh2-sftp-client` for SFTP, `smb2` for SMB, occasionally `chai`/`mocha` for tests.
- 001-logfile-path-ui: Added TypeScript 5.x targeting Node/ES2021 in a VSCode + vscode API (`@types/vscode`), React/tailwind libs used


<!-- MANUAL ADDITIONS START -->

> ⚠️ **Editor note:** After modifying TypeScript configuration or adjusting imports (e.g. enabling decorators, changing moduleResolution, adding new packages), the VS Code TypeScript server may cache the old settings.  Run **"TypeScript: Restart TS Server"** (or reload the window) so diagnostics accurately reflect the current config.

<!-- MANUAL ADDITIONS END -->
