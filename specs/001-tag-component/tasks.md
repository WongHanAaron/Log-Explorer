# Tasks: Shareable Tag Component

**Input**: Design documents from `/specs/001-tag-component/`
**Prerequisites**: plan.md (required), spec.md, research.md, data-model.md, contracts/


## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan (src/webview/shared/components/tag directory)
- [x] T002 [P] Add new shared UI files `Tag.tsx` and `TagSet.tsx` under `src/webview/shared/components/tag`
- [x] T003 [P] Add TypeScript declarations and optional CSS file for tag components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 [P] Ensure shared components folder is exported in `src/webview/shared/components/index.ts` if exists
- [x] T005 [P] Add Tailwind utility classes or global CSS variables for pill styling (`bg-[--button-primary-bg]`, etc.)
- [x] T006 Update `esbuild.mjs` to include new entry if needed (none required since components are imported rather than bundling standalone)

---

## Phase 3: User Story 1 - Manage Tags in Log File Source (Priority: P1) 🎯 MVP

**Goal**: Provide interactive tag UI in log-file-sources editor that supports adding, renaming, merging, and removing tags.

**Independent Test**: Open log-file-sources webview and verify tags behave as specified (see spec scenarios).

### Implementation for User Story 1

- [x] T007 [US1] Implement `Tag` component in `src/webview/shared/components/tag/Tag.tsx` (pill view / inline edit)
- [x] T008 [US1] Implement `TagSet` component in `src/webview/shared/components/tag/TagSet.tsx` (renders list, add button, wrapping layout)
- [x] T009 [US1] Add props to `TagSet` for `tags`, `onAdd`, `onRename`, `onRemove`, `maxTags?`, and optional `validate?` function
- [x] T010 [US1] Style tags using shared CSS variables and Tailwind classes
- [x] T011 [US1] Add unit tests for `Tag` and `TagSet` components under `test/unit/webview/tag.test.tsx`
- [x] T012 [US1] Update `src/webview/log-file-sources/main.tsx` to replace Labels textarea with `TagSet` and wire message handlers
- [x] T013 [US1] Modify `LogFileSourcesPanel` (src/panels/editors/LogFileSourcesPanel.ts) to send and receive `tags` as array in messages
- [x] T014 [US1] Add serialization/deserialization of `tags` array in `ConfigStore` usage within `LogFileSourcesPanel`
- [ ] T015 [US1] Add integration test simulating editing tags in log-file-sources panel (e2e or unit depending on framework)

**Checkpoint**: Tag UI is functional in the log-file-sources panel and persists tags correctly.

---

## Phase 4: User Story 2 - Reuse Tag Component Elsewhere (Priority: P2)

**Goal**: Make Tag/TagSet components generic and demonstrate reuse in another panel or sandbox.

**Independent Test**: Render component in a simple test harness with static props.

### Implementation for User Story 2

- [ ] T016 [US2] Refactor TagSet to export types and ensure no log-file-specific logic
- [ ] T017 [US2] Create a sandbox page or dummy panel showing TagSet usage with sample data
- [ ] T018 [US2] Add unit test verifying TagSet respects `maxTags` prop and `validate` callback

**Checkpoint**: TagSet works independently of log-file-sources and can be imported by other features.

---

## Phase 5: User Story 3 - Keyboard Accessibility (Priority: P3)

**Goal**: Ensure full keyboard support for adding, renaming, and navigating tags.

**Independent Test**: Use keyboard to operate TagSet without mouse.

### Implementation for User Story 3

- [ ] T019 [US3] Add focus management and keyboard handlers to Tag and TagSet components
- [ ] T020 [US3] Write accessibility-focused unit tests (tab order, Enter/Esc behavior) in `test/unit/webview/tag.accessibility.test.tsx`
- [ ] T021 [US3] Update documentation/quickstart with keyboard guidance

**Checkpoint**: TagSet is fully operable via keyboard alone.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T022 [P] Documentation updates to Quickstart and react-ui-guidelines with tag component usage
- [ ] T023 Code cleanup and refactoring of Tag/TagSet components
- [ ] T024 [P] Add integration tests to the VSCode test suite covering tag functionality
- [ ] T025 Run quickstart.md validation and update with any missing steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Implement components first, tests simultaneously if possible
- UI integration after component logic is stable
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup/Foundational tasks marked [P] can run in parallel
- User stories can be developed simultaneously by different engineers
- Tests for each story can be written in parallel with implementation

---

## Parallel Example: User Story 1

```bash
# while Tag and TagSet components are being built, another person can update
# LogFileSourcesPanel message handling (T013/T014) in parallel
```