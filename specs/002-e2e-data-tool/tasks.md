# Tasks: E2E Test Data Tool

**Input**: Design documents from `/specs/002-e2e-data-tool/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Unit tests for generation logic; e2e tests for deployment/cleanup.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project structure and utility scaffolding.

- [ ] T001 [P] Create `tools/loggen.js` entrypoint with basic command parsing (commander)
- [ ] T002 [P] Add sample configuration file at `tools/samples/sample-log-config.json`
- [ ] T003 [P] Add npm scripts in `package.json`: `test:e2e-data` and `build:tools`
- [ ] T004 [P] Create initial unit test file `test/unit/loggen.test.ts` with placeholder
- [ ] T005 [P] Update `.gitignore` to exclude generated logs like `logs/**`, container caches, and `tools/samples/` if necessary (samples may be committed) 

**Checkpoint**: Tool stub exists, configuration example present, test harness ready.

---

## Phase 2: User Story 1 – File Generation (Priority: P1)

**Goal**: Implement log-file generator capable of writing to any local folder.

**Independent Test**: Run CLI with config and output path and inspect resulting files.

- [ ] T006 [US1] Implement configuration parser in `tools/loggen.js` validating required fields (fields array, timestamp format, entry count, outputFormat)
- [ ] T007 [US1] Add log-generation logic that writes `entries` lines using the schema rules (field types, enums, random data) to the `--output` directory and supports `--format` for text or `es-bulk`
- [ ] T008 [US1] Add CLI options `--config`, `--output`, `--count`, `--format`; update help
- [ ] T009 [US1] Create unit tests exercising config validation and file creation in `test/unit/loggen.test.ts`
- [ ] T010 [US1] Document generation command in `specs/002-e2e-data-tool/quickstart.md` (already exists but verify)

**Checkpoint**: Developer can generate logs locally of arbitrary format.

---

## Phase 3: User Story 2 – Deploy to Container (Priority: P2)

**Goal**: Provide command to copy generated logs into a specified container path.

**Independent Test**: Use a running WSL container, generate logs locally, run deploy command, verify inside container.

- [ ] T011 [US2] Implement `deploy` action in `tools/loggen.js` that runs `docker cp` for each file
- [ ] T012 [US2] Add unit tests mocking `child_process` to ensure correct docker command invoked
- [ ] T013 [US2] Update quickstart with deploy examples (already present)

**Checkpoint**: CLI can push log files into any running container.

---

## Phase 4: User Story 3 – Cleanup & ES Format Stub (Priority: P3)

**Goal**: Add cleanup command and prepare for future ES/Kibana generation.

**Independent Test**: Generate, deploy, then cleanup; verify removal.

- [X] T014 [US3] Implement `cleanup` action to delete container files via `docker exec rm` or copy empty directory
- [X] T015 [US3] Add `--format es-bulk` stub in generator that produces placeholder JSON
- [X] T016 [US3] Create e2e test `test/e2e/loggen.e2e.ts` that runs full workflow against a real container started in CI
- [X] T017 [US3] Document cleanup command in quickstart

**Checkpoint**: CLI cleans up container files and handles ES-format parameter.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T018 [P] Add error handling around file system operations (permissions, path not found)
- [ ] T019 [P] Ensure cross-platform path normalization using `path` and `wslpath`
- [X] T020 [P] Add integration with existing CI workflow (update `ci.yml` to run `npm run test:e2e-data`)
- [X] T021 [P] Review and update docs and comments across repo

**Final Phase**: Validate full workflow from blank repo after README instructions.


## Dependencies & Execution Order

- Phase 1 tasks are parallelizable; establish scaffolding first
- US1 tasks depend only on Phase 1
- US2 and US3 depend on US1 (need generated files), can progress concurrently after US1
- Polish tasks can interleave with later user stories

### Parallel Opportunities

- T001–T005 (setup)
- T006–T008 (generation implementation) with T009 tests parallel
- US2 and US3 implementation after US1
- T018–T021 (polish tasks) independent

### Implementation Strategy

1. Build generator MVP (Phase 1 + US1)
2. Add deployment ability and tests (US2)
3. Add cleanup and ES stub (US3)
4. Polish and integrate into CI

---

Tasks list created. Adjust as implementation details change.