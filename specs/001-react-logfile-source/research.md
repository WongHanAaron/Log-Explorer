# Research Notes: React-based LogFileSourcesPanel

## Decision: Reuse existing React webview infrastructure

- We will use `getReactWebviewHtml` from `src/utils/reactWebview.ts` for generating the panel HTML. This helper is already used by `NewSessionPanel` and other panels, ensuring consistent CSP, CSS, and script loading.
- Rationale: avoids duplicating HTML boilerplate, keeps CSP and build paths centralized.
- Alternatives considered: continuing the legacy `fs`/`path` inlining approach used by `LogFileSourcesPanel` today, but that would require maintaining two different mechanisms and makes migration harder.

## Decision: Trigger initial load via `ready` message from React

- Instead of relying solely on the previous `setTimeout` hack, the React component will send a `{ type: 'ready' }` message when it mounts. The host panel will respond by loading the config (existing or new). This mirrors the pattern used by `NewSessionPanel`.
- Rationale: more deterministic and avoids timing/race issues; aligns with other panels and simplifies tests.

## Decision: Mirror existing filepath-editor behavior in React component

- The new React UI will replicate all current validation rules, message types (`filepath-config:save`, etc.), and form structure. We aim for feature parity rather than redesigning the UX.

## Build Configuration

- The `esbuild.mjs` already has an entry for `src/webview/log-file-sources/main.tsx` producing `dist/webview/log-file-sources.js`. No changes are required.
- When editing the React component, ensure `npm run build` or `npm run watch` includes this bundle. Existing watch tasks already handle it.

## Alternatives considered

- Using a separate non-React form for this panel: rejected because the new requirement explicitly targets React and existing architecture encourages reuse.
- Sending initial data via panel constructor arguments instead of messaging: messaging is the established pattern and avoids serialization issues.


