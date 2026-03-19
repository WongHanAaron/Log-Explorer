# Feature Specification: Filepath Config E2E Tests

**Feature Branch**: `009-filepath-config-e2e-tests`  
**Created**: 2026-03-18  
**Status**: Draft  

## Overview

Expand the filepath-config UI testing coverage with comprehensive end-to-end tests that validate form behavior, error handling, save functionality, and configuration persistence. This feature focuses on automating test scenarios that confirm users can create, validate, save, and load file path configurations through the UI.

## User Scenarios & Testing

### User Story 1 - Validate Kebab-Case Config Name (Priority: P1)

QA engineer needs to verify that the filepathconfig UI enforces kebab-case naming rules for configuration names, providing clear inline error messages so users understand why their input is invalid.

**Why this priority**: P1 - Form validation is fundamental to data integrity and user experience. Invalid config names would cause downstream errors when navigating configs.

**Independent Test**: Can be fully tested with only the filepath-config edit form open—input an invalid name, verify error appears, then input valid kebab-case name and verify error clears.

**Acceptance Scenarios**:

1. **Given** the filepath-config edit form is displayed, **When** user types a name containing uppercase letters (e.g. "MyConfig"), **Then** an inline error is shown below the name input field indicating the format requirement (kebab-case only).

2. **Given** an error is currently shown below the config name, **When** user updates the name to valid kebab-case format (e.g. "my-config"), **Then** the error message disappears.

3. **Given** the config name field shows an error, **When** user submits the form (tries to save), **Then** the save is prevented and the error persists.

### User Story 2 - Save Button Visibility Based on Form Validity (Priority: P1)

QA engineer needs to confirm that the Save button appears only when all required form fields are populated and valid, providing visual feedback that the user can proceed.

**Why this priority**: P1 - Save button visibility is critical UX feedback. Hidden buttons are confusing; visible invalid-state buttons invite errors.

**Independent Test**: Can be fully tested by interacting only with form fields and observing Save button presence/absence—no file system operations needed.

**Acceptance Scenarios**:

1. **Given** the filepath-config edit form is open and empty (new config), **When** no fields are filled, **Then** the Save button is not visible.

2. **Given** the filepath-config edit form has a valid config name entered, **When** the path pattern field is still empty, **Then** the Save button is not visible.

3. **Given** both config name (valid kebab-case) and path pattern are filled in, **When** all required fields are complete and valid, **Then** the Save button becomes visible.

4. **Given** the Save button is visible and form is valid, **When** an error is introduced (e.g. config name changed to invalid format), **Then** the Save button disappears.

### User Story 3 - Save Config to File System (Priority: P1)

QA engineer needs to verify that when a user submits a valid filepath-config form, the system persists the configuration to the file system in the correct location with proper JSON structure.

**Why this priority**: P1 - Config persistence is the entire purpose of the feature. Without this working, nothing else matters. 

**Independent Test**: Can be fully tested by filling a valid form, clicking Save, then verifying the config file was created on disk with expected content.

**Acceptance Scenarios**:

1. **Given** the filepath-config edit form is filled with valid data (name: "app-logs", pathPattern: "/var/log/app.log"), **When** the Save button is clicked, **Then** a new file is created at `.logex/filepath-configs/app-logs.json` on disk.

2. **Given** a config is saved, **When** the created JSON file is read, **Then** it contains the correct structure with shortName and pathPattern fields matching the form input.

3. **Given** a valid config form is submitted, **When** the file is successfully created, **Then** the UI shows visual confirmation (e.g., message or form clears for next entry).

### User Story 4 - Load Existing Config from List (Priority: P1)

QA engineer needs to verify that clicking on a saved config in the left panel loads its parameters into the right-side edit form, allowing users to view and modify existing configurations.

**Why this priority**: P1 - Config loading completes the CRUD cycle. Users need to edit and manage existing configs, not just create new ones.

**Independent Test**: Can be fully tested by creating a config, clicking it in the list, and verifying the form fields populate correctly.

**Acceptance Scenarios**:

1. **Given** at least one filepath-config exists in the list panel on the left, **When** user clicks on a config name in the list, **Then** the edit form on the right populates with that config's name and path pattern.

2. **Given** a config is loaded into the form from the list, **When** user modifies a field and clicks Save, **Then** the changes are persisted to the config file and the list still shows the config.

3. **Given** multiple configs exist in the list, **When** user selects different configs by clicking them sequentially, **Then** each click loads the corresponding config data into the form (no stale data persists between selections).

### Edge Cases

- What happens if user creates a config, then manually deletes the `.json` file from disk while the UI is open?
- How does the system handle special characters or spaces in path patterns?
- If a user attempts to save a config with the same name as an existing config, does it overwrite or reject?
- Can user clear required fields after they've been filled (leaving them empty)?

## Requirements

### Functional Requirements

1. **Config Name Validation** - Form must validate config name against kebab-case regex (`^[a-z0-9]+(-[a-z0-9]+)*$`) and display inline error when invalid. Error must clear when valid input is provided.

2. **Save Button Visibility** - Save button must be hidden when any required field is empty or contains validation errors. Button must appear only when all conditions are met.

3. **Form Submission & Persistence** - When Save button is clicked on a valid form, system must create/update the config JSON file at `.logex/filepath-configs/{shortName}.json` with correct structure.

4. **Config Loading** - Clicking a config name in the left list panel must load its properties into the right-side form fields (name and path pattern at minimum).

5. **Form State Management** - Form must maintain separate state for create vs. edit modes. Editing an existing config should not affect the create form state.

### Test-Specific Requirements

1. All tests must execute within the E2E test framework (currently using Playwright or similar in `test/e2e/`)
2. Tests must not depend on manual file system setup; any needed configs should be created programmatically
3. Tests must clean up created configs after execution to avoid test pollution
4. Each test scenario should be independent and executable in isolation

## Success Criteria

1. **Test Coverage** - All 4 user stories are covered by at least one passing E2E test, with edge cases included where feasible.
2. **Test Reliability** - Tests pass consistently (no flakes) when run sequentially and in isolation.
3. **Test Speed** - Individual tests complete in under 5 seconds; full suite completes in under 30 seconds.
4. **Code Quality** - Test code follows project conventions, uses readable assertions, and includes setup/teardown logic.
5. **Documentation** - Test file includes JSDoc comments explaining complex test logic or selectors.

## Assumptions

- The filepath-config UI currently exists and is functional (not being built in this feature)
- Form validation logic is already implemented in the component
- File system operations use the existing FileAccess adapters
- E2E test infrastructure (Playwright, test runner, fixtures) is already configured
- The kebab-case regex pattern is consistent across form validation and backend parsing
- Config files are stored as JSON in `.logex/filepath-configs/` directory relative to workspace root

## Key Entities

- **FilepathConfig**: Domain model with `shortName` (kebab-case string) and `pathPattern` (path string)
- **Config JSON File**: `.logex/filepath-configs/{shortName}.json`  
- **Edit Form**: Right-side UI component with name and path pattern inputs
- **List Panel**: Left-side UI showing saved config names; selecting one loads it into the edit form
- **Save Button**: Submit button visible only when form is valid

## Notes

- Consider re-using existing test fixtures/builders for creating test configs
- Tests may benefit from helper functions for common assertions (config file exists, form shows value, etc.)
- If Config loading requires clicking a list item, ensure selector is stable and doesn't change based on config order
