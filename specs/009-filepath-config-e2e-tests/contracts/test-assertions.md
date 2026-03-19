# Contract: Test Assertions & Selector Patterns

**Date**: 2026-03-18  
**Feature**: 009-filepath-config-e2e-tests  

This document defines assertion patterns, selector conventions, and expected payloads for filepath-config E2E tests.

---

## Selector Conventions

### Input Fields

| Element | Selector | Rationale |
|---------|----------|-----------|
| Config name input | `#name-input` or `.name-field input` | ID preferred for stability |
| Path pattern input | `#path-input` or `.path-field input` | ID preferred |
| Search/filter input | `#config-search` or `.search-input` | For list filtering |

**Rule**: Prefer `id` selectors (most stable), fall back to class-based selectors if ID unavailable.

### Buttons

| Button | Selector | Rationale |
|--------|----------|-----------|
| Save/Submit | `.save-btn` or `[data-test="save-button"]` | Class-based or data-attribute |
| Delete | `.delete-btn` or `[data-test="delete-button"]` | Consistent naming |
| Clear/Reset | `.clear-btn` or `[data-test="clear-button"]` | Optional (if feature exists) |
| Load/Open Config | `.load-btn` or `[data-test="load-button"]` | For explicit load action |

**Rule**: Use `data-test` attributes when available (most explicit); fall back to class selectors.

### Lists & Items

| Element | Selector | Rationale |
|---------|----------|-----------|
| Config list container | `.config-list` or `[data-test="config-list"]` | Container for all items |
| List item (by index) | `.config-list-item` or `[data-test="config-item"]` | Individual config row |
| List item by text | `.config-list-item` with `:has()` or filter | Safer than positional selection |
| Empty state message | `.empty-state` or `.no-configs` | Shows when list empty |

**Rule**: Prefer semantic selectors over nth-child; use text content when identifying specific items.

### Messages & Feedback

| Message | Selector | Context |
|---------|----------|---------|
| Validation error | `.error-text` or `.validation-error` | Appears below invalid field |
| Success confirmation | `.success-message` or `[role="status"]` | Optional; if UI shows save confirmation |
| Form error summary | `.form-errors` or `.error-list` | If form-level error display |
| Loading indicator | `.loading-spinner` or `[role="progressbar"]` | While saving/loading config |

**Rule**: Use semantic `role` attributes (ARIA) when available; fall back to class-based selectors.

### Container & Layout Elements

| Element | Selector | Purpose |
|---------|----------|---------|
| Main app container | `#app` | Root element always expected to exist |
| Config form | `#config-form` or `.config-editor` | Right-side form area |
| Config list panel | `.config-list-panel` or `[data-test="list-panel"]` | Left-side list area |
| Edit panel | `.edit-panel` or `[data-test="edit-panel"]` | Right-side form area |

---

## Assertion Patterns by Scenario

### Scenario 1: Validate Kebab-Case

**Assertions after typing invalid name**:

```json
{
  "type": "textContains",
  "source": { "selector": ".error-text" },
  "expected": "kebab-case",
  "comparator": "contains"
}
```

**Assertions after typing valid name**:

```json
{
  "type": "visible",
  "source": { "selector": ".error-text" },
  "expected": false,
  "comparator": "equals"
}
```

**Assertions when attempting invalid submission**:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": false,
  "comparator": "equals"
}
```

---

### Scenario 2: Save Button Visibility

**Assertion: no fields filled**:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": false,
  "comparator": "equals"
}
```

**Assertion: name valid, path empty**:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": false,
  "comparator": "equals"
}
```

**Assertion: both fields valid**:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": true,
  "comparator": "equals"
}
```

**Assertion: error introduced (name invalid)**:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": false,
  "comparator": "equals"
}
```

---

### Scenario 3: Save Config to File

**Assertion: before save**:

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": true,
  "comparator": "equals"
}
```

**Assertion: file created (file system check)**:

Note: File assertions may be handled by runner or separate verification step.

```
File: .logex/filepath-configs/test-config-1.json
Expected: exists
```

**Assertion: file content (JSON structure)**:

```json
{
  "shortName": "test-config-1",
  "pathPattern": "/var/log/test.log"
}
```

---

### Scenario 4: Load Config from List

**Assertion: config list shows item**:

```json
{
  "type": "textContains",
  "source": { "selector": ".config-list" },
  "expected": "example-config",
  "comparator": "contains"
}
```

**Assertion: after clicking list item, form is populated**:

```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "example-config",
  "comparator": "equals"
}
```

**Assertion: path field populated**:

```json
{
  "type": "textEquals",
  "source": { "selector": "#path-input" },
  "expected": "/var/log/example.log",
  "comparator": "equals"
}
```

**Assertion: no stale data after multiple selections**:

```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "example-config",
  "comparator": "equals"
}
```

(Verify form resets to correct values, not previous selection)

---

## Assertion Comparators

| Comparator | Type | Use When |
|------------|------|----------|
| `equals` | Exact match | Comparing booleans, visibility, or exact text |
| `contains` | Substring search | Text may be partial or include extra content |
| `startsWith` | Prefix match | Text starts with expected value (optional extension) |
| `endsWith` | Suffix match | Text ends with expected value (optional extension) |

**Current support** (in existing framework):
- ✅ `equals` — Most common
- ✅ `contains` — For error messages with timestamps
- ⏳ `startsWith`, `endsWith` — Check if supported; use `contains` as fallback

---

## Expected Output Payloads

### Validation Error Payload

When kebab-case validation fails:

```json
{
  "element": ".error-text",
  "text": "Config name must be kebab-case (lowercase letters, numbers, and hyphens only)",
  "visible": true,
  "classes": ["error-text", "validation-error", "show"]
}
```

**Assertion**:
```json
{
  "type": "textContains",
  "source": { "selector": ".error-text" },
  "expected": "kebab-case",
  "comparator": "contains"
}
```

---

### Button Visibility Payload

When form is invalid (button should be hidden):

```json
{
  "element": ".save-btn",
  "computed": {
    "display": "none",
    "visibility": "hidden",
    "opacity": "0"
  },
  "visible": false
}
```

**Assertion**:
```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": false,
  "comparator": "equals"
}
```

---

### Form Field Value Payload

When config is loaded into form:

```json
{
  "element": "#name-input",
  "value": "example-config",
  "type": "text",
  "placeholder": "Enter config name"
}
```

**Assertion**:
```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "example-config",
  "comparator": "equals"
}
```

---

### List Item Payload

When config list is populated:

```json
{
  "element": ".config-list-item",
  "innerText": "example-config",
  "dataset": { "configId": "example-config", "configName": "example-config" },
  "clickable": true
}
```

**Assertion**:
```json
{
  "type": "textContains",
  "source": { "selector": ".config-list" },
  "expected": "example-config",
  "comparator": "contains"
}
```

---

## Error Message Conventions

### Kebab-Case Validation Error

**Expected message**:
```
Config name must be kebab-case (lowercase letters, numbers, and hyphens only)
```

**Alternative acceptable messages**:
- "Must be kebab-case"
- "Enter a valid config name (kebab-case format)"
- "Config name: kebab-case only"

**Assertion** (using contains for flexibility):
```json
{
  "type": "textContains",
  "source": { "selector": ".error-text" },
  "expected": "kebab-case",
  "comparator": "contains"
}
```

### Required Field Error

**Expected message**:
```
This field is required
```

**Acceptable variations**:
- "[Field name] is required"
- "Required"
- "Please fill in this field"

**Assertion**:
```json
{
  "type": "textContains",
  "source": { "selector": ".error-text" },
  "expected": "required",
  "comparator": "contains"
}
```

---

## State Key Conventions

Common state keys across scenarios:

| State Key | Type | Meaning |
|-----------|------|---------|
| `browserOpened` | boolean | Chromium launched and ready |
| `pageLoaded` | boolean | Test harness HTML loaded |
| `formVisible` | boolean | Config form is visible in DOM |
| `formFocused` | boolean | Form or input field has focus |
| `formValid` | boolean | All form validations pass |
| `formDirty` | boolean | Form has been modified (optional) |
| `formSubmitted` | boolean | Form was submitted (clicked save) |
| `configLoaded` | boolean | Config data loaded into form |
| `configSaved` | boolean | Config persisted to disk |
| `listPopulated` | boolean | Config list has items |
| `listItemSelected` | boolean | Item clicked in list |

**Rule**: Document state keys as UI is built; update this contract with actual keys.

---

## Edge Case Assertions

### Edge Case 1: Rapid Field Changes

**Assertion**: Save button visibility updates immediately (no debounce lag)

```json
{
  "type": "visible",
  "source": { "selector": ".save-btn" },
  "expected": true,
  "comparator": "equals"
}
```

After rapidly typing "my-config", button should appear (not be delayed).

---

### Edge Case 2: Multiple List Selections

**Assertion**: Form resets to correct config after selection switch

First selection → form shows config A:
```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "config-a",
  "comparator": "equals"
}
```

Click config B in list → form updates:
```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "config-b",
  "comparator": "equals"
}
```

Click config A again → form reflects original (not stale):
```json
{
  "type": "textEquals",
  "source": { "selector": "#name-input" },
  "expected": "config-a",
  "comparator": "equals"
}
```

---

### Edge Case 3: Empty List State

**Assertion**: Message shown when no configs exist

```json
{
  "type": "textContains",
  "source": { "selector": ".config-list" },
  "expected": "No configurations found",
  "comparator": "contains"
}
```

---

## CSS Pseudo-Classes for Complex Selectors

When stable IDs/classes unavailable, use CSS pseudo-classes:

| Pattern | Example | Use Case |
|---------|---------|----------|
| `:first-child` | `.config-list-item:first-child` | Select first item in list |
| `:nth-child(n)` | `.config-list-item:nth-child(2)` | Select item by position (⚠️ fragile) |
| `:has()` | `.config-list-item:has(:contains("example"))` | Select by child content (modern browsers) |
| `[attr="value"]` | `button[data-test="save-button"]` | Select by attribute |
| `:disabled` | `button:disabled` | Select disabled buttons |
| `:focus` | `input:focus` | Select focused input |

**Recommendation**: Prefer stable selectors (ID, data-test attributes) over pseudo-classes.

---

## Assertion Troubleshooting

### Common Assertion Failures

| Failure | Likely Cause | Fix |
|---------|--------------|-----|
| `visible=true expected, got false` | Element hidden by CSS or not in DOM | Check selector, check CSS display property |
| `textContains failed: expected X found Y` | Text doesn't match (case-sensitive) | Update assertion text, verify actual output |
| `textEquals: expected "my-config" found "MY-CONFIG"` | Input auto-transformed (uppercase) | Update assertion or check form logic |
| `Selector not found` | CSS selector doesn't match | Verify selector in browser dev tools |
| `Timeout waiting for visible` | Element slow to render | Add wait/retry logic; check network |

---

## References

- **Test Scenarios Contract**: [test-scenarios.md](./test-scenarios.md)
- **Data Model**: [../data-model.md](../data-model.md)
- **Quickstart**: [../quickstart.md](../quickstart.md)
- **E2E Framework**: [../../../docs/testing/ui-e2e.md](../../../docs/testing/ui-e2e.md)
