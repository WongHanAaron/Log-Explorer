# Implementation Plan: Config Store Abstraction

**Branch**: `001-config-store-abstraction` | **Date**: 2026-03-03 | **Spec**: [../spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-config-store-abstraction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The extension currently manages filepath and log‑line parsing configurations as individual JSON files under `.logex/` directories. Consumers must scan the filesystem manually and perform ad‑hoc parsing when they need the list of available configurations or the payload of a specific config. The new feature introduces a lightweight "config store" abstraction atop the existing I/O helpers (listConfigs, readFilepathConfig, readFileLogLineConfig) that:

* exposes methods to enumerate short names by category,
* fetch a config object by category and name,
* allows clients to subscribe/unsubscribe to notifications when new configs are added.

The domain models (FilepathConfig, FileLogLineConfig) already exist; this work will rely on them and extend test coverage to validate error conditions and subscription semantics.

## Technical Context

**Language/Version**: TypeScript (ES2020 target via `tsconfig.json`)  
**Primary Dependencies**: `vscode` extension API, React + Tailwind CSS for webviews, `@vscode/test-cli` & Mocha for tests  
**Storage**: filesystem via `vscode.workspace.fs` under `.logex/` directory in the active workspace  
**Testing**: Mocha unit and integration tests, with helpers in `test/runTest.ts`; existing pattern installs source files via `ts-node`. New tests will live under `test/unit/` or `test/suite/`.  
**Target Platform**: VS Code desktop extension (Windows/macOS/Linux)  
**Project Type**: Desktop application extension library with UI components (webview-based).  
**Performance Goals**: Config operations should be instantaneous for directories containing hundreds of files; subscriptions should deliver notifications synchronously with the write operation.  
**Constraints**: Must operate offline, handle absence of workspace folder gracefully, and run inside the sandboxed extension host.  
**Scale/Scope**: The repository is relatively small (~3000 LOC) and the new code will add under 200 lines and corresponding tests.

The LogExplorer constitution requires branch-per-cycle, test-first development, and no
implementation detail leakage in specs. This plan resides on `001-config-store-abstraction`, a
feature branch created by the speckit script. The implementation will add a small helper module
in `src/services` and associated tests in `test/unit`; no new projects or external dependencies
are introduced.

All work will follow Principle III (tests written first) and Principle IV (branch-per-cycle with a
clean commit history). No constitution violations are anticipated, so we may proceed with Phase 0
research.

*GATE: Passed — proceed with Phase 0 research.*

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

**Structure Decision**: This repository uses a simple single‑project layout. Existing
code relevant to this feature lives under `src/domain` (domain type definitions) and
`src/services` (helpers and business logic). The new config store abstraction will augment
`src/services/config-store.ts`. Tests for the abstraction will be placed in
`test/unit/services/config-store.test.ts`; integration smoke tests will reside alongside
existing cases in `test/suite/extension.test.ts`. No additional top‑level folders are
needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
