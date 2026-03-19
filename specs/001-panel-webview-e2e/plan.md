# Implementation Plan: Panel-Webview E2E Flow Rewrite

**Branch**: `001-panel-webview-e2e` | **Date**: 2026-03-19 | **Spec**: `/specs/001-panel-webview-e2e/spec.md`
**Input**: Feature specification from `/specs/001-panel-webview-e2e/spec.md`

## Summary

Rewrite the UI e2e framework so integrated scenarios can exercise extension-host panel lifecycle and webview behavior in one deterministic run, including one-time migration of existing UI-only scenarios to a canonical schema. The technical approach uses an in-process abstract host runtime with strict message contracts, deterministic tracing, and fail-fast migration validation.

## Technical Context

**Language/Version**: TypeScript 5.9.x (Node.js 18+, VS Code engine ^1.85.0)
**Primary Dependencies**: Mocha, ts-node, @vscode/test-cli, @vscode/test-electron, Playwright
**Storage**: File-based fixtures and JSON scenario/artifact files under `test/e2e/ui/`
**Testing**: Mocha-based UI e2e harness (`npm run test:e2e:ui`, `npm run test:e2e:ui:debug`)
**Target Platform**: VS Code extension runtime on Windows/macOS/Linux CI environments
**Project Type**: VS Code extension with integrated host+webview test harness
**Performance Goals**: Default integrated suite completes within 60 seconds (SC-002)
**Constraints**: Deterministic ordering, isolated scenario state, strict validation, no direct dependency on editor runtime APIs in integrated harness
**Scale/Scope**: Migrate all in-scope UI smoke scenarios and establish one canonical rewrite runner for panel+webview flows

## Constitution Check

### Pre-Phase 0 Gate Review

- Gate 1 (Simplicity & Focus): PASS
  - Rewrite replaces fragmented legacy e2e behavior with one canonical model and avoids dual-framework long-term complexity.
- Gate 2 (Secure Webview Practices): PASS
  - Plan includes explicit typed message contracts and validation for host/webview exchange.
- Gate 3 (Test-First Development): PASS
  - Feature scope is test infrastructure; migrated and newly modeled scenarios are themselves executable tests with deterministic assertions.
- Gate 4 (Branch/History Workflow): PASS
  - Work is planned on branch `001-panel-webview-e2e`.
- Gate 5 (Versioning & Release Discipline): PASS
  - No change to release process; outputs remain test artifacts and docs in feature scope.

Result: PASS. No constitutional violations requiring exception handling.

### Post-Phase 1 Design Re-Check

- Gate 1 (Simplicity & Focus): PASS
  - Data model and contracts keep a narrow host runtime surface and avoid version-suffixed interface fragmentation.
- Gate 2 (Secure Webview Practices): PASS
  - Contracts require explicit message `type` and deterministic error reporting for unknown types.
- Gate 3 (Test-First Development): PASS
  - Quickstart and contracts center on executable migration and integrated scenario runs.
- Gate 4 (Branch/History Workflow): PASS
  - Artifacts scoped to `specs/001-panel-webview-e2e/` on feature branch.
- Gate 5 (Versioning & Release Discipline): PASS
  - Schema version metadata remains explicit while runtime interface naming remains canonical and non-versioned.

Result: PASS. Proceed to Phase 2 task generation.

## Project Structure

### Documentation (this feature)

```text
specs/001-panel-webview-e2e/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── panel-webview-e2e-contract.md
│   └── scenario-extensions.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── extension.ts
├── commands/
├── panels/
├── services/
├── types/
├── utils/
├── webview/
└── workspace/

test/
├── e2e/
│   └── ui/
│       ├── artifacts/
│       ├── fixtures/
│       ├── scenarios/
│       ├── support/
│       └── templates/
├── unit/
└── tools/

scripts/
└── run-ui-e2e.js
```

**Structure Decision**: Use the existing single-project VS Code extension structure. Implement rewrite artifacts in `test/e2e/ui/` and corresponding extension/webview support code under existing `src/` domains where needed.

## Complexity Tracking

No constitution violations identified. Complexity exception table not required.
