# Research: VSCode Extension Project Setup with UI Components

**Feature**: 001-vscode-extension-setup  
**Date**: 2026-02-28

## R1: Bundler Choice — esbuild vs webpack

**Decision**: esbuild

**Rationale**: esbuild is the default bundler in the official VSCode extension generator (`yo code`) and is recommended by the VSCode team. It offers 10-100x faster builds than webpack, requires ~20 lines of configuration vs 50-100+ for webpack, natively supports multiple entry points (extension host + webview), and is used by the VSCode team for their own built-in extensions.

**Alternatives Considered**:

| Bundler | Why Rejected |
|---------|-------------|
| webpack | Still supported but slower builds, more complex config, no longer the generator default. Legacy choice. |
| Rollup | No first-class support in the VSCode extension ecosystem. Extra friction for no benefit. |
| tsup | Unnecessary abstraction layer over esbuild. Raw esbuild is simpler and better documented for extensions. |
| Unbundled (tsc only) | Slower activation, larger install size, `node_modules` in package. Not viable for production extensions. |

**Configuration approach**: Two esbuild entry points:
- `src/extension.ts` → `dist/extension.js` (Node.js, CommonJS, externalize `vscode`)
- `src/webview/main.ts` → `dist/webview.js` (browser target, IIFE)

---

## R2: Test Framework and Runner

**Decision**: Mocha + `@vscode/test-cli` + `@vscode/test-electron`

**Rationale**: This is the official testing stack recommended by VSCode documentation and scaffolded by the `yo code` generator. `@vscode/test-cli` wraps `@vscode/test-electron` with Mocha integration, config file support, glob-based test discovery, and proper CI exit codes. Tests run inside a real VSCode Electron process with full access to the `vscode` API — the only way to verify extension activation, command registration, and webview lifecycle.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Jest | Module system conflicts with Electron runtime; no official support; brittle custom test environments required. |
| Vitest | ESM-first design incompatible with Electron CJS runtime; no official adapter. |
| vscode-extension-tester (E2E) | Selenium-based, heavy, slow. Overkill for scaffolding; defer to later. |

**Test tiers**:
- **Integration tests** (now): Mocha via `@vscode/test-cli` inside VSCode Electron — verifies activation, commands, view container contributions.
- **Unit tests** (later): Plain Mocha in Node.js for pure business logic when it emerges.

**Required packages**:
- `@vscode/test-cli` — CLI runner
- `@vscode/test-electron` — Downloads + launches VSCode
- `mocha` — Test framework
- `@types/mocha` — TypeScript types

---

## R3: VSCode Webview Best Practices

**Decision**: Use `WebviewViewProvider` for sidebar panels with strict CSP

**Rationale**: For sidebar webview panels in the Activity Bar, VSCode provides the `WebviewViewProvider` interface (registered via `vscode.window.registerWebviewViewProvider`). This is the correct API for panels that live inside a view container, as opposed to `WebviewPanel` which creates floating editor-area panels.

**Key practices**:
- **Content Security Policy**: Every webview must declare a CSP via `<meta>` tag. Use nonces for inline scripts, restrict sources to `webview.cspSource` for extension resources.
- **Resource loading**: Use `webview.asWebviewUri()` to convert local file paths to webview-safe URIs.
- **Communication**: Extension ↔ webview messaging via `postMessage()` / `onDidReceiveMessage()`. Keep messages typed and serializable.
- **State preservation**: Use `webview.state` (client-side) and `getState()`/`setState()` in webview scripts for view state persistence across visibility toggles.
- **Lifecycle**: Webview views are created when the user first opens the view and destroyed when the view is disposed. The provider's `resolveWebviewView` method is called each time.

**Icon**: SVG icon required for the Activity Bar view container. Should be monochrome (single color, uses `fill` for theming).

---

## R4: Minimum VSCode Version

**Decision**: VSCode 1.85.0

**Rationale**: VSCode 1.85 (December 2023) includes all APIs needed for this project: `WebviewViewProvider`, view containers in Activity Bar, and modern extension activation events. It is old enough to support broad user bases while new enough to include the latest webview CSP improvements. The `@vscode/test-cli` package also targets 1.85+ as its baseline.

---

## R5: Package Manager

**Decision**: npm (default)

**Rationale**: The VSCode extension ecosystem, generator, and documentation all assume npm. Tools like `@vscode/vsce` (for packaging extensions) use npm by default. Using npm avoids compatibility issues and aligns with the official toolchain.
