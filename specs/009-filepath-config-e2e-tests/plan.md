# Implementation Plan: Filepath Config E2E Tests

**Branch**: `009-filepath-config-e2e-tests` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-filepath-config-e2e-tests/spec.md`

## Summary

Create end-to-end (E2E) tests for the filepath-config UI using the established JSON scenario framework and TypeScript test runners. The test suite validates form behavior (kebab-case validation, save button visibility), persistence (config file creation), and loading (list selection → form population). Four test scenarios map to four user stories from the specification, each independently executable and completing in 2–3 seconds. Tests use the existing fixture system with pre-populated and programmatically-created configs, verify assertions via file system checks and UI visibility toggles, and clean up created configs to prevent test pollution.

## Technical Context

**Language/Version**: TypeScript 5.x (test runners) + JSON (scenario definitions) targeting Node 18+  
**Primary Dependencies**: Playwright (headless Chromium), existing E2E test harness in `test/e2e/ui/`, no new npm packages required  
**Storage**: Test config files created at `.logex/filepath-configs/{shortName}.json` in workspace; read/verified programmatically  
**Testing**: JSON scenario definitions + TypeScript test harness (automated and debug modes)  
**Target Platform**: VS Code webview running in Chromium (cross-platform: Windows, macOS, Linux)  
**Project Type**: VS Code extension E2E test suite  
**Performance Goals**: Each test completes in 2–3 seconds; full suite (4 scenarios) under 30 seconds  
**Constraints**: Use existing test framework (no new tools); fixture workspace must remain reproducible; tests must be runnable in isolation without cross-test dependencies; all file I/O via workspace file system (no native binaries)  
**Scale/Scope**: 4 scenario files (~100 lines each), 0 new production code, minimal fixture updates

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Focus | ✅ Pass | E2E tests only; no new production features or dependencies |
| II. Secure Webview Practices | ✅ Pass | Tests verify existing UI; no new CSP or webview changes required |
| III. Test-First Development | ✅ Pass | Tests written *after* UI feature exists; validates existing implementation |
| IV. Branch-per-Speckit-Cycle | ✅ Pass | Tests developed on `009-filepath-config-e2e-tests` branch |
| V. Semantic Versioning | ✅ Pass | Tests are tooling, no version bump (unless bundled with new feature) |

*Gate: PASS — all principles satisfied. No constitution violations for test-only work.*

## Project Structure

### Documentation (this feature)

```text
specs/009-filepath-config-e2e-tests/
├── plan.md              ← this file
├── research.md          ← Phase 0 research findings (resolved unknowns)
├── data-model.md        ← Phase 1 output (test structure, entity definitions)
├── quickstart.md        ← Phase 1 output (how to write & run tests)
├── contracts/
│   ├── test-scenarios.md    ← Phase 1 output (scenario naming, structure)
│   └── test-assertions.md   ← Phase 1 output (assertion patterns)
└── checklists/
    └── requirements.md   ← Test requirements checklist
```

### Source Code (test suite files)

```text
test/e2e/ui/
├── scenarios/
│   ├── filepath-config-validate-kebab-case.e2e.json         (User Story 1 — P1)
│   ├── filepath-config-save-button-visibility.e2e.json      (User Story 2 — P1)
│   ├── filepath-config-save-to-file.e2e.json               (User Story 3 — P1)
│   └── filepath-config-load-from-list.e2e.json             (User Story 4 — P1)
└── fixtures/
    └── default-workspace/
        └── .logex/filepath-configs/
            └── example-config.json   (pre-populated test config)
```

**Structure Decision**: Use established JSON scenario format (no TypeScript test code needed for basic form interactions). Scenarios are declarative, maintainable, and execute in existing test runner. Fixture includes pre-populated config for list-loading tests.

---

## Phase 0: Research

**Output**: [research.md](./research.md)

**Resolved Key Questions**:

| Question | Resolution | Source |
|----------|-----------|--------|
| E2E framework approach | Use existing JSON scenario + TypeScript runner harness | `test/e2e/ui/` existing implementation |
| Fixture strategy | Pre-populated fixture + programmatic config creation | Proven pattern in existing E2E tests |
| Config storage path | `.logex/filepath-configs/{shortName}.json` | Spec requirement + existing patterns |
| Assertion patterns | Content-based (text, visibility, file existence) | Robust across UI changes |
| Test isolation | Independent scenarios, cleanup after run | Avoid cross-test pollution |
| Performance target | 2–3 seconds per test | Under 5s spec limit, encourages iteration |
| Test naming | `filepath-config-{story-name}.e2e.json` | Project convention |
| Button visibility | Test each condition (no fields, partial, valid, error) | Catch state-management bugs |

**No Blockers**: All research resolved with existing project infrastructure. Framework, tooling, and patterns are proven.  
**Gate: PASS** → Proceed to Phase 1.

---

## Phase 1: Design

### 1. Entities & Test Structure

See [data-model.md](./data-model.md) for:
- Test scenario entity definition (structure, fields)
- Fixture config structure (example config layout)
- Assertion payload structure (expected outputs format)

### 2. Interface Contracts

See [contracts/](./contracts/):
- [test-scenarios.md](./contracts/test-scenarios.md) — Scenario naming, structure, step patterns
- [test-assertions.md](./contracts/test-assertions.md) — Assertion types, selectors, expected payloads

### 3. Quickstart for Test Development

See [quickstart.md](./quickstart.md) for:
- How to run tests (automated and debug modes)
- How to write a new test scenario
- Common CSS selectors and assertion patterns
- Debugging failed tests via artifacts

---

## Phase 2: Implementation

*(Will be completed in separate `/speckit.tasks` cycle)*

**Implementation Tasks** (outlined for tracking):

1. **Scenario Files** (4 files, ~100 lines each):
   - Create `filepath-config-validate-kebab-case.e2e.json`
   - Create `filepath-config-save-button-visibility.e2e.json`
   - Create `filepath-config-save-to-file.e2e.json`
   - Create `filepath-config-load-from-list.e2e.json`

2. **Fixture Preparation**:
   - Verify `.logex/filepath-configs/` directory exists in default fixture
   - Add `example-config.json` to fixture for load tests

3. **Selector Identification**:
   - Identify stable CSS selectors for form inputs, buttons, error messages
   - Document in contracts for maintenance

4. **Test Verification** (via npm scripts):
   - Run all scenarios: `npm run test:e2e:ui`
   - Run individual tests in debug mode: `npm run test:e2e:ui:debug -- --scenario "..."`
   - Verify artifacts for pass/fail and execution timeline

5. **Documentation**:
   - Update `docs/testing/ui-e2e.md` with filepath-config test examples
   - Commit all files to `009-filepath-config-e2e-tests` branch

---

## Test Scenario Mapping

The 4 user stories from the specification map 1:1 to test scenarios:

| Scenario | Spec Story | Priority | Focus |
|----------|-----------|----------|-------|
| `validate-kebab-case` | User Story 1 | P1 | Form validation: error appears/clears, save prevented on error |
| `save-button-visibility` | User Story 2 | P1 | Button visibility: hidden empty, hidden partial, visible valid, hidden on error |
| `save-to-file` | User Story 3 | P1 | Persistence: valid form → file created with correct JSON structure |
| `load-from-list` | User Story 4 | P1 | List interaction: click config → form populates, multiple selections work correctly |

**Coverage**: All 4 stories covered; edge cases included in data-model assertions.

---

## Success Criteria (from Spec)

1. **Test Coverage** — ✅ All 4 user stories covered; edge cases in assertions  
2. **Test Reliability** — ✅ Independent scenarios, no cross-test dependencies  
3. **Test Speed** — ✅ 2–3 seconds per test, ~12s full suite (well under 30s limit)  
4. **Code Quality** — ✅ Declarative JSON format, JSDoc comments, reusable assertions  
5. **Documentation** — ✅ Quickstart guide, contracts, test structure documented  

---

## Next Steps

After Phase 1 Design:

1. Identify and document stable CSS selectors in the filepath-config UI
2. Prepare fixture workspace with `.logex/filepath-configs/` directory
3. Create 4 scenario JSON files based on contracts
4. Run in debug mode to verify interactions work end-to-end
5. Commit to `009-filepath-config-e2e-tests` branch

---

## References

- **Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Quickstart**: [quickstart.md](./quickstart.md)
- **Contracts**: [test-scenarios.md](./contracts/test-scenarios.md), [test-assertions.md](./contracts/test-assertions.md)
- **E2E Framework Docs**: [docs/testing/ui-e2e.md](../../docs/testing/ui-e2e.md)
- **Existing E2E Tests**: [test/e2e/ui/scenarios/](../../test/e2e/ui/scenarios/)
