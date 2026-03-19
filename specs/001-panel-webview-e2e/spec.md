# Feature Specification: Panel-Webview E2E Flow

**Feature Branch**: `001-panel-webview-e2e`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Setup the existing e2e tests to be able to test the end to end flow for the vscode extension's panel and webview. This might include implementing an abstraction over the VSCode API such that it can be spun up with the e2e ui testing workflow without using the vscode api explicitly. This e2e flow should exercise both the panel code and the webview code."

## Clarifications

### Session 2026-03-18

- Q: Which rewrite strategy should this feature adopt for panel+webview e2e? → A: Option C, full clean-slate rewrite with new schema/artifacts and one-time migration of all scenarios.
- Q: What execution model should the rewritten framework use for integrated tests? → A: Option B, a high-fidelity in-process abstracted host runtime implementing VS Code panel/webview contracts.
- Q: Which migration approach should be used for moving legacy scenarios to the rewritten framework? → A: Option A, one-time automated migrator with strict validation and fail-fast reporting.

### Session 2026-03-19

- Q: Should the rewritten host abstraction interface use a versioned name like `V2`? → A: No, use a single canonical non-versioned interface name because this is a full rewrite.
- Q: Should interactive debug execution explicitly require headed browser mode with a visible browser window? → A: Yes, debug mode must run headed so each automated browser action is visible during step-through validation.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Validate Host-to-Webview Lifecycle (Priority: P1)

As an extension maintainer, I can execute an automated UI scenario that starts from a panel-opening action and reaches a rendered webview state so that regressions across the full panel lifecycle are detected before release.

**Why this priority**: This is the minimum slice that proves the e2e harness covers real extension behavior instead of only isolated page interactions.

**Independent Test**: Run one scenario that triggers panel open, waits for initialized UI state, and verifies expected initial content in the webview.

**Acceptance Scenarios**:

1. **Given** a test workspace and an available panel command, **When** the scenario triggers the panel-open action, **Then** a panel instance is created and a webview session is initialized for that panel.
2. **Given** the panel has been initialized, **When** initialization data is delivered to the webview, **Then** the webview shows the expected initial state for the file-access configuration flow.

---

### User Story 2 - Validate Bidirectional Interaction Flow (Priority: P1)

As an extension maintainer, I can run a scenario where webview actions send messages to the panel host and panel responses update the webview so that the complete interaction contract is verified.

**Why this priority**: The feature only delivers value if both directions of communication are exercised; one-way checks miss common integration failures.

**Independent Test**: Run one scenario that performs user actions in the webview, verifies host-side handling, and confirms resulting UI updates.

**Acceptance Scenarios**:

1. **Given** a rendered panel webview, **When** a user action requests save or validate behavior, **Then** the host receives the request and records a corresponding handler outcome.
2. **Given** the host has processed a request, **When** it sends a response event to the webview, **Then** the webview updates visible state to match the processed result.

---

### User Story 3 - Run in CI-Like Automation (Priority: P2)

As a CI owner, I can run panel+webview integration scenarios non-interactively with stable artifacts so that failures are diagnosable and repeatable.

**Why this priority**: Team-wide confidence depends on deterministic execution in automated pipelines, but this builds on the core lifecycle and interaction coverage.

**Independent Test**: Execute the scenario set in automated mode and verify deterministic pass/fail outputs and artifacts.

**Acceptance Scenarios**:

1. **Given** the test suite is executed in automated mode, **When** scenarios complete, **Then** each scenario emits a structured result with pass/fail status and failure diagnostics.
2. **Given** a scenario fails, **When** artifacts are inspected, **Then** they contain enough timeline and assertion context to identify whether the break occurred in panel behavior, webview behavior, or message exchange.

---

### Edge Cases

- Panel initialization succeeds but initial data delivery is delayed; the scenario must wait and fail with a clear timeout if state does not appear.
- Webview sends a malformed or unsupported message; the host must reject it without crashing and surface a diagnosable error signal.
- Host-side save or validation fails; the webview must show an error state and remain interactive for correction and retry.
- Multiple panel open attempts occur in one run; scenarios must isolate state so one test run does not leak into another.
- Fixture data is missing or inconsistent; scenario setup must fail early with explicit fixture diagnostics.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test system MUST support executing a scenario that starts from a panel-open action and reaches a rendered file-access webview state.
- **FR-002**: The test system MUST provide a host-environment abstraction for panel/webview communication so scenarios can run without directly depending on editor runtime APIs.
- **FR-003**: The e2e flow MUST verify bidirectional message exchange between panel host logic and webview logic for at least one configuration interaction (for example, validation or save intent).
- **FR-004**: The test system MUST allow scenarios to assert host-side outcomes and webview-visible outcomes within the same run.
- **FR-005**: The test system MUST preserve deterministic fixture setup, including workspace input state required by panel and webview interaction flows.
- **FR-006**: The test system MUST emit structured run artifacts that identify scenario steps, assertions, and failure location across host and webview layers.
- **FR-007**: The test suite MUST support both automated execution and interactive debug execution for the same panel+webview scenarios.
- **FR-008**: When host initialization or message handling fails, the system MUST report actionable failure diagnostics without terminating the full suite unexpectedly.
- **FR-009**: Scenarios MUST be independently runnable and MUST NOT require cross-scenario state carryover.
- **FR-010**: The rewrite MUST include a one-time migration path that converts existing UI-only scenarios into the new framework format with no loss of regression intent.
- **FR-011**: The rewrite MUST define a new canonical scenario schema and artifact model for panel+webview integrated execution.
- **FR-012**: The rewritten framework MUST execute integrated scenarios against an in-process abstracted host runtime that emulates required VS Code panel/webview contracts.
- **FR-013**: The host abstraction MUST expose deterministic hooks for command execution, message exchange tracing, and panel lifecycle control within a single test process.
- **FR-014**: The rewrite MUST provide a one-time automated migration tool that converts legacy scenario definitions and required artifact expectations to the new canonical format.
- **FR-015**: The migration tool MUST use strict validation and fail-fast reporting for unsupported or ambiguous legacy fields, with actionable diagnostics.
- **FR-016**: The rewritten host abstraction interface MUST use a canonical non-versioned name and MUST NOT introduce a `V2` suffix for the interface identifier.
- **FR-017**: Interactive debug execution MUST support headed browser mode with a visible browser window so each automated action can be observed during step-through testing.

### Key Entities *(include if feature involves data)*

- **Panel Session**: A single host-managed lifecycle instance that owns panel creation, initial data dispatch, and response handling for one scenario run.
- **Webview Interaction Contract**: The set of message types and payload shapes exchanged between host and webview during the tested flow.
- **Scenario Definition**: Declarative test input describing ordered actions, assertions, and expected outcomes across both host and webview behavior.
- **Fixture Workspace**: Deterministic test data and file layout used as baseline state for repeatable panel+webview runs.
- **Run Artifact Set**: Structured outputs recording step timeline, assertion outcomes, and diagnostic details for each scenario run.

## Assumptions

- Existing panel logic for file-access configuration can already be invoked by command or equivalent action in test setup.
- Existing webview UI for the file-access panel can render when provided expected initialization input.
- The rewritten e2e framework replaces the current harness contracts after migration is completed.
- The in-process abstracted host runtime is the default integrated execution target for rewritten e2e scenarios.
- Migration is performed by an automated one-time converter; manual migration is only for explicit exceptions flagged by validator diagnostics.
- The first iteration of panel+webview e2e coverage can target one representative end-to-end user flow before expanding to additional flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least one automated scenario validates the full flow from panel-open action to confirmed webview update, with all required assertions passing in a clean run.
- **SC-002**: Full panel+webview e2e scenarios complete within 60 seconds total for the default suite on a standard development machine.
- **SC-003**: In three consecutive local runs using the same fixture, scenario outcomes are consistent with no flaky pass/fail toggling.
- **SC-004**: For any failed scenario, artifacts provide enough detail that a maintainer can classify failure origin (panel lifecycle, message exchange, or webview rendering) within 10 minutes.
- **SC-005**: All existing UI-only smoke scenarios are migrated into the new framework and pass under the rewritten runner.
- **SC-006**: The in-process abstracted host runtime produces deterministic outcomes for the same fixture across three consecutive runs with identical message trace ordering.
- **SC-007**: The automated migrator converts all in-scope legacy scenarios with zero silent field drops; unsupported fields are reported as explicit migration errors.
