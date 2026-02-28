# Tasks: Local VSIX Packaging & Install Scripts

**Input**: Design documents from `specs/002-local-vsix-install/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/npm-scripts.md ✅ quickstart.md ✅

**Tests**: No automated test tasks — build-tooling scripts cannot be integration-tested without
a live VSCode instance. Manual acceptance via quickstart.md checklist is the documented
mitigation (see plan.md Constitution Check, Principle III justification).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and
verified independently.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to ([US1], [US2], [US3])
- Exact file paths are in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Git/packaging hygiene — ensure the `releases/` folder is excluded from version
control and from the packaged extension before any scripts produce output there.

- [x] T001 Add `releases/` entry to `.gitignore` (after existing `*.vsix` line)
- [x] T002 [P] Add `releases/**` and `scripts/**` exclusions to `.vscodeignore`

**Checkpoint**: `.gitignore` and `.vscodeignore` are updated — `releases/` output will never
be committed or bundled into the extension.

---

## Phase 2: User Story 1 — Package the Extension Locally (Priority: P1) 🎯 MVP

**Goal**: Running `npm run package:local` compiles the extension and produces
`releases/logexplorer-{version}.vsix` with no marketplace credentials required.

**Independent Test**: From a clean checkout (after `npm install`), run
`npm run package:local` and verify that `releases/logexplorer-0.1.0.vsix` (or current
version) exists and is a valid file.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create `scripts/package-local.mjs` — Node.js ESM script that calls `fs.mkdirSync('releases', {recursive:true})` then spawns `vsce package --out releases/ --allow-missing-repository`, exits non-zero with a clear message on failure
- [x] T004 [P] [US1] Create `scripts/package-local.ps1` — PowerShell 7+ script that mirrors `package-local.mjs` behaviour (make/releases dir & run vsce), suitable for `pwsh` invocation
- [x] T005 [US1] Add `"package:local": "node scripts/package-local.mjs"` npm script to `package.json` (in the `scripts` block, after the existing `package` entry)

**Checkpoint**: `npm run package:local` succeeds; `releases/logexplorer-{version}.vsix` is
produced without credentials or internet access.

---

## Phase 3: User Story 2 — Install into Local VSCode (Priority: P2)

**Goal**: Running `npm run install:local` finds the built `.vsix` in `releases/` and
installs it into the active VSCode instance via the `code` CLI with no UI interaction.

**Independent Test**: After running US1, run `npm run install:local` and confirm the
extension version in the VSCode Extensions panel matches `package.json#version`.

### Implementation for User Story 2

- [x] T006 [P] [US2] Create `scripts/install-local.mjs` — Node.js ESM script that uses `fs.readdirSync('releases').find(f => f.endsWith('.vsix'))` to locate the package, then spawns `code --install-extension releases/<file> --force`; exits code 1 with message `"No .vsix found in releases/. Run 'npm run package:local' first."` when no file is found
- [x] T007 [P] [US2] Create `scripts/install-local.ps1` — PowerShell 7+ script that mirrors `install-local.mjs` behaviour (find .vsix and invoke `code`), suitable for `pwsh` invocation
- [x] T008 [US2] Add `"install:local": "node scripts/install-local.mjs"` npm script to `package.json` (after the `package:local` entry)

**Checkpoint**: `npm run install:local` installs the extension with zero manual UI steps;
exits with descriptive error when `releases/` contains no `.vsix`.

---

## Phase 4: User Story 3 — One-Step Build, Package & Install (Priority: P3)

**Goal**: Running `npm run release:local` chains `package:local` and `install:local` in
sequence, stopping on the first failure.

**Independent Test**: From a state with no `dist/` or `releases/` output, run
`npm run release:local` and verify source is compiled, `.vsix` is produced, and the
extension is installed — all from a single terminal command.

### Implementation for User Story 3

- [x] T009 [US3] Add `"release:local": "npm run package:local && npm run install:local"` npm script to `package.json` (after the `install:local` entry)

**Checkpoint**: `npm run release:local` succeeds end-to-end from a clean state; if
`package:local` fails the install step is NOT invoked.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation update and manual acceptance validation.

- [x] T010 [P] Update `README.md` — add a **Local Install** section under the existing
  Development table with the three new scripts (`package:local`, `install:local`,
  `release:local`) and a note that `releases/` is gitignored
- [x] T011 Run `specs/002-local-vsix-install/quickstart.md` acceptance checklist manually:
  verify all 9 checkbox items pass end-to-end on the current machine

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 completion (`.vscodeignore` must exclude `releases/`)
- **Phase 3 (US2)**: Depends on Phase 1 completion; independent of Phase 2
- **Phase 4 (US3)**: Depends on Phase 2 AND Phase 3 (chains both scripts)
- **Phase 5 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 1 — no dependency on US1 or US3
- **US3 (P3)**: Depends on US1 AND US2 (the `&&` chain requires both scripts to exist)

### Within Each User Story

- US1: script files (T003 `package-local.mjs` and T004 `package-local.ps1`) before npm entry T005
- US2: script files (T006 `install-local.mjs` and T007 `install-local.ps1`) before npm entry T008
- All three `package.json` edits (T005, T008, T009) modify the same file — perform in sequence or batch in a single edit

### Parallel Opportunities

- T001 and T002 can run in parallel (different files: `.gitignore` vs `.vscodeignore`)
- T003 and T006 can run in parallel (different files: `package-local.mjs` vs `install-local.mjs`)
- T004 and T007 can run in parallel (PowerShell scripts for each story)
- T005, T008, T009 all edit `package.json` — perform sequentially or batch together
- T010 (README) can run in parallel with any of T003–T009

---

## Parallel Example: Phase 1 + Story Scripts

```
Phase 1 (parallel):
  → T001  Update .gitignore
  → T002  Update .vscodeignore

Phase 2+3 (parallel after Phase 1):
  → T003  Create scripts/package-local.mjs        → T004  Add package:local to package.json
  → T005  Create scripts/install-local.mjs         → T006  Add install:local to package.json

Phase 4 (after T004 + T006):
  → T007  Add release:local to package.json

Polish (after all stories + in parallel with each other):
  → T008  Update README.md
  → T009  Manual quickstart validation
```

---

## Implementation Strategy

**MVP** (minimum deliverable — just US1): Complete T001, T002, T003, T004. This alone lets
a developer produce and share a `.vsix` without marketplace access.

**Full delivery**: Complete all phases T001–T009.

**Incremental order** (recommended for a single developer):
1. T001, T002 (config, 5 min)
2. T003, T004 (package script + npm entry, 15 min)
3. T005, T006 (install script + npm entry, 10 min)
4. T007 (one-liner npm entry, 2 min)
5. T008, T009 (README + validation, 15 min)

**Estimated total**: ~45 minutes

---

## Format Validation

| Check | Result |
|-------|--------|
| All tasks have checkbox `- [ ]` | ✅ 9/9 |
| All tasks have sequential ID (T001–T009) | ✅ |
| [P] markers only on truly parallelizable tasks | ✅ T002, T003, T005, T008 |
| [Story] labels on all user-story-phase tasks | ✅ T003–T007 |
| File paths present in every implementation task | ✅ |
| No placeholder text remaining | ✅ |

**Total tasks**: 9  
**Parallelizable [P]**: 4 (T002, T003, T005, T008)  
**Story-tagged**: 5 (T003 [US1], T004 [US1], T005 [US2], T006 [US2], T007 [US3])  
**Format violations**: 0
