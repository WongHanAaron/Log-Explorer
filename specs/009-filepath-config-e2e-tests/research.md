# Phase 0: Research — E2E Testing Strategy for Filepath Config

**Date**: 2026-03-18  
**Feature**: 009-filepath-config-e2e-tests  

## Key Unknowns & Resolving Questions

### 1. E2E Test Framework & Tooling

**Unknown**: What E2E testing approach is already established in this project?

**Research**: 
- Reviewed existing E2E framework in `test/e2e/ui/`
- Scenario-based test harness using JSON-defined steps
- Test runner supports Chromium Playwright
- Existing test infrastructure: `automated-run.integration.test.ts` and `debug-step.integration.test.ts`
- Scenario format: JSON with action types (openBrowser, goto, click, verify)
- Artifacts captured in JSON format (result.json, events.json, replay-manifest.json)

**Decision**: Use the established JSON scenario format (see `test/e2e/ui/scenarios/`) + TypeScript test runners. This provides:
- Declarative, maintainable test definitions
- Built-in artifact capture for debugging
- Step-through debug mode for development
- Replay capability for CI/CD

**Rationale**: Framework is already integrated, documented, and actively in use. No need to rebuild from scratch.

---

### 2. Test Fixture Management

**Unknown**: How should the test fixture workspace be configured for filepath-config tests?

**Research**:
- Default fixture is in `test/e2e/ui/fixtures/default-workspace/`
- Fixtures can be specified in scenario preconditions: `"preconditions": ["fixture:default-workspace"]`
- Fixture structure includes UI harness files (`ui/debug-harness.html`)
- Config files can be pre-populated in fixture or created programmatically

**Decision**: 
- Use `default-workspace` fixture
- Pre-populate minimal starter config in fixture for "Load Existing Config" tests
- Create configs programmatically in scenario setup steps when needed
- Clean up created configs in teardown steps

**Rationale**: Pre-populated fixtures avoid flaky tests caused by missing prerequisites; programmatic creation allows test isolation.

---

### 3. Config File Location & Storage

**Unknown**: Where are filepath configs stored in the file system?

**Research**:
- Spec requires: `.logex/filepath-configs/{shortName}.json`
- This is consistent with other config stores in the project
- File access is via workspace file system (vscode.workspace.fs)
- No special permissions or native I/O required

**Decision**: 
- Test fixture will have prepared `.logex/filepath-configs/` directory
- Tests will verify config persistence at this exact path
- Cleanup will remove created test configs post-run
- Path is absolute workspace-relative

**Rationale**: Matches spec assumption and existing project patterns.

---

### 4. Form Validation & Error Messages

**Unknown**: How are validation errors currently displayed in the form?

**Research**:
- Spec mentions "inline error is shown below the name input"
- Kebab-case validation regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Save button should be hidden when validation errors exist
- Error must clear when valid input is provided

**Decision**:
- Identify stable CSS selectors for error messages (e.g., `.error-text`, `aria-invalid`)
- Use text-content assertions to verify error messages match spec
- Test that button visibility toggles based on form state
- Record selectors in test contracts for maintainability

**Rationale**: Selecting by semantic attributes (not by position) ensures tests survive UI refactoring.

---

### 5. Config List Panel Integration

**Unknown**: How does the "Load Existing Config" interaction work in the UI?

**Research**:
- Left panel shows list of saved configs (clickable items)
- Right panel shows edit form
- Clicking a config in list should populate form fields
- Must verify no stale data persists between selections
- Multiple selections in sequence should work correctly

**Decision**:
- Use click action on list item selector
- Verify form fields populate with correct values using textContent assertions
- Test sequential selections to catch state-management bugs
- Record list item selector pattern in contracts

**Rationale**: Sequential interaction tests catch state-management issues that isolated tests miss.

---

### 6. Save Button Visibility States

**Unknown**: What exact conditions trigger Save button visibility?

**Research**:
- Spec lists 4 visibility conditions:
  1. No fields filled → button hidden
  2. Name valid, path empty → button hidden  
  3. Both fields valid → button visible
  4. Valid form, then error introduced → button hidden
- Button should toggle dynamically as user types

**Decision**:
- Create test scenarios for each condition
- Use visibility assertions (`:visible` pseudo-selector or `display !== 'none'`)
- Test rapid field changes to ensure no race conditions
- Document expected button state in test contracts

**Rationale**: Explicit condition testing catches edge cases in button visibility logic.

---

### 7. Test Speed & Performance

**Unknown**: How fast should individual E2E tests run?

**Research**:
- Spec requirement: Individual tests < 5 seconds, full suite < 30 seconds
- E2E tests for UI forms typically run: click (~100-500ms) + verify (~50-200ms)
- File I/O on local disk: ~10-50ms per operation
- No network delays expected (local test environment)

**Decision**:
- Aim for 2-3 seconds per test (comfortably under 5s limit)
- Avoid unnecessary waits or polling loops
- Use explicit waits only when needed (file write confirmation)
- Profile slow tests in debug mode if they creep toward limits

**Rationale**: Faster tests encourage frequent running; slower tests (>5s) discourage local development iteration.

---

### 8. Test Isolation & Cleanup

**Unknown**: How should tests handle setup/teardown and avoid pollution?

**Research**:
- Spec requirement: "Tests must not depend on manual file system setup"
- "Each test should be independent and executable in isolation"
- Cleanup needed to avoid test pollution between runs
- Fixtures can be reset between test scenarios

**Decision**:
- Each scenario creates its own test data (no cross-scenario dependencies)
- Cleanup removes created configs immediately after assertions pass
- Use preconditions to reset fixture state if needed
- Test teardown logic captures results before cleanup

**Rationale**: Independent tests allow parallel execution and simplify debugging.

---

### 9. Assertion Strategy & Verifiable Outputs

**Unknown**: What assertions are most reliable for form-based E2E tests?

**Research**:
- JSON scenario format supports assertion types:
  - `state`: Check internal state key value
  - `visible`: Check element visibility
  - `textContains`: Check text content substring
  - `textEquals`: Check exact text match
- File system assertions: Check existence and content of created files

**Decision**:
- Prefer visibility assertions over existence (more reliable)
- Use textContains for messages that may include timestamps
- Verify file content by reading JSON and checking fields
- Avoid brittle positional assertions (like "2nd button in row")

**Rationale**: Content-based assertions survive minor UI layout changes.

---

### 10. Test Naming & Categorization

**Unknown**: How should test scenarios be named and tagged?

**Research**:
- Existing scenarios use pattern: `{feature}-{type}.json` (e.g., `filepath-config.smoke.json`)
- Tags include: `smoke` (fast, critical), `config`, `ui`, etc.
- Priority levels: P1, P2, P3 matching spec user story priorities
- Scenario IDs are unique within the project

**Decision**:
- Name format: `filepath-config-{user-story-name}.e2e.json`
- User story names: `validate-kebab-case`, `save-button-visibility`, `save-to-file`, `load-from-list`
- Tags: `e2e`, `filepath-config`, priority tags (`P1`, `P2`)
- Keep all 4 stories as P1 per spec (all are foundational)

**Rationale**: Consistent naming makes tests discoverable; tags enable filtering by priority.

---

## Summary of Decisions

| Question | Decision | Evidence |
|----------|----------|----------|
| Framework | Continue using JSON scenario + TypeScript runner harness | Established in project, documented, actively used |
| Fixture Setup | Pre-populated fixture + programmatic creation | Balances reliability with test isolation |
| Config Storage | `.logex/filepath-configs/{shortName}.json` | Matches spec assumption |
| Assertions | Content-based + file verification | More resilient than positional selectors |
| Test Naming | `filepath-config-{story-name}.e2e.json` | Follows project convention, discoverable |
| Performance Target | 2-3 seconds per test | Under spec limit, encourages iteration |
| Isolation | Each scenario independent, cleanup after run | Avoid cross-test pollution |
| Button Visibility | Test each condition explicitly | Catch state-management bugs |

---

## No Blockers

All research questions resolved with evidence from existing project patterns:
- ✅ Framework established and documented
- ✅ Fixture system proven with existing tests
- ✅ Config storage path specified in requirements
- ✅ Service infrastructure (FileAccess, ConfigStore) already handles persistence
- ✅ No new tools or dependencies required

**Proceed to Phase 1 Design** ✓
