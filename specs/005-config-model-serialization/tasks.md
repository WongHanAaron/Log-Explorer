# Tasks: Config model serialization

**Input**: Design documents from `/specs/005-config-model-serialization/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the repository for decorator-based serialization and
validation.

- [ ] T001 [P] Add `experimentalDecorators` and `emitDecoratorMetadata` to `tsconfig.json`
- [ ] T002 [P] Install runtime dependencies `class-transformer`, `class-validator` and `reflect-metadata` via `npm` (update package.json)
- [ ] T003 [P] Import `reflect-metadata` in `src/extension.ts` (or central entry point)
- [ ] T004 [P] Update README or docs to mention new dependencies and decorator requirement

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core serialization/validation infrastructure that
all stories rely on.

- [ ] T005 Create new file `src/domain/serializable.ts` defining the `IsSerializable` base class with `toJson` and `fromJson` implementations
- [ ] T006 [P] Configure global validator options (e.g. `forbidNonWhitelisted`, `whitelist`) in a shared utils file or initializer
- [ ] T007 [P] Add helper functions/types for discriminated unions (used by FileLogLineConfig later)
- [ ] T008 Update `ConfigStore` (`src/services/config-store.ts`) to call `fromJson` on models when reading and `toJson` when writing
- [ ] T009 Add unit test utilities for serializable models (e.g. a helper that asserts round-trip) in `test/unit/domain/utils.ts`

**Checkpoint**: Once these foundational files exist and compile, user story
work can begin.

---

## Phase 3: User Story 1 - Serialize/deserialize config model (Priority: P1) 🎯 MVP

**Goal**: Ensure one existing configuration class can be round‑tripped and
validated using the new system.

**Independent Test**: A unit test loads a valid JSON string into the class via
`fromJson`, asserts instance type and property values, then calls `toJson` and
verifies round-trip; invalid JSON leads to validation error.

### Tests for User Story 1

- [ ] T010 [P] [US1] Write unit tests for `FilepathConfig` conversion under
  `test/unit/domain/filepath-config.test.ts`
- [ ] T011 [P] [US1] Add negative tests to the same file covering missing field,
  wrong types, and extra properties

### Implementation for User Story 1

- [ ] T012 [P] [US1] Refactor `src/domain/filepath-config.ts` into a class
  extending `IsSerializable` with appropriate decorators on each property
- [ ] T013 [US1] Remove or deprecate the old `isFilepathConfig` type guard
  (keep temporarily for incremental migration)
- [ ] T014 [US1] Ensure `ConfigStore` reads/writes filepath configs using the
  new class (hook from T008)
- [ ] T015 [US1] Update any webview message types that referenced the interface
  to use the class type instead (e.g. `src/webview/messages.ts`)
- [ ] T016 [US1] Manual verification: load an existing `.logex/filepath-configs`
  file in the running extension to confirm behaviour unchanged

**Checkpoint**: FilepathConfig is fully serializable/validated and tests pass.

---

## Phase 4: User Story 2 - Base class enforcement (Priority: P2)

**Goal**: Demonstrate that a newly defined config class gains serialization
behaviour by simply extending `IsSerializable` and decorating properties.

**Independent Test**: Create a trivial subclass in tests and assert its
`ToJson`/`FromJson` work without extra code.

### Tests for User Story 2

- [ ] T017 [P] [US2] Add a new unit test `test/unit/domain/serializable-subclass.test.ts` that defines a temporary class extending `IsSerializable`, exercises round-trip, and ensures validation occurs

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create a sample config class `src/domain/sample-config.ts`
  (used only by tests or as a template for developers)
- [ ] T019 [US2] Document in `docs/` or `specs/005-config-model-serialization/quickstart.md` how to add new config classes

**Checkpoint**: Developers can add a config type with minimal boilerplate and
see it function immediately.

---

## Phase 5: User Story 3 - Existing config migration (Priority: P3)

**Goal**: Convert all remaining configuration models (e.g. file‑log line
hierarchy, session templates) to the new class-based system without changing
external behaviour.

**Independent Test**: After migration, loading any legacy config file should
produce the same runtime state; existing integration tests still pass.

### Tests for User Story 3

- [ ] T020 [P] [US3] Add unit tests for each migrated model (`filelog-config`,
  etc.) verifying valid/invalid JSON and round-trip
- [ ] T021 [US3] Add a regression test that loads sample config files from
  `specs/` or `test/samples` and ensures they parse (could live in
  `test/unit/domain/legacy-configs.test.ts`)

### Implementation for User Story 3

- [ ] T022 [US3] Refactor `src/domain/filelog-config.ts` into classes for each
  variant plus related field/mapping classes with decorators and validation
- [ ] T023 [US3] Update any other config domain file (session templates, etc.)
  to use `IsSerializable`
- [ ] T024 [US3] Remove old manual validator functions after verification
- [ ] T025 [US3] Ensure `ConfigStore` handles the union discriminators correctly
  (use the helper from T007)
- [ ] T026 [US3] Manually test loading real workspace configs and exercising
  functionality such as log parsing to confirm no behaviour change

**Checkpoint**: All config types use the base class and are covered by tests.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and documentation after core work is done.

- [ ] T027 [P] Update `README.md` and developer docs with instructions on the
  new serialization/validation system
- [ ] T028 [P] Remove any leftover type guard helpers or deprecated code
- [ ] T029 [P] Refactor `ConfigStore` tests to use class constructors directly
- [ ] T030 [P] Run eslint/format and ensure no warnings from decorator usage
- [ ] T031 Add a quickstart snippet to `specs/005-config-model-serialization/quickstart.md` with code example (already in quickstart but verify)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** must finish before any foundational or story work.
- **Foundational (Phase 2)** must complete before user story implementation.
- **User Stories** (Phases 3–5) each depend on Phase 2 but can proceed in
  parallel thereafter.
- **Polish** tasks occur after all stories are complete.

### User Story Dependencies

- **US1 (P1)** is MVP and does not depend on other stories; must follow
  Phase 2.
- **US2 (P2)** can run concurrently with US1 once Phase 2 is done.
- **US3 (P3)** can start after Phase 2; it may depend on helper code from
  earlier stories (e.g. union discriminators) but remains independently
  testable.

### Within Each Story

- Tests are written first and should fail (T010–T011 before T012, etc.).
- Models before services/ConfigStore changes.
- Migration tasks may have incremental verification steps.

### Parallel Opportunities

- Setup tasks (T001–T004) are parallelizable ([P]).
- Foundational helpers (T006–T009) can run concurrently.
- Test writing tasks across stories are parallelizable.
- Model creation for US1 and US2 (T012, T018) can be done simultaneously.

This task list gives a clear, story‑focused roadmap for implementing the new
serialization and validation framework while allowing each story to be built
and tested independently.  Once the foundational base class is in place, the
remaining work is mostly mechanical migration and writing accompanying tests.