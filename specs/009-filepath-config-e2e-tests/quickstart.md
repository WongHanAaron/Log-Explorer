# Quickstart: Writing & Running Filepath Config E2E Tests

**Date**: 2026-03-18  
**Feature**: 009-filepath-config-e2e-tests  

This guide explains how to run existing filepath-config E2E tests, write new ones, and debug failures.

---

## Prerequisites

1. **Node.js 18+** and dependencies installed:
   ```bash
   npm install
   npm run typecheck:tests
   ```

2. **Playwright installed**:
   ```bash
   npx playwright install chromium
   ```

3. **Test fixture set up** — Default fixture exists at:
   ```
   test/e2e/ui/fixtures/default-workspace/
   ```

---

## Running Tests

### All Tests (Automated Mode)

```bash
npm run test:e2e:ui
```

Output:
```
✓ filepath-config-validate-kebab-case (2.3s)
✓ filepath-config-save-button-visibility (2.8s)
✓ filepath-config-save-to-file (2.5s)
✓ filepath-config-load-from-list (2.6s)

4 passed in 10.2s
```

### Filter by Scenario Name

```bash
npm run test:e2e:ui:grep -- --grep "saved-button"
```

Runs only scenarios with "saved-button" in the ID.

### Single Scenario (Debug Mode)

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-validate-kebab-case" --step
```

**What happens**:
- Chromium launches *visibly* (not headless)
- Each step pauses and waits for Enter before continuing
- You can inspect the browser state between steps
- Useful for developing and troubleshooting

### Debug Without Step Pauses

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-validate-kebab-case"
```

Chromium visible, but runs through all steps without pausing.

### Continue After Failures

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-validate-kebab-case" --continue-on-fail
```

If an assertion fails, the runner continues to capture the full timeline.

---

## Artifact Output

After each run, results are saved to:

```text
test/e2e/ui/artifacts/
└── filepath-config-validate-kebab-case/
    └── <timestamp>/
        ├── result.json           # Pass/fail, timing, error details
        ├── events.json           # Detailed step-by-step timeline
        └── replay-manifest.json  # References for replay tools
```

### Reading result.json

```json
{
  "mode": "automated",
  "scenarios": [
    {
      "id": "filepath-config-validate-kebab-case",
      "pass": true,
      "duration": 2340,
      "steps": [
        { "index": 1, "pass": true, "description": "openBrowser" },
        { "index": 2, "pass": true, "description": "goto" },
        ...
      ]
    }
  ]
}
```

**Key fields**:
- `pass`: Did scenario pass all assertions?
- `duration`: Total time in milliseconds
- `steps[].pass`: Did this step's assertions all pass?

### Troubleshooting via Artifacts

**Symptom**: Test fails at step 5  
**Action**: Open `events.json`, search for `"index": 5`  
**Details**: Shows exact assertion payload, expected vs. actual values

---

## Writing a New Test Scenario

### 1. Create Scenario File

Create `test/e2e/ui/scenarios/filepath-config-{my-feature}.e2e.json`:

```json
{
  "id": "filepath-config-my-feature",
  "name": "Filepath config — my feature test",
  "priority": "P1",
  "tags": ["e2e", "filepath-config", "smoke"],
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

### 2. Add Your Test Steps

For each action, include:
- `actionType`: One of `openBrowser`, `goto`, `click`, `type`, `clear`, `fill`
- `target`: Parameters specific to that action
- `expectedOutputs`: Array of assertions to verify after the action

### 3. Common Step Patterns

#### Clicking an Element

```json
{
  "index": 3,
  "actionType": "click",
  "target": { "selector": "#name-input" },
  "expectedOutputs": [
    {
      "type": "state",
      "source": { "stateKey": "formFocused" },
      "expected": true,
      "comparator": "equals"
    }
  ]
}
```

#### Typing into an Input

```json
{
  "index": 4,
  "actionType": "type",
  "target": {
    "selector": "#name-input",
    "text": "my-config"
  },
  "expectedOutputs": [
    {
      "type": "textEquals",
      "source": { "selector": "#name-input" },
      "expected": "my-config",
      "comparator": "equals"
    }
  ]
}
```

#### Verifying Visibility

```json
{
  "index": 5,
  "actionType": "goto",
  "target": { "url": "file://{{fixturePath}}/ui/debug-harness.html" },
  "expectedOutputs": [
    {
      "type": "visible",
      "source": { "selector": ".save-btn" },
      "expected": true,
      "comparator": "equals"
    }
  ]
}
```

#### Verifying Text Content

```json
{
  "index": 6,
  "actionType": "click",
  "target": { "selector": "#load-config" },
  "expectedOutputs": [
    {
      "type": "textContains",
      "source": { "selector": ".error-message" },
      "expected": "must be kebab-case",
      "comparator": "contains"
    }
  ]
}
```

### 4. Test Locally in Debug Mode

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-my-feature" --step
```

Watch the browser interact with your UI. If an assertion fails:
- Check the error output
- Verify your CSS selectors exist in the DOM
- Adjust selector or assertion text

### 5. Run in Automated Mode

```bash
npm run test:e2e:ui:grep -- --grep "my-feature"
```

Check `result.json` in artifacts. If still failing:
- Run in debug mode again with `--continue-on-fail`
- Review `events.json` for detailed timing

---

## Common CSS Selectors (Filepath Config UI)

**Reference**: Update these as you develop the actual UI. These are *examples*:

```javascript
// Input fields
"#name-input"              // Config name input
"#path-input"              // Path pattern input

// Buttons
".save-btn"                // Save/Submit button
".delete-btn"              // Delete button
".clear-btn"               // Clear/Reset button

// Lists
".config-list"             // List container
".config-list-item"        // Individual config row
".config-list-item:first-child"  // First item

// Messages
".error-text"              // Error message DOM
".validation-error"        // Validation error container
".success-message"         // Success confirmation (if present)

// State indicators
".form-invalid"            // CSS class on invalid form
"[aria-invalid='true']"    // Semantic attribute on invalid input
"[aria-label]"             // Accessible button labels
```

**Important**: Document actual selectors in `contracts/test-selectors.md` once UI is built.

---

## Debugging Failed Tests

### Scenario: Test timeouts

**Symptom**: `Timeout waiting for visible element`

**Fix**:
1. Check selector exists: Open browser dev tools in debug mode
2. Verify selector in console: `document.querySelector("#my-selector")`
3. If missing, update selector in scenario
4. If found, may be hidden — verify `display !== 'none'`

### Scenario: Assertion mismatch

**Symptom**: `Expected "my-config", got "MY-CONFIG"`

**Fix**:
1. Check input value after typing: use `textEquals` not `textContains`
2. Verify no auto-transformation (uppercase/lowercase) is happening
3. If transformation expected, update assertion to match actual behavior

### Scenario: File verification fails

**Symptom**: `File not found at .logex/filepath-configs/test-config.json`

**Fix**:
1. Verify file was actually created (check via file explorer)
2. Verify save button was clicked and form was valid
3. Check for file system errors in console output
4. If configs should be cleaned up, verify cleanup step exists and succeeds

### Scenario: List loading fails

**Symptom**: `Config list empty; expected "example-config"`

**Fix**:
1. Verify fixture has `example-config.json` in `.logex/filepath-configs/`
2. Check JSON structure matches expected format
3. Verify list is reading from correct directory
4. Check console for file read errors

---

## Best Practices

1. **One assertion per step when possible** — Easier to debug which assertion failed
2. **Name IDs descriptively** — `filepath-config-save-new-config` better than `test5`
3. **Include pauseAfter for critical steps** — Useful when developing:
   ```json
   "pauseAfter": true
   ```
4. **Clean up test files** — Include delete steps or pre-run cleanup
5. **Use fixture preconditions** — Always include `"preconditions": ["fixture:default-workspace"]`
6. **Document selectors** — Update `contracts/test-selectors.md` when UI changes
7. **Keep tests independent** — No test should depend on another test running first
8. **Target <3s per test** — If a test exceeds 5 seconds, profile and optimize

---

## Anatomy of a Complete Scenario

Here's a minimal working example:

```json
{
  "id": "filepath-config-minimal",
  "name": "Minimal test",
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
    },
    {
      "index": 3,
      "actionType": "click",
      "target": { "selector": ".open-config-btn" },
      "expectedOutputs": [
        {
          "type": "visible",
          "source": { "selector": "#config-form" },
          "expected": true,
          "comparator": "equals"
        }
      ]
    }
  ]
}
```

---

## Next Steps

1. **Review existing scenarios** — Study `test/e2e/ui/scenarios/filepath-config*.json` files
2. **Understand contracts** — Read `contracts/test-scenarios.md` and `contracts/test-assertions.md`
3. **Run existing tests** — Execute `npm run test:e2e:ui` to verify setup
4. **Write your own** — Create a new scenario following patterns above
5. **Iterate in debug mode** — Use `--step` flag while developing

---

## Reference

- **E2E Framework Guide**: [docs/testing/ui-e2e.md](../../docs/testing/ui-e2e.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Test Contracts**: [contracts/](./contracts/)
- **Research**: [research.md](./research.md)
