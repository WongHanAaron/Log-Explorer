# Data Model: Filepath Config E2E Test Structure

**Date**: 2026-03-18  
**Feature**: 009-filepath-config-e2e-tests  

## Overview

This document defines the structure of test scenarios, fixture data, and assertion payloads used in the filepath-config E2E test suite.

---

## Test Scenario Entity

**Location**: `test/e2e/ui/scenarios/*.e2e.json`  
**Format**: JSON (declarative step-based automation)

### Scenario Structure

```json
{
  "id": "string",                    // unique identifier (kebab-case)
  "name": "string",                  // human-readable title
  "priority": "P1" | "P2" | "P3",    // from spec (all filepath-config are P1)
  "tags": ["string"],                // for filtering: ["e2e", "filepath-config", "smoke"]
  "replayEnabled": boolean,          // enable artifact capture (true for all)
  "preconditions": ["string"],       // e.g. ["fixture:default-workspace"]
  "steps": [                         // ordered array of test actions
    {
      "index": number,               // 1-based sequence number
      "actionType": "string",        // see action types below
      "target": { ... },             // action-specific parameters
      "expectedOutputs": [ ... ],    // assertions to verify
      "pauseAfter": boolean          // pause after step in debug mode (optional)
    }
  ]
}
```

### Supported Action Types

| Type | Purpose | Target Parameters | Example |
|------|---------|-------------------|---------|
| `openBrowser` | Launch Chromium headless | `{}` (empty) | Open test browser |
| `goto` | Navigate to URL | `{ "url": "..." }` | Load test harness HTML |
| `click` | Click an element | `{ "selector": "..." }` | Click Save button |
| `type` | Type text into input | `{ "selector": "...", "text": "..." }` | Enter config name |
| `clear` | Clear input field | `{ "selector": "..." }` | Clear name field |
| `fill` | Set input value plus blur | `{ "selector": "...", "text": "..." }` | Fill path pattern |

### Assertion Types

| Type | Purpose | Example |
|------|---------|---------|
| `state` | Verify internal state key | `{ "type": "state", "source": { "stateKey": "formValid" }, "expected": true }` |
| `visible` | Check element visibility | `{ "type": "visible", "source": { "selector": ".save-btn" }, "expected": true }` |
| `textContains` | Verify text substring | `{ "type": "textContains", "source": { "selector": ".error" }, "expected": "kebab-case" }` |
| `textEquals` | Verify exact text match | `{ "type": "textEquals", "source": { "selector": ".title" }, "expected": "Edit Config" }` |
| `exists` | Check element exists in DOM | `{ "type": "exists", "source": { "selector": "#save-form" }, "expected": true }` |

---

## Fixture Config Structure

**Location**: `test/e2e/ui/fixtures/default-workspace/.logex/filepath-configs/example-config.json`

### FilepathConfig File Format

```json
{
  "id": "example-config",
  "shortName": "example-config",
  "pathPattern": "/var/log/app.log"
}
```

**Fields**:
- `id` (string): Unique identifier; typically matches filename without `.json`
- `shortName` (string): Kebab-case config name (must match regex `^[a-z0-9]+(-[a-z0-9]+)*$`)
- `pathPattern` (string): Glob or literal path pattern for log files

### Fixture Preparation

The fixture should include:

```text
test/e2e/ui/fixtures/default-workspace/
├── ui/debug-harness.html               (existing)
└── .logex/
    └── filepath-configs/
        ├── example-config.json         (pre-populated for load test)
        └── starter-logs.json           (optional: alt config for testing)
```

**Example fixture config** (`example-config.json`):
```json
{
  "id": "example-config",
  "shortName": "example-config",
  "pathPattern": "/var/log/example.log"
}
```

---

## Test Scenario Entities

### Scenario 1: Validate Kebab-Case

**ID**: `filepath-config-validate-kebab-case`  
**Maps to**: User Story 1 (Config Name Validation)

**Pre-run State**:
- Form is empty and open
- No error messages visible

**Steps**:
1. Click config name input
2. Type invalid name "MyConfig" (uppercase)
3. Verify error message appears below field
4. Clear field
5. Type valid name "my-config" (kebab-case)
6. Verify error message disappears
7. Type invalid name with underscore "my_config"
8. Verify error re-appears
9. Attempt form submission
10. Verify submission is prevented

**Assertions**:
- After step 3: `textContains(selector: ".name-error", text: "kebab-case")` → true
- After step 6: `visible(selector: ".name-error")` → false
- After step 8: `visible(selector: ".name-error")` → true
- After step 9: `state(stateKey: "formSubmitted")` → false

### Scenario 2: Save Button Visibility

**ID**: `filepath-config-save-button-visibility`  
**Maps to**: User Story 2 (Save Button Visibility)

**Pre-run State**:
- Form is empty
- Save button should not be visible

**Steps**:
1. Verify Save button is not visible (no fields filled)
2. Click name input, type "my-config"
3. Verify Save button still not visible (path field empty)
4. Click path input, type "/var/log/app.log"
5. Verify Save button becomes visible (all fields valid)
6. Clear path field (make it empty)
7. Verify Save button disappears (path now empty)
8. Click name input, select all, type "MyConfig" (invalid)
9. Verify Save button disappears (error in name field)
10. Clear name and type "valid-name"
11. Verify Save button still not visible (path empty)
12. Type path "/another.log"
13. Verify Save button becomes visible (all valid again)

**Assertions**:
- After step 1: `visible(".save-btn")` → false
- After step 3: `visible(".save-btn")` → false
- After step 5: `visible(".save-btn")` → true
- After step 7: `visible(".save-btn")` → false
- After step 9: `visible(".save-btn")` → false
- After step 11: `visible(".save-btn")` → false
- After step 13: `visible(".save-btn")` → true

### Scenario 3: Save Config to File

**ID**: `filepath-config-save-to-file`  
**Maps to**: User Story 3 (Form Submission & Persistence)

**Pre-run State**:
- Form is empty
- `.logex/filepath-configs/` directory exists but is empty
- No test-created configs exist

**Steps**:
1. Click name input, type "test-config-1"
2. Click path input, type "/var/log/test.log"
3. Verify Save button is visible
4. Click Save button
5. Wait for success confirmation (if present in UI)
6. Verify config file was created: `.logex/filepath-configs/test-config-1.json`
7. Verify file contains correct JSON structure
8. Read file content and verify `shortName === "test-config-1"`
9. Verify `pathPattern === "/var/log/test.log"`
10. Clean up: delete created config file

**Assertions**:
- After step 4: `state(stateKey: "formSubmitted")` → true
- After step 5: File exists at `.logex/filepath-configs/test-config-1.json` → true
- After step 8: File content `shortName` → "test-config-1"
- After step 9: File content `pathPattern` → "/var/log/test.log"

### Scenario 4: Load Config from List

**ID**: `filepath-config-load-from-list`  
**Maps to**: User Story 4 (Config Loading)

**Pre-run State**:
- Fixture includes `example-config.json` in `.logex/filepath-configs/`
- Config list is populated with at least one config
- Form is empty

**Steps**:
1. Verify config list shows "example-config"
2. Click "example-config" in list
3. Verify name field populates with "example-config"
4. Verify path field populates with "/var/log/example.log"
5. Clear name field and type "new-name" (simulate edit)
6. Click Save button
7. Verify file created at `.logex/filepath-configs/new-name.json`
8. Click "example-config" in list again
9. Verify form populates with original values (no stale state)
10. Clean up: delete test-created config files

**Assertions**:
- After step 2: `textEquals(".name-input", "example-config")` → true
- After step 4: `textEquals(".path-input", "/var/log/example.log")` → true
- After step 7: File exists at `.logex/filepath-configs/new-name.json` → true
- After step 9: `textEquals(".name-input", "example-config")` → true

---

## Test Data Inputs

### Valid Config Names (Kebab-Case)

- ✅ `my-config`
- ✅ `test-logs`
- ✅ `app-configs-prod`
- ✅ `web-service`

### Invalid Config Names (Must Show Error)

- ❌ `MyConfig` (uppercase letters)
- ❌ `my_config` (underscores instead of hyphens)
- ❌ `my--config` (double hyphens)
- ❌ `-my-config` (leading hyphen)
- ❌ `my-config-` (trailing hyphen)
- ❌ `my config` (spaces)

### Valid Path Patterns

- `/var/log/app.log`
- `/home/user/logs/*.log`
- `C:\Users\User\logs\app.log` (Windows)
- `~/logs/service.log`

---

## Edge Cases & Known Scenarios

### Edge Case 1: Rapid Field Changes

**Scenario**: User types quickly in name field, no pause between characters.  
**Action**: Type "my-config" in rapid succession.  
**Assertion**: No debounce delays prevent Save button from appearing; validation responds immediately.

### Edge Case 2: Cancel/Discard Edits

**Scenario**: User loads existing config, modifies fields, but closes form without saving.  
**Action**: Load config → modify → click elsewhere / close.  
**Assertion**: List item is no longer selected; form clears or reverts to previous state.

### Edge Case 3: Duplicate Config Name

**Scenario**: User attempts to save a config with a name that already exists.  
**Action**: Create config "test" → close → create new config "test" → save.  
**Expected**: Either overwrite existing file (if spec allows) or show error (if spec forbids).  
**Note**: Spec defers this decision; test contracts will be updated once spec clarifies behavior.

### Edge Case 4: Empty Path Pattern

**Scenario**: User types a valid name but leaves path empty, then clicks Save.  
**Action**: Enter name "my-config" → leave path empty → click Save.  
**Assertion**: Save button should not be visible; if accidentally clicked, show validation error.

---

## Summary

The test data model defines:
- **Scenario structure**: JSON format with steps and assertions
- **Fixture data**: Pre-populated configs for test setup
- **Assertion payloads**: Content verification patterns
- **Edge cases**: Known corner cases to test

All scenarios use this model and follow the patterns defined above.
