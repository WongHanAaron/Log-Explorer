# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add the ability for the Log File Source Editor to persist configurations.  The webview already has form fields and communicates with `LogFileSourcesPanel` which uses `ConfigStore` to read/write JSON.  The new work is exclusively on the React side: determine when the form is valid and dirty, show the Save button accordingly, and wire the submit handler to post the save message (already implemented in panel).  After a successful save the UI must reflect the persisted state.  Unit tests will cover visibility of the button and message payloads.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (ES2021) with React 18 and TailwindCSS.  
**Primary Dependencies**: `vscode` extension API, React, `@testing-library/react`, `ts-node`/Mocha for unit tests.  
**Storage**: File system under workspace (`.logex/filepath-configs/*.json`) via `vscode.workspace.fs` and `ConfigStore`.  
**Testing**: Unit tests with Mocha/TS-node and jsdom; existing e2e/extension tests cover higher-level flows.  
**Target Platform**: VS Code desktop (Windows/macOS/Linux) inside webview.  
**Project Type**: Desktop application extension (VS Code extension).  
**Performance Goals**: Nominal; form validation and saving are instant (sub‑100ms).  
**Constraints**: Must work in webview environment where CSS `group-hover` behaviour is unreliable (already known).  
**Scale/Scope**: Single feature in an existing codebase (~400 LOC change).  

## Constitution Check

This feature lives on its own `004-logfile-source-save` branch, implementing a single cohesive
piece of functionality. Changes are confined to existing webview files and associated tests. No
new external dependencies are introduced. The plan adheres to the branch-per-cycle principle and
will be merged via squash once complete. There are no constitution violations to justify at this
stage.

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: The feature adds logic within the existing `src/webview/log-file-sources` React app and corresponding unit tests under `test/unit/webview/log-file-sources`. No new directories are needed beyond these.  The backend panel already has save handling; no additional source-level files are required.
## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
