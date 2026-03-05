# Implementation Tasks: React-based LogFileSourcesPanel

Below are the actionable steps to implement the feature. Tasks are grouped into phases and linked to user stories where appropriate. Each task is self‑contained so that completing the story provides a testable slice of functionality.

## Phase 1 – Setup

- [ ] T001 [P] Verify sbuild.mjs contains a build entry for src/webview/log-file-sources/main.tsx producing dist/webview/log-file-sources.js; adjust if missing.  
  *(file: sbuild.mjs)*

## Phase 2 – Foundational

- [ ] T002 [P] Add eady message support to LogFileSourcesPanel and store an optional shortName parameter for deferred loading.  
  *(file: src/panels/editors/LogFileSourcesPanel.ts)*

## Phase 3 – User Stories

### [US1] Open editor with React UI

- [ ] T003 Implement panel HTML generation by calling getReactWebviewHtml instead of manually building template; remove legacy HTML/script code.  
  *(file: src/panels/editors/LogFileSourcesPanel.ts)*

- [ ] T004 [P] Create the React entrypoint src/webview/log-file-sources/main.tsx with an <App/> component that renders the form stub (initial commit can mirror fields).  
  *(file: src/webview/log-file-sources/main.tsx)*

### [US2] Persist configuration

- [ ] T005 Ensure LogFileSourcesPanel continues to handle ilepath-config:save message and responds with save-result; retain existing file‑write logic.  
  *(file: src/panels/editors/LogFileSourcesPanel.ts)*

- [ ] T006 [P] Wire the React form submit handler to send ilepath-config:save and display feedback based on the save-result host message.  
  *(file: src/webview/log-file-sources/main.tsx)*

### [US3] Validate short name

- [ ] T007 [P] Implement host handling for ilepath-config:validate-name in the panel and reply with 
ame-available.  
  *(file: src/panels/editors/LogFileSourcesPanel.ts)*

- [ ] T008 [P] Add blur/debounce logic in the React UI to send ilepath-config:validate-name and show availability error when received.  
  *(file: src/webview/log-file-sources/main.tsx)*

## Phase 4 – Polish & Cross‑cutting

- [ ] T009 [P] Update documentation: quickstart instructions in specs/001-react-logfile-source/quickstart.md and any README references.  
  *(files: specs folder)*

- [ ] T010 Run 
pm run build and 
pm run watch to confirm bundle generation; fix any build errors.  
  *(workspace task)*

- [ ] T011 Manually verify panel behavior by opening the extension and performing CRUD operations; fix any UI bugs.  
  *(dev environment)*

- [ ] T012 Optionally add or update unit tests for the panel's message handler (mock webview) to cover the new eady path.  
  *(file: 	est/unit/... as needed)*

## Dependencies

1. Phase 1 tasks must complete before user‑story work (ensures build path exists).  
2. Files modified in US1 (panel and React component) are reused by later stories; earlier tasks unblock subsequent testing.  
3. Documentation and manual verification can run in parallel once US2/US3 are implemented.

## Parallel Execution Examples

- T001, T002, and T009 can be done concurrently since they touch different files.  
- Within US3, T007 and T008 are parallelizable (host vs webview).  
- Polish tasks (T010–T012) may run while story tasks are still ongoing, as they do not block implementation.

## MVP Scope

Completing **US1** (T003/T004) delivers a minimal working panel that renders via React; subsequent stories add full functionality.  
If pressed, the MVP release could ship with just the React shell and later enable saving/validation in follow‑up cycles.

---

All tasks above follow the checklist format required by the speckit workflow.
