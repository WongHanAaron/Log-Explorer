# React Webview Guidelines for VS Code Extension

This document provides the **agent instructions** and best practices for adding new
React‑based UI features to the LogExplorer VS Code extension.  Follow this
pattern exactly to keep code consistent, maintainable, and theme‑aware.

---

## 1. Host Panel Class (TypeScript)

1. Create a new file `src/panels/editors/<FeatureName>Panel.ts`.
2. Use the singleton pattern (static `currentPanel`) exactly like
   [`NewSessionPanel.ts`](src/panels/editors/NewSessionPanel.ts).
3. `createOrShow(extensionUri: vscode.Uri, ...args?)` must:
   - validate workspace folder availability
   - compute any necessary URIs (e.g. config directory)
   - reveal existing panel or create a new `vscode.window.createWebviewPanel`
     with `viewType='logexplorer.<featureName>'`, an appropriate title, and
     `{ enableScripts: true, localResourceRoots: [extensionUri], retainContextWhenHidden: true }`.
   - instantiate the panel class, passing `shortName` or other args to the
     constructor along with `workspaceRoot`.
4. In the constructor:
   - store parameters (e.g. `this._shortName = shortName`) if they will be
     needed later.
   - set `this._panel.webview.html` via a helper method `_getWebviewContent`.
   - register `this._panel.webview.onDidReceiveMessage` pointing to
     `_handleMessage` and dispose handlers.
5. Implement `_getWebviewContent(webview)` as:
   ```ts
   return getReactWebviewHtml(webview, this._extensionUri, '<bundle>.js', '<Title>');
   ```
6. Implement `_handleMessage(msg)` to:
   - ignore non-object messages
   - switch on `msg.type`
   - react to `'ready'` by calling `_sendLoad()`
   - react to feature‑specific message types (save/validate/cancel)
   - post back messages via `this._panel.webview.postMessage({...})`
7. Implement `_sendLoad(<args>)` which reads data (ConfigStore etc.) and
   posts a `*:load` message to the webview.  Use stored constructor args if
   none were provided.
8. Implement `dispose()` to clear static reference, dispose panel/disposables.

## 2. React Webview (Client Side)

1. Create `src/webview/<featureName>/main.tsx` as the entrypoint.
2. The file should:
   ```tsx
   import React, { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import { App } from './App'; // entrypoint component that contains the page logic

   createRoot(document.getElementById('root')!).render(
     <StrictMode><App /></StrictMode>
   );
   ```
   The `App` component is responsible for holding local state, registering
   message handlers, and orchestrating child components. Keep `main.tsx` as
   a trivial bootstrapper so that the bundle size stays small.
3. Use `acquireVsCodeApi()` to obtain the VS Code API.  Prefer a helper
   `getVsCodeApi()` in `webview/shared/lib/vscode.ts` if available.
4. Components: put them under `src/webview/<featureName>/components`.
   - The top‑level `App` can delegate portions of the UI to smaller
     components (e.g. a `FormPage` or `SettingsPanel`) to keep files
     focused.  Each component file should export a single React function
     component.
   - Use shared UI components (`Input`, `Button`, `Label`, etc.) from
     `src/webview/shared/components/ui` for consistency.  For tag-like or
     pill controls, use the new `Tag`/`TagSet` components located at
     `src/webview/shared/components/tag`.
   - Use `useEffect` to send `{ type: 'ready' }` once and to set up a
     `window.addEventListener('message',…)` listener.
   - Handle messages by casting to `HostToWebviewMessage` (imported from
     `../messages`) and switching on `type`.
   - Post user events (`save`, `validate-name`, `cancel`, etc.) using
     `vscode.postMessage({ type: '...', …})`.
5. Form and layout should use Tailwind utility classes that reference the
   shared CSS variables (`bg-[--input-bg]`, etc.).
6. Include any view‑specific styles in a local `styles.css` file if necessary.

## 3. Messaging Contracts

1. Add new message interfaces to `src/webview/messages.ts`.  Each message
   must have a `type` discriminant.
2. Update the union types `HostToWebviewMessage` / `WebviewToHostMessage`
   accordingly.
3. Both the panel and React code should import the relevant types from this
   module for compile‑time safety.

## 4. Build Configuration

1. Edit `esbuild.mjs` and add an entry to the `panelConfigs` array:
   ```js
   { in: 'src/webview/<featureName>/main.tsx', out: 'dist/webview/<featureName>.js' },
   ```
2. Run `npm run build` or `npm run watch` to ensure the bundle is generated.
3. The bundle name passed to `getReactWebviewHtml` must match the `out` path above.

## 5. Styling and Theming

- Use the shared global variables defined in
  `src/webview/shared/globals.css` for VS Code theme integration.
- For any component, apply Tailwind classes referencing those variables
  (see existing code for examples: `text-destructive-foreground`,
  `border-[--input-border]`, etc.).
- Avoid writing raw `<button>`/`<input>` styles; use the shared `<Button>`
  and `<Input>` components that already handle the correct styling.

## 6. Documentation & Testing

- Update the spec/plan/tasks files as part of speckit workflow.
- Add instructions to the feature’s `quickstart.md` describing how to invoke
  the new panel and test it manually.
- After implementation, run `npx tsc --noEmit` to catch compile errors.
- Optionally add unit tests for the panel message handler or React logic.

## 7. Naming Conventions

- `viewType`: `'logexplorer.<featureName>'` (use kebab-case).
- Webview folder name and bundle use the same kebab-case string.
- Panel class named `<FeatureName>Panel`.
- Commands registered in `src/commands/index.ts` follow the same prefix,
  e.g. `'logexplorer.edit<FeatureName>'`.

---

Following the above pattern ensures every React UI in the extension is built
and maintained the same way.  When in doubt, copy the `NewSession` or
`LogFileSources` implementation and adjust the message types and UI fields.
This document should be used by the agent whenever adding new UI features.