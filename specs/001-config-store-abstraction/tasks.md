# Tasks: Config Store Abstraction

**Input**: design documents from `/specs/001-config-store-abstraction/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅ (existing domain models), contracts/ ✅  

**Tests**: the specification explicitly requires test coverage for every acceptance scenario; tasks include both unit and integration tests.

**Organization**: tasks are grouped by user story (US1–US4) plus setup/foundational phases. This ensures each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: can run in parallel with other tasks (different files or independent work)
- **[Story]**: User story label; setup/foundational tasks have no story label
- All descriptions include explicit file paths

---

## Phase 1: Setup (Initial scaffolding)

**Purpose**: add core enumeration and directory-mapping helper used by the abstraction. These are simple edits to a single file and can be done in parallel.

- [x] T001 [P] Add `ConfigCategory` enum to `src/services/config-store.ts` and export it, with values `Filepath = 'filepath'` and `Filelog = 'filelog`.
- [x] T002 [P] Implement helper `getConfigDir(workspaceRoot: vscode.Uri, category: ConfigCategory): vscode.Uri` in `src/services/config-store.ts` that returns `vscode.Uri.joinPath(workspaceRoot, '.logex', category === ConfigCategory.Filepath ? 'filepath-configs' : 'filelog-configs')`.

---

## Phase 2: Foundational (Core config-store API)

**Purpose**: build the abstraction layer and subscription mechanism. Other code and tests will depend on these exports.

**⚠️ CRITICAL**: no user-story work can start until these methods exist.

- [x] T003 [P] In `src/services/config-store.ts`, add type `ConfigAddedCallback = (shortName: string) => void` and private maps `const subscribers: Map<ConfigCategory, Set<ConfigAddedCallback>> = new Map();`.
- [x] T004 [P] Implement `subscribeConfigAdded(category: ConfigCategory, cb: ConfigAddedCallback): vscode.Disposable` which adds `cb` to the appropriate set and returns a `Disposable` whose `dispose()` removes the callback (idempotent).
- [x] T005 [P] Add internal helper `notifyConfigAdded(category: ConfigCategory, shortName: string): void` that iterates the set and invokes each callback.
- [x] T006 [P] Modify existing `writeConfig` in `src/services/config-store.ts` to call `notifyConfigAdded` after successfully writing the file. Ensure `writeConfig` still accepts either `FilepathConfig` or `FileLogLineConfig` and continues to serialise and write JSON.
- [x] T006a [P] Introduce `FsProvider` type alias and update `ConfigStore` to accept an injected filesystem provider (defaulting to `vscode.workspace.fs`).  Refactor all I/O helpers to be private instance methods using `this.fs` instead of `vscode.workspace.fs` so that the behaviour can be faked in unit tests.
- [x] T007 [P] Add public API methods:
  - `async function listConfigNames(workspaceRoot: vscode.Uri, category: ConfigCategory): Promise<string[]>` that calls `listConfigs(getConfigDir(...))` and returns the result.
  - `async function getConfig(workspaceRoot: vscode.Uri, category: ConfigCategory, shortName: string): Promise<FilepathConfig | FileLogLineConfig>` which builds the appropriate dir, invokes `readFilepathConfig` or `readFileLogLineConfig` depending on category, and throws an `Error` with message `Config not found: ${category}/${shortName}` if the file doesn't exist (catch STAT errors) or rethrows parse/validation errors unchanged.
  - Export these new functions from the module.

---

## Phase 3: User Story 1 — List Available Config Names (Priority: P1)

**Goal**: callers can obtain the set of saved config short names for each category.

**Independent Test**: write some configs into the .logex folder via the low‑level API or by hand, call `listConfigNames` and assert the returned array matches.

- [x] T008 [US1] Add unit tests in `test/unit/services/config-store.test.ts` verifying `listConfigNames` returns correct names for both `ConfigCategory.Filepath` and `ConfigCategory.Filelog`. Include tests for empty directories and mixed non-json files.
- [x] T008a [US?] Add unit tests exercising the filesystem abstraction by instantiating `ConfigStore` with a fake `FsProvider` and verifying that `writeConfig`, `listConfigNames`, `getConfig`, `deleteConfig`, `configExists`, and subscriptions work against the in-memory provider.

---

## Phase 4: User Story 2 — Retrieve Config Data by Name (Priority: P2)

**Goal**: callers can fetch the full config object or receive a clear error.

**Independent Test**: write a valid config, fetch it successfully; attempt to fetch missing or malformed names and assert appropriate exceptions.

- [x] T009 [US2] Add unit tests in `test/unit/services/config-store.test.ts` verifying `getConfig` returns the correct object for both categories and throws with message `Config not found: ...` when the file is absent.
- [x] T010 [US2] Add unit tests verifying `getConfig` propagates parse/validation errors when the file exists but contains invalid JSON/schema.

---

## Phase 5: User Story 3 — Subscribe to Config-Added Events (Priority: P3)

**Goal**: consumers can register callbacks that fire when a new config is added.

**Independent Test**: subscribe, call `writeConfig`, and confirm the callback runs with the new name.

- [x] T011 [US3] Add unit tests in `test/unit/services/config-store.test.ts` for `subscribeConfigAdded` verifying that a callback is invoked exactly once when `writeConfig` writes a file to either category, and that multiple subscribers all receive notifications.

---

## Phase 6: User Story 4 — Unsubscribe from Config-Added Events (Priority: P4)

**Goal**: callbacks can be cancelled to avoid leaks.

**Independent Test**: subscribe, dispose the returned `Disposable`, then write a config and assert the callback is not invoked.

- [x] T012 [US4] Add unit tests in `test/unit/services/config-store.test.ts` verifying unsubscription works (idempotent, only active callbacks fired).

---

## Phase 7: Integration Tests

**Purpose**: ensure the new API behaves correctly inside the extension host environment (workspace folder operations etc.). These tests go in `test/suite/extension.test.ts` alongside the existing `config store I/O` suite.

- [x] T013 [P] [US1/US3] Extend `suite('config store I/O')` in `test/suite/extension.test.ts` with:
  - a test that uses `subscribeConfigAdded` to register a listener, then calls `writeConfig` pointing at `root/.logex/filepath-configs` and asserts the listener is called with the new name.
  - a similar test for `ConfigCategory.Filelog`.
  - a test that calls `listConfigNames` against `root/.logex/filepath-configs` after writing multiple configs and asserts the returned array contains all names (this overlaps with unit tests but verifies workspace fs semantics).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T014 [P] Run `npm run build` and confirm no TypeScript errors; ensure `src/services/config-store.ts` modifications compile.
- [ ] T015 Update README or developer documentation (`docs/developer-references/` if relevant) to mention the new API (optional but helpful).
- [x] T016 [P] Manual smoke‑test: open a temporary workspace, invoke new API from the console or via a quick command to validate behaviour end‑to‑end.
- [x] T017 Commit changes on feature branch and push; prepare for review/merge once all tests pass.

---

## Dependencies & Execution Order

- **Phase 1 tasks** (T001–T002) are parallel and must finish before Phase 2.
- **Phase 2 tasks** (T003–T007) are all independent and can be implemented in any order, but the public APIs (T007) rely on helpers from T001–T002 and the notify mechanism from T005–T006.
- **Unit test tasks** (T008–T012) depend on the corresponding API methods being available; they may be written incrementally as the code is added.
- **Integration tests** (T013) depend on T007 having been implemented and the workspace helpers working.
- **Polish tasks** may run at any time after the code compiles; T014 is a simple verification step.
- **T017** occurs after all other tasks are complete.

### Story Dependencies

- US1 (list names) is the earliest and tests/listConfigNames may be created before other stories.
- US2 (getConfig) builds on the same module, so its tasks start after T007.
- US3 (subscribe) requires writeConfig to notify, so it depends on T006.
- US4 (unsubscribe) depends on subscribe logic from US3.

### Parallel Examples

- Tasks T001 and T002 can run together.
- In Phase 2, the subscription machinery (T003–T005) can be implemented while the directory helper (T002) is being added.
- Unit test tasks T008–T012 can be written in parallel with code changes as each method becomes available.
- Integration tests (T013) can be written once the corresponding APIs exist but need not block each other.

## Implementation Strategy

**MVP**: implement Phases 1 and 2 plus T008 (listConfigNames unit test). This delivers the ability to list available configs (P1). Verify with a unit test and a quick manual check.  

**Incremental delivery**: add `getConfig` (P2) next, along with its tests; then build the subscription mechanism (P3/P4) and tests; finally write integration tests and polish.  

**Testing approach**: start by authoring unit tests that fail initially, then implement minimal code to satisfy them. Focus on keeping each new method self‑contained so tests run quickly. Use the existing `config-store` tests as a template.

The tasks document above translates the specification's acceptance criteria into actionable steps with file paths and dependencies, making it immediately executable by an LLM or developer. The next phase is to implement the code.  

---

**Tasks file created at** `specs/001-config-store-abstraction/tasks.md`.  
**Total tasks**: 17 (including polish).  
**Tasks per story**: US1=1, US2=2, US3=1, US4=1, setup/foundational=7, integration=1, polish=3.  

> The plan ensures independent execution of each user story and identifies parallelization opportunities. The MVP is simply listing config names (US1).  

End of plan.  

Next step: implement code according to tasks.  

(Ready to proceed with implementation.)

