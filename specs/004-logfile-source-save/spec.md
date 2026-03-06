# Feature Specification: Log File Source Editor Save

**Feature Branch**: `004-logfile-source-save`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "I want to implement functional saving capability for the log file source editor. The save button should only appear when it is valid to save the config. Saving the config will save it into a json file using the existing config-store class."

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

### User Story 1 - Save Valid Configuration (Priority: P1)

As a developer editing a log file source, I want a **Save** action to persist my changes so that I can reuse the configuration later.

**Why this priority**: Persisting the configuration is the core functionality of the editor; without it users cannot actually record their filepath rules.

**Independent Test**: Open the Log File Source Editor, fill out a new or existing config with valid values, click Save, then verify a corresponding JSON file exists in the workspace `.logex/filepath-configs/` folder with the expected contents.

**Acceptance Scenarios**:

1. **Given** an initialized workspace and open editor with valid fields, **When** the user clicks the Save button, **Then** the config-store writes a JSON file named `<short-name>.json` under `.logex/filepath-configs/` containing the current config.
2. **Given** the editor is displaying an existing configuration, **When** the user modifies any field and clicks Save, **Then** the original file is overwritten with the updated values and no duplicate file is created.
3. **Given** a workspace already contains a config file with the same short name as the one currently entered, **When** the user clicks Save, **Then** the editor prompts the user to confirm overwriting and only writes the file if the user agrees.

---

---

### User Story 2 - Save Button Validation (Priority: P1)

As a developer using the editor, I want the Save button to only be visible and enabled when the current form data is valid, so I am not misled into thinking I can save invalid configurations.

**Why this priority**: Preventing invalid saves avoids corrupted or unusable configuration files and gives immediate feedback on form errors.

**Independent Test**: Open the editor with an empty or partially filled form; verify the Save button is hidden or disabled. Fill in all required fields correctly; verify the Save button appears or becomes enabled.

**Acceptance Scenarios**:

1. **Given** a new empty editor, **When** no short name or path pattern is provided, **Then** the Save button is not shown (or is disabled) and form validation messages prompt the user.
2. **Given** the editor has an invalid short name (spaces, uppercase letters) or an empty path pattern, **When** the user corrects the input, **Then** the Save button becomes visible and enabled.

---

---

### User Story 3 - Handle Save Errors (Priority: P2)

If the underlying config-store fails (e.g. due to file system permissions), the user should receive an error message and the editor should remain unchanged.

**Why this priority**: While less common, filesystem failures happen and users need clear feedback rather than silent loss of data.

**Independent Test**: Simulate a write failure by pointing the workspace at a read-only directory or mocking the config-store; attempt to save and verify an error dialog appears and no file is written.

**Acceptance Scenarios**:

1. **Given** the workspace folder is read-only or disk is full, **When** the user clicks Save, **Then** an error message is displayed describing the failure and the editor remains open with the current values intact.

---

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens if two editors open the same config file simultaneously and both attempt to save with conflicting changes?
- What if the short name is changed to one that already exists on disk; should the system prompt to overwrite or reject?
- How does the save logic behave when the `.logex/filepath-configs/` directory has been deleted while the editor is open?
- How is atomicity ensured when writing the JSON file to avoid partial writes (e.g. write to a temp file then rename)?
- What happens if the config-store returns success but the file is later corrupted by an external process? (perhaps out of scope but worth noting)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Log File Source Editor MUST display a Save button only when the current configuration data passes validation rules (short name present and kebab-cased, path pattern non-empty).
- **FR-002**: When the Save button is activated, the editor MUST invoke the existing `config-store` class to write the current `FilepathConfig` object as JSON to a file named `<short-name>.json` under `.logex/filepath-configs/` in the workspace.
- **FR-003**: The Save operation MUST overwrite an existing file with the same short name rather than creating a duplicate.
- **FR-004**: If validation fails, the Save button MUST be hidden or disabled and the editor MUST show appropriate error messages preventing the user from saving.
- **FR-005**: The system MUST present a clear, user-friendly error message if the config-store returns a write failure, and MUST not clear or reset the editor contents when such an error occurs.
- **FR-006**: The editor MUST automatically create the `.logex/filepath-configs/` directory if it does not already exist before attempting to save.
- **FR-007**: After a successful save, the editor's internal state MUST reflect that the current values are persisted (e.g. disable the Save button until further changes are made).
- **FR-008**: The system MUST prevent saving if the chosen short name would conflict with an existing file unless the user explicitly confirms overwriting.


### Key Entities *(include if feature involves data)*

- **FilepathConfig**: Represents the configuration for a log file source. Key attributes include `shortName` (kebab-case identifier), `pathPattern` (glob or path), optional `description`, `schemaVersion`, and `tags` (optional string array).
- **ConfigStore**: Abstraction responsible for reading and writing config objects to disk. Exposes methods such as `saveFilepathConfig(config: FilepathConfig)` which returns success/failure.

## Assumptions

- The workspace initialization step (creating `.logex` directories) has already been implemented and is executed before this feature is used.
- The log file source editor UI already exists with form fields and basic validation logic; this feature focuses on wiring up the Save action and state.
- The `config-store` class is available and capable of writing JSON files; error handling around its failures is possible.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of valid configurations typed into the editor result in a new or updated JSON file appearing in `.logex/filepath-configs/` when the user clicks Save.
- **SC-002**: The Save button is hidden or disabled in 100% of editor states where the input fails validation rules.
- **SC-003**: Users receive a clear error message within 2 seconds when the config-store write operation fails due to file system issues.
- **SC-004**: After saving, the editor accurately reflects that no unsaved changes remain (e.g., Save button disabled) for at least 95% of save events in manual testing.
