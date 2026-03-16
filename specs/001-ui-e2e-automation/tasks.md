# Tasks: UI E2E Automation and Replay

**Input**: Design documents from `/specs/001-ui-e2e-automation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize UI E2E project scaffolding and command entry points

- [ ] T001 Create UI E2E folder scaffolding and placeholder files in test/e2e/ui/{artifacts,fixtures,scenarios,support,templates}/.gitkeep
- [ ] T002 Add UI E2E npm script placeholders in package.json
- [ ] T003 [P] Add UI E2E quick command launcher script in scripts/run-ui-e2e.js
- [ ] T004 [P] Add scenario template for authoring new tests in test/e2e/ui/templates/scenario.template.json
- [ ] T005 [P] Add fixture workspace README and baseline fixture contract in test/e2e/ui/fixtures/default-workspace/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared runtime, schema validation, and artifact plumbing required by all user stories

**CRITICAL**: No user story work begins until this phase completes

- [ ] T006 Define shared E2E domain types aligned with data model in test/e2e/ui/support/types.ts
- [ ] T007 Implement scenario schema parsing and validation in test/e2e/ui/support/schema.ts
- [ ] T008 [P] Implement fixture/environment bootstrap and preflight diagnostics in test/e2e/ui/support/environment.ts
- [ ] T009 [P] Implement command and UI action driver abstractions in test/e2e/ui/support/commands.ts
- [ ] T010 [P] Implement assertion adapter framework for expected outputs in test/e2e/ui/support/assertions.ts
- [ ] T011 Implement artifact writer for result/events/manifest files in test/e2e/ui/support/artifacts.ts
- [ ] T012 Implement core scenario runner orchestration in test/e2e/ui/support/runner.ts
- [ ] T013 Wire npm scripts to new runner modes (run/grep/debug/replay) in package.json

**Checkpoint**: Foundational runtime complete; user stories can now be implemented and tested independently

---

## Phase 3: User Story 1 - Run reliable automated UI flows (Priority: P1) 🎯 MVP

**Goal**: Execute browser-driven UI workflows with deterministic assertions and per-test outcomes

**Independent Test**: Run a selected scenario and verify pass/fail output plus generated result/events artifacts

### Tests for User Story 1

- [ ] T014 [P] [US1] Add contract tests for scenario schema validation in test/e2e/ui/support/schema.contract.test.ts
- [ ] T015 [P] [US1] Add integration test for automated run status and failure diagnostics in test/e2e/ui/scenarios/automated-run.integration.test.ts
- [ ] T016 [P] [US1] Add assertion adapter tests for text/visibility/state outputs in test/e2e/ui/support/assertions.test.ts

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create P1 filepath config smoke scenario definition in test/e2e/ui/scenarios/filepath-config.smoke.json
- [ ] T018 [P] [US1] Create P1 output verification scenario definition in test/e2e/ui/scenarios/output-verification.smoke.json
- [ ] T019 [US1] Implement automated mode execution pipeline in test/e2e/ui/support/runner.automated.ts
- [ ] T020 [US1] Implement per-test summary and exit code mapping in test/e2e/ui/support/results.ts
- [ ] T021 [US1] Integrate browser automation adapter with webview interactions in test/e2e/ui/support/webviewDriver.ts
- [ ] T022 [US1] Add setup/precondition error code mapping in test/e2e/ui/support/errors.ts
- [ ] T023 [US1] Add CLI entry point for run and grep execution in scripts/run-ui-e2e.js
- [ ] T024 [US1] Document automated run usage and expected outputs in test/e2e/ui/README.md

**Checkpoint**: User Story 1 is independently runnable with deterministic assertions and pass/fail reporting

---

## Phase 4: User Story 2 - Debug UI tests step-by-step with visual feedback (Priority: P2)

**Goal**: Allow developers to step through UI interactions with visible intermediate assertion state

**Independent Test**: Launch a single scenario in debug mode and verify pause/step/resume behavior with visible action context

### Tests for User Story 2

- [ ] T025 [P] [US2] Add debug stepping integration test for pauseBefore/pauseAfter behavior in test/e2e/ui/scenarios/debug-step.integration.test.ts
- [ ] T026 [P] [US2] Add debug state emission tests for step context visibility in test/e2e/ui/support/debugSession.test.ts

### Implementation for User Story 2

- [ ] T027 [US2] Implement debug session state machine for step/pause/resume in test/e2e/ui/support/debugSession.ts
- [ ] T028 [US2] Extend runner to execute debug mode with interactive step control in test/e2e/ui/support/runner.debug.ts
- [ ] T029 [US2] Add debug channel logging for current step and assertion status in test/e2e/ui/support/debugOutput.ts
- [ ] T030 [US2] Add scenario-level debug options parsing in test/e2e/ui/support/cliArgs.ts
- [ ] T031 [US2] Extend command launcher with debug mode and scenario targeting in scripts/run-ui-e2e.js
- [ ] T032 [US2] Add visible debug walkthrough scenario fixture in test/e2e/ui/scenarios/filepath-config.debug.json
- [ ] T033 [US2] Document step-through debug workflow in test/e2e/ui/README.md

**Checkpoint**: User Story 2 is independently testable with visible step-by-step debugging and state inspection

---

## Phase 5: User Story 3 - Replay test executions for manual inspection (Priority: P3)

**Goal**: Replay completed runs using persisted artifacts for manual verification

**Independent Test**: Execute a scenario, select the generated run ID, and replay timeline with event/snapshot inspection

### Tests for User Story 3

- [ ] T034 [P] [US3] Add replay manifest validation tests in test/e2e/ui/support/replayLoader.test.ts
- [ ] T035 [P] [US3] Add replay integration test for run-id based execution in test/e2e/ui/scenarios/replay.integration.test.ts

### Implementation for User Story 3

- [ ] T036 [US3] Implement replay artifact loader and validation in test/e2e/ui/support/replayLoader.ts
- [ ] T037 [US3] Implement replay timeline reconstruction from events stream in test/e2e/ui/support/replayTimeline.ts
- [ ] T038 [US3] Implement replay CLI mode with --run-id and --scenario options in test/e2e/ui/support/replayCli.ts
- [ ] T039 [US3] Extend launcher to support replay mode command routing in scripts/run-ui-e2e.js
- [ ] T040 [US3] Add replay manifest generation to artifact writer in test/e2e/ui/support/artifacts.ts
- [ ] T041 [US3] Document replay workflow and manual inspection steps in test/e2e/ui/README.md

**Checkpoint**: User Story 3 is independently testable with run-specific replay and validation

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Strengthen reliability, docs, and CI integration across all stories

- [ ] T042 [P] Add flaky-step timeout tuning and wait-condition hardening in test/e2e/ui/support/waits.ts
- [ ] T043 [P] Add cross-story regression suite entry covering P1/P2/P3 flows in test/e2e/ui/scenarios/regression-suite.test.ts
- [ ] T044 Add CI-friendly artifact retention and cleanup policy in scripts/run-ui-e2e.js
- [ ] T045 [P] Add troubleshooting guide for common setup/debug/replay failures in docs/testing/ui-e2e.md
- [ ] T046 Run quickstart end-to-end validation and update command examples in specs/001-ui-e2e-automation/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): No dependencies, starts immediately
- Phase 2 (Foundational): Depends on Phase 1; blocks all user stories
- Phase 3 (US1): Depends on Phase 2; delivers MVP
- Phase 4 (US2): Depends on Phase 2; can proceed in parallel with US1 after foundation
- Phase 5 (US3): Depends on Phase 2 and artifact contracts from T011/T040
- Phase 6 (Polish): Depends on completion of selected user stories

### User Story Dependencies

- US1 (P1): No dependencies beyond foundational phase
- US2 (P2): No dependencies on US1 logic; uses shared runner and debug contracts from foundational phase
- US3 (P3): Depends on foundational artifact pipeline and replay manifest generation; does not require US2

### Within Each User Story

- Tests are written first and must fail before implementation
- Scenario definitions precede mode-specific runner integration
- Runner mode implementation precedes CLI wiring and documentation

### Parallel Opportunities

- Setup: T003-T005 can run in parallel
- Foundational: T008-T010 can run in parallel after T006-T007 begin
- US1: T014-T018 can run in parallel; T019-T023 mostly sequential
- US2: T025-T026 can run in parallel; T027-T031 mostly sequential
- US3: T034-T035 can run in parallel; T036-T039 mostly sequential
- Polish: T042, T043, and T045 can run in parallel

---

## Parallel Example: User Story 1

- Run together: T014, T015, T016 (tests in different files)
- Run together: T017, T018 (scenario definitions)
- Then sequence: T019 -> T020 -> T021 -> T022 -> T023 -> T024

## Parallel Example: User Story 2

- Run together: T025, T026
- Then sequence: T027 -> T028 -> T029 -> T030 -> T031 -> T032 -> T033

## Parallel Example: User Story 3

- Run together: T034, T035
- Then sequence: T036 -> T037 -> T038 -> T039 -> T040 -> T041

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate independent automated execution and artifact generation
4. Demo MVP before expanding to debug/replay

### Incremental Delivery

1. Deliver US1 automated reliability and assertions
2. Deliver US2 step-through debug visibility
3. Deliver US3 replay for manual inspection
4. Finish with Phase 6 hardening and documentation

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Phase 2:
   - Engineer A: US1 automation/assertions
   - Engineer B: US2 debug stepping
   - Engineer C: US3 replay pipeline
3. Merge each story only after independent test criteria pass
