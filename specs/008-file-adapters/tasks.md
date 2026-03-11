# Tasks: File Access Adapters

**Input**: Design and specification documents from `/specs/008-file-adapters/`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create `services/fileaccess` directory and add placeholder files
- [x] T002 Create `domain/config/fileaccess` directory and add `index.ts` re-export
- [x] T003 Search for existing domain configuration objects and move them into `domain/config`
- [x] T004 Create test directory `test/unit/services/fileaccess`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 [P] Add `domain/config/fileaccess/types.ts` with `FileSourceConfig` union and `ListDirOptions`
- [x] T006 [P] Implement abstract class `FileAccessAdapter` in `services/fileaccess/FileAccessAdapter.ts`
- [x] T007 [P] Add shared utility file `services/fileaccess/utils.ts` (e.g. path normalization, recursion helper signature)
- [x] T008 [P] Write unit tests for `FileAccessAdapter` base behaviors in `test/unit/services/fileaccess/FileAccessAdapter.test.ts`

---

## Phase 3: User Story 1 - Use adapter to read a local file (Priority: P1) 🎯 MVP

**Goal**: Enable reading local filesystem files via new adapter API

**Independent Test**: Instantiate `LocalFileAdapter` and verify `readFile` returns expected buffer or error.

### Tests for User Story 1

- [x] T009 [P] [US1] Add unit tests for `LocalFileAdapter` readFile success and not-found error in `test/unit/services/fileaccess/LocalFileAdapter.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Implement `LocalFileAdapter` in `services/fileaccess/LocalFileAdapter.ts` using `fs.promises`
- [x] T011 [P] [US1] Implement optional `stat` and `delete` methods in `LocalFileAdapter`

**Checkpoint**: Local adapter with `readFile` works and tests pass

---

## Phase 4: User Story 2 - Enumerate remote directory (Priority: P2)

**Goal**: Provide recursive and depth-limited listing for SFTP/SMB sources

**Independent Test**: Use stubbed clients to call `listDir` with various options and assert results

### Tests for User Story 2

- [x] T012 [P] [US2] Add unit tests for recursion helper and `listDir` behaviors (maxDepth, recursive) in `test/unit/services/fileaccess/*.test.ts`

### Implementation for User Story 2

- [x] T013 [US2] Implement recursion helper in `services/fileaccess/utils.ts` and/or base class
- [x] T014 [US2] Implement `SftpFileAdapter` in `services/fileaccess/SftpFileAdapter.ts` using `ssh2-sftp-client`
- [x] T015 [US2] Implement `SmbFileAdapter` in `services/fileaccess/SmbFileAdapter.ts` using `smb2`
- [x] T016 [US2] Add optional `stat` and `delete` to both remote adapters

**Checkpoint**: Remote adapters list directories correctly and pass tests

---

## Phase 5: User Story 3 - Add new backend via factory (Priority: P3)

**Goal**: Allow future adapters to be registered and instantiated via configuration

**Independent Test**: Factory throws on unknown type and returns correct instance for known configs

### Tests for User Story 3

- [x] T017 [P] [US3] Add unit tests for `createFileAdapter` in `test/unit/services/fileaccess/factory.test.ts`

### Implementation for User Story 3

- [x] T018 [US3] Implement `createFileAdapter` in `services/fileaccess/factory.ts` with switch on `config.type`
- [x] T019 [P] [US3] Add example or dummy adapter in tests demonstrating extension path (add new config type and class)

**Checkpoint**: Factory behaves as specified and tests cover extension case

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T020 [P] Update documentation (quickstart.md, comments) to reference new folder locations and design notes
- [x] T021 Code cleanup, linting, and TypeScript fixes across `services/fileaccess` and `domain/config/fileaccess`
- [x] T022 [P] Add additional unit tests covering error cases, auth failures, invalid configs
- [x] T023 [P] Verify `DESIGN.md` is present in spec directory and update any README links if needed
- [x] T024 [P] Run quickstart example manually and ensure it works (update as needed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; establishes directories and baseline
- **Foundational (Phase 2)**: Depends on Setup completion and provides base types and classes used by all adapters
- **User Stories (Phase 3+)**: All depend on Foundational phase; each story can proceed independently once foundational tasks complete
- **Polish (Final Phase)**: Depends on all user story work being finished

### User Story Dependencies

- **US1**: Can begin after Phase 2; no dependency on other stories
- **US2**: Also after Phase 2; may use utilities from US1 but should be testable alone
- **US3**: After Phase 2; independent of US1/US2

### Parallel Opportunities

- Setup tasks T001–T004 are independent and can run in parallel
- Foundational tasks T005–T008 are marked [P] and may be developed concurrently
- Tests and code for each user story are parallelizable across files
- Different user stories (US1, US2, US3) can be implemented by separate developers simultaneously
- Polish tasks T020–T024 are mostly independent; several marked [P]

### Parallel Example: User Story 1

```bash
# Developer A writes tests (T009)
# Developer B implements LocalFileAdapter (T010) concurrently
npm run test -- test/unit/services/fileaccess/LocalFileAdapter.test.ts
```

This structure ensures each story delivers a complete slice of functionality that can be independently verified and merged.
