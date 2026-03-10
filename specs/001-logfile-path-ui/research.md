# Research: Log File Path Config Split‑View

**Feature**: two‑column editor for log file path configurations
**Date**: 2026-03-10

This document collects background information and design choices to guide
implementation of the split‑view UI.

## Existing Code

* The current log file path editor is implemented in
  `src/panels/editors/LogFilePathPanel.ts` (or similar).  It hosts a webview
  built with React and communicates with the extension host via `postMessage`.
* `ConfigStore` in `src/services/config-store.ts` already provides methods for
  listing, retrieving, creating, updating, and deleting configurations.  The
  store emits events when changes occur (`onDidChange` or similar).
* Other panels (e.g. session panel) demonstrate patterns for fetching data,
  reacting to updates, and implementing reusable React components.

## Candidate Approaches

1. **In‑panel polling** – periodically call `configStore.listConfigNames()` and
   diff the results.  Simple but wasteful; delays between changes are limited
   by interval.
2. **Event subscription** – `ConfigStore` already exposes an event emitter
   (`onDidChange`).  The panel can register a listener during activation and
   push updates to the webview via messages.  This provides immediate
   propagation and is lightweight.  Preferred.
3. **Webview‑only store** – fetch the list once and maintain it in React state.
   When the user adds/deletes configs through the panel itself, update locally
   and also the `ConfigStore`.  This covers one direction but not external
   changes, so must be combined with (2).

## UI Considerations

* Use existing `ListBox`/`Select` components already used elsewhere to ensure
  consistent look & feel.  Add a `<input type="text">` above it wired to
a React `useState` value and filter function.
* When panel width becomes narrow (mobile‑sized), collapse list into a modal or
overlap with editor.  For now treat as P3 requirement; initial implementation
can rely on CSS flex wrap and permit user to horizontally scroll.
* Maintain keyboard focus: use `tabindex` and `onKeyDown` handlers so arrow
  keys move selection in the list and Enter activates it.

## Data Flow & Message Protocol

* Extension host will send `init` message containing current list of names
  and (optionally) the currently loaded config.
* Webview posts `selectConfig` with the chosen name; host responds with
  `configData` containing full object so React can populate fields.
* When changes are saved in the form, webview posts `updateConfig` or
  `createConfig`; host writes using `ConfigStore` and then broadcasts
  `configListChanged` to all open panels.
* Extension host listens for `ConfigStore.onDidChange` and forwards an
  `configListChanged` message with new name list.

## Open Questions

* **Change events API** – confirm whether `ConfigStore` currently emits events
  or if we need to extend it.  If not, we may retrofit a simple `EventEmitter`.
* **Filtering performance** – anticipated config lists are small (<100), so
  no virtualization needed.  If lists may grow very large, consider a
  paginated view or server‑side filtering.
* **Editing while list updates** – if the user is actively editing a config
  that gets deleted externally, decide whether to keep fields editable and
  show a warning, or immediately clear the form.  For now plan to show an
  error banner and clear the fields.

## Decisions

* Use event subscription to keep the list live (option 2 above).
* Implement reusable React component `ConfigList` with search input and
  selection callbacks; adopt existing CSS utilities for layout.
* Keep the right editor mostly unchanged; only add support for loading a
  specific config by name.
* Wiring will be done in `src/panels/editors/LogFilePathPanel.ts` and the
  companion webview script under `src/webview/log-filepath/main.tsx`.

This research doc will be updated as implementation progresses or new
unknowns surface.
