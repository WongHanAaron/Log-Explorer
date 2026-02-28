# Tasks: Docker Kibana Integration for Tests

**Input**: Design documents from `/specs/001-kibana-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Integration test required by User Story 3; testing tasks are included in US3

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish repository artifacts needed for everything else.

- [x] T001 [P] Create helper script stub at `scripts/kibana.sh` with shebang, help text, and basic command dispatch
- [x] T002 [P] Add `kibana-versions.txt` in repository root containing example versions (`7.16.3` and `8.4.0`) and support for `#` comments
- [x] T003 [P] Add `test:kibana` npm script to `package.json` that will later invoke the integration test harness
- [x] T004 [P] Commit new file `kibana-versions.txt` to git and update `.gitignore` if necessary (though normally tracked)

**Checkpoint**: Script placeholder exists, version list file in place, npm script declared

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core script machinery that all stories depend on.

- [x] T005 Implement Docker availability check in `scripts/kibana.sh` (run `docker version`/`docker ps` and exit nonzero with clear error if unavailable)
- [x] T006 Add command-line parsing logic to `scripts/kibana.sh` handling subcommands `start`, `stop`, `status`, and global flags `--version` and `--port`
- [x] T007 Implement port selection logic in `scripts/kibana.sh`: default to 5601, if in use run container with `-P` then inspect mapping; allow `--port` override

**Checkpoint**: Script can detect Docker, parse basic arguments, and choose a host port

---

## Phase 3: User Story 1 — Start/Stop/Status Commands (Priority: P1)

**Goal**: Developers can launch and control a Kibana container and obtain its port.

**Independent Test**: Run `./scripts/kibana.sh start`, verify JSON output, curl `/api/status`, then stop container with `./scripts/kibana.sh stop`.

- [x] T008 [US1] Implement `start` command in `scripts/kibana.sh` to run appropriate `docker run` with version/port, record container ID, and print JSON (`host`,`port`,`version`,`containerId`)
- [x] T009 [US1] Implement `stop` command in `scripts/kibana.sh` to stop and remove container (uses stored container ID or `--container` flag)
- [x] T010 [US1] Implement `status` command in `scripts/kibana.sh` to query running container and output JSON
- [x] T011 [US1] Update `specs/001-kibana-integration/quickstart.md` with usage examples for `start`, `status`, and `stop`

**Checkpoint**: A Kibana container can be started, queried, and stopped using the script

---

## Phase 4: User Story 2 — Multi-Version Support (Priority: P2)

**Goal**: Script accepts explicit version or defaults from configuration, tests iterate over versions.

**Independent Test**: Start Kibana with `--version 7.16.3` and with `--version 8.4.0` and verify images match.

- [x] T012 [US2] Enhance `scripts/kibana.sh` to read default version from `kibana-versions.txt` (first non-comment line) or `KIBANA_VERSION` env var; add `--version` flag override
- [x] T013 [US2] Modify `start` command to pull and run `docker.elastic.co/kibana:<version>` based on provided/derived version
- [x] T014 [US2] Update npm script `test:kibana` (and/or add Node helper) to loop over the configured version list when running the integration test

**Checkpoint**: The helper script and test harness support selecting and iterating over multiple Kibana versions

---

## Phase 5: User Story 3 — Automated Integration Test (Priority: P3)

**Goal**: Repo contains a CI‑friendly test that launches Kibana, exercises API, and tears down.

**Independent Test**: `npm run test:kibana` executes locally and exits 0 if all versions pass connectivity.

- [x] T015 [US3] Create integration test file `test/suite/kibana.integration.ts` that reads `kibana-versions.txt` (or `KIBANA_VERSIONS`), invokes `scripts/kibana.sh start`, performs HTTP GET `/api/status` on returned port, asserts status 200, then stops the container
- [x] T016 [US3] Add any necessary Node helper (e.g. `scripts/run-kibana-tests.js`) referenced by npm script to spawn the test file under Mocha
- [x] T017 [US3] Ensure `npm run test:kibana` exists in `package.json` and triggers the integration test; document the command in quickstart/README
- [x] T018 [US3] Add CI configuration (e.g. update `.github/workflows/ci.yml`) to call `npm run test:kibana` as part of the build (optional but recommended)

**Checkpoint**: Running the npm command exercises all configured Kibana versions and reports success/failure

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple stories and documentation.

- [x] T019 [P] Improve error messages in `scripts/kibana.sh` for Docker absence, invalid version, or port failures
- [x] T020 [P] Update `quickstart.md` and project `README.md` with final instructions and environment variable notes
- [x] T021 [P] Add logic in `scripts/kibana.sh` to handle port collisions by automatically reporting the chosen host port when `-P` is used
- [x] T022 [P] Validate cross-platform script functionality on Windows (Git Bash/PowerShell), macOS, and Linux; document any limitations
- [x] T023 [P] Provide `docker-compose.yml` for WSL users and document its usage in quickstart/README
- [x] T024 [P] Add `scripts/compose.sh` wrapper and npm scripts (`compose:up`, `compose:down`, `compose:ps`) for easy stack control

**Final Phase**: After all phases complete, perform an end‑to‑end validation from a clean clone following quickstart steps and ensure CI passes


## Dependencies & Execution Order

- **Setup (Phase 1)** tasks can run immediately and in parallel (T001–T004)
- **Foundational (Phase 2)** tasks must finish before any user story implementation; they build core script features (T005–T007)
- **User Story 1** tasks (T008–T011) depend on foundational work
- **User Story 2** tasks (T012–T014) can run after foundational; US1 and US2 are independent and may run in parallel once foundation is done
- **User Story 3** tasks (T015–T018) depend on foundational and US2 to exercise version iteration but could be started concurrently with US1
- **Polish** tasks (T019–T022) may overlap with later user stories and run in parallel where possible

### Parallel Opportunities

- T001–T004 (setup) are all parallelizable
- Within a story, tasks editing different files can be parallel (e.g., T008 vs T009 vs T010)
- US1 and US2 streams are independent once Phase 2 is complete
- Polish tasks T019–T022 are largely independent

### Implementation Strategy

1. **MVP**: Phase 1 + Phase 2 + US1; ensure a single-container start/stop/status works
2. **Next**: Add multi-version support (US2) and update npm script
3. **Then**: Write and complete automated integration test (US3)
4. **Finally**: Polish errors, docs, CI integration, cross-platform checks

**Testable checkpoints** at the end of each phase/story ensure progress is measurable and incremental.


---

Tasks file ready for execution. Adjust or extend as implementation details emerge.
