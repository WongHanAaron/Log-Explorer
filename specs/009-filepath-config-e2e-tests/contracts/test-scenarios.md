# Contract: Test Scenario Structure & Naming

**Date**: 2026-03-18  
**Feature**: 009-filepath-config-e2e-tests  

This document defines the structure, naming conventions, and patterns for test scenarios.

---

## Scenario Naming Convention

### Format

```
filepath-config-{feature-or-user-story-name}.e2e.json
```

### Examples

- `filepath-config-validate-kebab-case.e2e.json` — Maps to User Story 1
- `filepath-config-save-button-visibility.e2e.json` — Maps to User Story 2
- `filepath-config-save-to-file.e2e.json` — Maps to User Story 3
- `filepath-config-load-from-list.e2e.json` — Maps to User Story 4

**Rule**: Name should clearly indicate what feature or user journey is being tested. Use kebab-case.

---

## Scenario JSON Schema

All scenarios must conform to this structure:

```json
{
  "id": "string",
  "name": "string",
  "priority": "string",
  "tags": ["string"],
  "replayEnabled": "boolean",
  "preconditions": ["string"],
  "steps": [
    {
      "index": "number",
      "actionType": "string",
      "target": "object",
      "expectedOutputs": [
        {
          "type": "string",
          "source": "object",
          "expected": "any",
          "comparator": "string"
        }
      ],
      "pauseAfter": "boolean (optional)"
    }
  ]
}
```

---

## Field Definitions

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique scenario identifier; must be kebab-case, must match filename (without `.json` and `.e2e`) |
| `name` | string | ✅ Yes | Human-readable title (e.g., "Validates kebab-case config name") |
| `priority` | string | ✅ Yes | One of `P1`, `P2`, `P3` (all filepath-config scenarios are P1) |
| `tags` | string[] | ✅ Yes | Array of tags for filtering; must include `"e2e"`, `"filepath-config"` + feature-specific tags |
| `replayEnabled` | boolean | ✅ Yes | Always `true` for filepath-config tests (enables artifact capture) |
| `preconditions` | string[] | ✅ Yes | Array of preconditions (e.g., `["fixture:default-workspace"]`); currently always fixture-based |
| `steps` | object[] | ✅ Yes | Array of test steps (must have at least 2: openBrowser + goto) |

### Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | number | ✅ Yes | 1-based step sequence number; must match array position |
| `actionType` | string | ✅ Yes | Type of action: `openBrowser`, `goto`, `click`, `type`, `clear`, `fill` |
| `target` | object | ✅ Yes | Action-specific parameters (see action types below) |
| `expectedOutputs` | object[] | ✅ Yes | Array of assertions (must have at least 1 per step) |
| `pauseAfter` | boolean | ❌ No | If `true`, pause after step in debug mode (useful during development) |

---

## Action Types & Target Structure

### openBrowser

Opens Chromium browser instance.

**Target**:
```json
{}
```

**Example**:
```json
{
  "index": 1,
  "actionType": "openBrowser",
  "target": {},
  "expectedOutputs": [...]
}
```

---

### goto

Navigate to a URL.

**Target**:
```json
{
  "url": "string (required)"  // URL to navigate to; supports {{placeholder}} tokens
}
```

**Supported Tokens**:
- `{{fixturePath}}` — Absolute path to fixture directory (e.g., `.../test/e2e/ui/fixtures/default-workspace`)

**Example**:
```json
{
  "index": 2,
  "actionType": "goto",
  "target": {
    "url": "file://{{fixturePath}}/ui/debug-harness.html"
  },
  "expectedOutputs": [...]
}
```

---

### click

Click an element identified by CSS selector.

**Target**:
```json
{
  "selector": "string (required)"  // CSS selector
}
```

**Example**:
```json
{
  "index": 3,
  "actionType": "click",
  "target": { "selector": ".save-btn" },
  "expectedOutputs": [...]
}
```

---

### type

Type text character-by-character into a focused input (simulates keyboard input).

**Target**:
```json
{
  "selector": "string (required)",  // CSS selector of input element
  "text": "string (required)"        // Text to type
}
```

**Example**:
```json
{
  "index": 4,
  "actionType": "type",
  "target": {
    "selector": "#name-input",
    "text": "my-config"
  },
  "expectedOutputs": [...]
}
```

---

### clear

Clear the value of an input field.

**Target**:
```json
{
  "selector": "string (required)"  // CSS selector of input element
}
```

**Example**:
```json
{
  "index": 5,
  "actionType": "clear",
  "target": { "selector": "#name-input" },
  "expectedOutputs": [...]
}
```

---

### fill

Set input value and trigger blur event (more reliable than type for testing).

**Target**:
```json
{
  "selector": "string (required)",  // CSS selector of input element
  "text": "string (required)"        // Value to set
}
```

**Example**:
```json
{
  "index": 6,
  "actionType": "fill",
  "target": {
    "selector": "#path-input",
    "text": "/var/log/app.log"
  },
  "expectedOutputs": [...]
}
```

---

## Expected Outputs (Assertions)

Each step must include at least one assertion in `expectedOutputs`. Assertions define what the test expects to observe after the action.

### Assertion Structure

```json
{
  "type": "string",                  // Assertion type (see types below)
  "source": "object",                // What to check (selector, stateKey, etc.)
  "expected": "any",                 // Expected value
  "comparator": "string (optional)"  // How to compare (usually "equals" or "contains")
}
```

---

## Assertion Types

### state

Verifies internal state key value.

**Source**:
```json
{
  "stateKey": "string"  // Key to check in component state
}
```

**Example**:
```json
{
  "type": "state",
  "source": { "stateKey": "formValid" },
  "expected": true,
  "comparator": "equals"
}
```

**Common state keys** (to be documented as UI is built):
- `browserOpened` — Chromium launched
- `formValid` — All form validations pass
- `formSubmitted` — Form was submitted
- `configLoaded` — Config loaded into form
- `configSaved` — Config persisted to disk

---

### visible

Checks if an element is visible in the DOM.

**Source**:
```json
{
  "selector": "string"  // CSS selector
}
```

**Example**:
```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": true,
  "comparator": "equals"
}
```

**Expected values**:
- `true` — Element must be visible
- `false` — Element must be hidden or not in DOM

---

### textEquals

Verifies exact text content of an element.

**Source**:
```json
{
  "selector": "string"  // CSS selector
}
```

**Example**:
```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "my-config",
  "comparator": "equals"
}
```

**Use when**: Text must match exactly (e.g., input value, label text)

---

### textContains

Checks if element text contains a substring.

**Source**:
```json
{
  "selector": "string"  // CSS selector
}
```

**Example**:
```json
{
  "type": "textContains",
  "source": { "selector": ".error-message" },
  "expected": "kebab-case only",
  "comparator": "contains"
}
```

**Use when**: Text may vary but must contain a key phrase (e.g., error messages with timestamps)

---

### exists

Checks if an element exists in the DOM (may be hidden).

**Source**:
```json
{
  "selector": "string"  // CSS selector
}
```

**Example**:
```json
{
  "type": "exists",
  "source": { "selector": "#config-form" },
  "expected": true,
  "comparator": "equals"
}
```

**Expected values**:
- `true` — Element must exist in DOM
- `false` — Element must not be in DOM

---

## Common Assertion Patterns

### Button Visibility Toggle

Verify Save button appears/disappears based on form state:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": true,
  "comparator": "equals"
}
```

### Error Message Appears

Verify validation error is shown:

```json
{
  "type": "textContains",
  "source": { "selector": ".error-text" },
  "expected": "must be kebab-case",
  "comparator": "contains"
}
```

### Error Message Clears

Verify error disappears when input corrected:

```json
{
  "type": "visible",
  "source": { "selector": ".error-text" },
  "expected": false,
  "comparator": "equals"
}
```

### Form Field Populated

Verify input field has correct value:

```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "test-config",
  "comparator": "equals"
}
```

### Form Field Empty

Verify input field is cleared:

```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "",
  "comparator": "equals"
}
```

---

## Minimum Scenario Structure

Every scenario must include:

1. **Step 1: openBrowser**
   - Assertion: `state(browserOpened) === true`

2. **Step 2: goto**
   - Assertion: `visible(#app) === true`

3. **Step 3+: Feature-specific interactions**
   - Click, type, verify visibility, etc.
   - At least one assertion per step

**Example**:
```json
{
  "id": "filepath-config-minimal-example",
  "name": "Minimal example",
  "priority": "P1",
  "tags": ["e2e", "filepath-config"],
  "replayEnabled": true,
  "preconditions": ["fixture:default-workspace"],
  "steps": [
    {
      "index": 1,
      "actionType": "openBrowser",
      "target": {},
      "expectedOutputs": [
        {
          "type": "state",
          "source": { "stateKey": "browserOpened" },
          "expected": true,
          "comparator": "equals"
        }
      ]
    },
    {
      "index": 2,
      "actionType": "goto",
      "target": { "url": "file://{{fixturePath}}/ui/debug-harness.html" },
      "expectedOutputs": [
        {
          "type": "visible",
          "source": { "selector": "#app" },
          "expected": true,
          "comparator": "equals"
        }
      ]
    }
  ]
}
```

---

## Tags and Priority Conventions

### Required Tags (All Scenarios)

- `"e2e"` — Marks as E2E test
- `"filepath-config"` — Feature tag

### Priority Tags (Choose One)

- `"P1"` — Critical; covers user story
- `"P2"` — Important; covers edge case or related feature
- `"P3"` — Nice-to-have; exploratory or rare scenario

### Feature Tags (Optional)

- `"smoke"` — Quick, essential test (all 4 core scenarios)
- `"validation"` — Tests validation logic
- `"persistence"` — Tests file save/load
- `"ui"` — Tests UI interaction (all)

**Example tags for all 4 filepath-config scenarios**:
```json
"tags": ["e2e", "filepath-config", "smoke", "P1"]
```

---

## Scenario Execution Sequence Rules

1. **openBrowser must be first** — All scenarios start by launching Chromium
2. **goto must be second** — Navigate to UI before interaction
3. **Assertions must follow actions** — Never assert before attempting the action
4. **Steps should be sequential** — No branching logic in scenario JSON (runner handles conditionals)
5. **cleanup should be last** — If cleanup needed, should be final steps with delete/clear actions

---

## References

- **Quickstart**: [quickstart.md](../quickstart.md)
- **Data Model**: [data-model.md](../data-model.md)
- **E2E Framework**: [../../docs/testing/ui-e2e.md](../../../docs/testing/ui-e2e.md)
- **Existing Scenarios**: [../../test/e2e/ui/scenarios/](../../../test/e2e/ui/scenarios/)
