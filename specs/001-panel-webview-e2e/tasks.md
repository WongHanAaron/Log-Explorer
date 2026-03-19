# Tasks: Panel-Webview E2E Flow Rewrite

**Input**: Design documents from `/specs/001-panel-webview-e2e/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The feature explicitly requires executable integrated scenarios, migration validation, and deterministic automation checks.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare canonical scenario workspace and entrypoints for the rewrite.

- [X] T001 Create canonical scenario directory placeholder in test/e2e/ui/scenarios-canonical/.gitkeep
- [X] T002 Create canonical scenario authoring template in test/e2e/ui/templates/canonical-scenario.template.json
- [X] T003 [P] Create canonical scenario schema reference file in test/e2e/ui/templates/canonical-scenario.schema.json
- [X] T004 [P] Add canonical migration and profile runner scripts in package.json
- [X] T005 Update canonical workflow overview in test/e2e/ui/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared runtime, validation, migration, and artifact infrastructure required by all stories.

**CRITICAL**: No user story implementation starts before this phase is complete.

- [X] T006 Define canonical scenario types and HostRuntime interface in test/e2e/ui/support/types.ts
- [X] T007 Implement canonical scenario validation and loader in test/e2e/ui/support/schema.ts
- [X] T008 [P] Implement in-process host runtime scaffold for panel lifecycle and messaging in test/e2e/ui/support/hostRuntime.ts
- [X] T009 [P] Implement deterministic message trace and host outcome recorder in test/e2e/ui/support/runtimeTrace.ts
- [X] T010 [P] Implement fixture-scoped session isolation helper in test/e2e/ui/support/sessionIsolation.ts
- [X] T011 Implement canonical artifact envelope writer in test/e2e/ui/support/artifacts.ts
- [X] T012 Implement one-time legacy-to-canonical migration mapper with fail-fast diagnostics in test/e2e/ui/support/migration.ts
- [X] T013 Wire migration and canonical profile arguments in test/e2e/ui/support/cliArgs.ts
- [X] T014 Integrate canonical execution path in test/e2e/ui/support/runner.ts

**Checkpoint**: Foundational runtime is ready and user story work can proceed.

---

## Phase 3: User Story 1 - Validate Host-to-Webview Lifecycle (Priority: P1) 🎯 MVP

**Goal**: Execute an integrated scenario from panel open through initialized webview state.

**Independent Test**: Run one canonical lifecycle scenario and verify panel session creation, init data delivery, and expected initial webview state.

### Tests for User Story 1

- [X] T015 [P] [US1] Add canonical schema contract coverage for lifecycle actions in test/e2e/ui/support/schema.contract.test.ts
- [X] T016 [P] [US1] Add lifecycle integration test from panel open to initialized webview state in test/e2e/ui/scenarios/panel-webview-lifecycle.integration.test.ts

### Implementation for User Story 1

- [X] T017 [P] [US1] Add canonical lifecycle smoke scenario in test/e2e/ui/scenarios-canonical/panel-webview-lifecycle.smoke.json
- [X] T018 [US1] Implement panel open and initialization flow in test/e2e/ui/support/hostRuntime.ts
- [X] T019 [US1] Execute lifecycle action handlers in automated mode in test/e2e/ui/support/runner.automated.ts
- [X] T020 [US1] Add initialization timeout and delayed-init diagnostics in test/e2e/ui/support/errors.ts
- [X] T021 [US1] Persist lifecycle events and outcomes in canonical artifact files in test/e2e/ui/support/artifacts.ts
- [X] T022 [US1] Document MVP lifecycle run steps in specs/001-panel-webview-e2e/quickstart.md

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Validate Bidirectional Interaction Flow (Priority: P1)

**Goal**: Verify webview-to-host request handling and host-to-webview response updates in one integrated scenario.

**Independent Test**: Run one canonical interaction scenario that performs a save/validate action in webview and confirms host handling plus returned UI update.

### Tests for User Story 2

- [X] T023 [P] [US2] Add typed message envelope validation tests in test/e2e/ui/support/assertions.test.ts
- [X] T024 [P] [US2] Add bidirectional interaction integration test in test/e2e/ui/scenarios/panel-webview-messageflow.integration.test.ts

### Implementation for User Story 2

- [X] T025 [P] [US2] Add canonical bidirectional interaction scenario in test/e2e/ui/scenarios-canonical/panel-webview-messageflow.smoke.json
- [X] T026 [US2] Implement webview-to-host message dispatch handling in test/e2e/ui/support/commands.ts
- [X] T027 [US2] Implement host-to-webview response wait and assertion flow in test/e2e/ui/support/runner.automated.ts
- [X] T028 [US2] Implement malformed and unsupported message rejection handling in test/e2e/ui/support/hostRuntime.ts
- [X] T029 [US2] Extend assertion adapters for combined host/webview outcomes in test/e2e/ui/support/assertions.ts
- [X] T030 [US2] Record directional message trace classification in test/e2e/ui/support/runtimeTrace.ts

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: User Story 3 - Run in CI-Like Automation (Priority: P2)

**Goal**: Run canonical integrated scenarios non-interactively with deterministic pass/fail and actionable artifacts.

**Independent Test**: Execute canonical suite in automation mode and verify deterministic artifacts, migration reporting, and failure-origin classification.

### Tests for User Story 3

- [X] T031 [P] [US3] Add strict migration fail-fast tests in test/e2e/ui/support/migration.test.ts
- [X] T032 [P] [US3] Add automated artifact integrity integration test in test/e2e/ui/scenarios/ci-artifacts.integration.test.ts

### Implementation for User Story 3

- [X] T033 [P] [US3] Add canonical CI profile definition in test/e2e/ui/scenarios-canonical/panel-webview-ci.profile.json
- [X] T034 [US3] Implement migration command execution branch in test/e2e/ui/support/cli.ts
- [X] T035 [US3] Implement canonical run summary and deterministic result shaping in test/e2e/ui/support/results.ts
- [X] T036 [US3] Implement failure-origin classifier (panel vs webview vs message path) in test/e2e/ui/support/debugOutput.ts
- [X] T037 [US3] Wire non-interactive canonical suite command routing in scripts/run-ui-e2e.js
- [X] T038 [US3] Add determinism verification runner for repeated canonical scenarios in scripts/run-ui-e2e-determinism.js
- [X] T039 [US3] Document CI-mode, migration, and determinism checks in specs/001-panel-webview-e2e/quickstart.md

**Checkpoint**: US3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, docs alignment, and cross-story hardening.

- [X] T040 [P] Align final runtime interface and artifact examples in specs/001-panel-webview-e2e/contracts/panel-webview-e2e-contract.md
- [X] T041 [P] Align final migration field mapping and cutover notes in specs/001-panel-webview-e2e/contracts/scenario-extensions.md
- [X] T042 Remove deprecated legacy-only fields from scenario template in test/e2e/ui/templates/scenario.template.json
- [X] T043 [P] Add troubleshooting section for migration/timeout/message diagnostics in test/e2e/ui/README.md
- [X] T044 Run quickstart validation and capture final command examples in specs/001-panel-webview-e2e/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): No dependencies, can start immediately.
- Phase 2 (Foundational): Depends on Phase 1 and blocks all user stories.
- Phase 3 (US1), Phase 4 (US2), Phase 5 (US3): Depend on Phase 2 completion.
- Phase 6 (Polish): Depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): Starts after foundational phase, no dependency on other stories.
- US2 (P1): Starts after foundational phase, no dependency on US1 completion.
- US3 (P2): Starts after foundational phase and benefits from US1/US2 runtime paths, but remains independently testable.

### Story Completion Order

- Recommended MVP order: US1 first.
- Full delivery order: US1 and US2 (parallel or sequential), then US3.

---

## Parallel Execution Examples

### User Story 1

- Run T015 and T016 in parallel.
- Run T017 in parallel with T018.
- Then run T019 -> T020 -> T021 -> T022.

### User Story 2

- Run T023 and T024 in parallel.
- Run T025 in parallel with T026.
- Then run T027 -> T028 -> T029 -> T030.

### User Story 3

- Run T031 and T032 in parallel.
- Run T033 in parallel with T034.
- Then run T035 -> T036 -> T037 -> T038 -> T039.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate lifecycle scenario independently.
4. Demo MVP before expanding scope.

### Incremental Delivery

1. Deliver US1 integrated lifecycle coverage.
2. Deliver US2 bidirectional interaction coverage.
3. Deliver US3 CI automation and migration guarantees.
4. Complete Phase 6 polish and consistency updates.

### Parallel Team Strategy

1. Team finishes Setup and Foundational phases together.
2. After Phase 2:
   - Engineer A owns US1.
   - Engineer B owns US2.
   - Engineer C owns US3.
3. Merge each story after its independent test criteria pass.

---

## Notes

- `[P]` means the task can run in parallel safely.
- `[US1]`, `[US2]`, `[US3]` provide story traceability.
- Every task references a concrete file path.
- Keep tasks unchecked until implementation begins.
