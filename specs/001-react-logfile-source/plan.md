# Implementation Plan: React-based LogFileSourcesPanel

**Branch**: `001-react-logfile-source` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-react-logfile-source/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Migrate the existing Log Filepath Config editor panel from a hand‑crafted HTML+vanilla JS implementation to a React‑based webview, using the shared `getReactWebviewHtml` helper from `src/utils/reactWebview.ts`. The panel class (`LogFileSourcesPanel`) will be updated to match the pattern used by `NewSessionPanel`, receiving messages from the React UI and forwarding them to domain services. The React component (`src/webview/log-file-sources/main.tsx`) will replicate the current form fields and validation logic, sending the same message types (`filepath-config:save`, etc.) and responding to host events. No data model changes are needed; existing `FilepathConfig` is reused.

## Technical Context

**Language/Version**: TypeScript (ES2020 targeting Node/browser)  
**Primary Dependencies**: VSCode Extension API, React 18, esbuild, Tailwind CSS  
**Storage**: Local filesystem (workspace `.logex/filepath-configs` directory)  
**Testing**: Existing unit/integration tests use Mocha/Chai with VSCode test runner; no new tests planned for UI migration in this cycle  
**Target Platform**: Visual Studio Code extension (desktop)  
**Project Type**: desktop-app/plugin (VSCode extension with React webviews)  
**Performance Goals**: UI should render within 1 second; message handling must be responsive  
**Constraints**: Must comply with VSCode webview CSP (nonce-based scripts, no external resources)  
**Scale/Scope**: Single panel migration; small React component (<500 lines)

## Constitution Check

The constitution establishes core principles and workflow rules (including branch-per-cycle and
squash-merges). During planning, verify that your proposed design and tooling respect these
guidelines. Any deviation must be justified below.

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

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

**Structure Decision**: The repository already follows a single‑project layout typical for VSCode extensions. This feature adds/updates files under existing `src/panels/editors` and `src/webview` folders; no new projects or packages are required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
