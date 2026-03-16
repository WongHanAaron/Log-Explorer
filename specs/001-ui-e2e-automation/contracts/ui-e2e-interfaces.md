# Contracts: UI E2E Automation Interfaces

## 1. Test Runner Command Contract

These commands form the user-facing interface for executing, debugging, and replaying UI E2E tests.

### 1.1 `test:e2e:ui`

- Purpose: Run automated UI E2E scenarios.
- Inputs:
  - `--grep <pattern>` (optional): Filter by scenario name/tag.
  - `--workspace <fixture>` (optional): Fixture selection.
- Output:
  - Process exit code `0` when all selected scenarios pass.
  - Non-zero exit code when any required assertion fails or setup fails.
  - Summary to stdout and structured result files in artifacts.

### 1.2 `test:e2e:ui:debug`

- Purpose: Run one or more scenarios with visible UI and step-through pauses.
- Inputs:
  - `--scenario <id|name>` (recommended for single-case debugging).
  - `--step` (optional): Pause at every step.
  - `--continue-on-fail` (optional): Continue timeline after failed assertion.
- Output:
  - Same result semantics as automated mode.
  - Additional step state emitted to debug channel/log.

### 1.3 `test:e2e:ui:replay`

- Purpose: Replay a prior run for manual inspection.
- Inputs:
  - `--run-id <runId>` (required)
  - `--scenario <id|name>` (optional when run includes multiple scenarios)
- Output:
  - Reconstructed timeline view from artifacts.
  - Error with actionable message when artifact set is missing/corrupt.

## 2. Scenario Definition Contract

Scenario files are stored under `test/e2e/ui/scenarios`.

```json
{
  "id": "filepath-config-smoke",
  "name": "Filepath config smoke",
  "priority": "P1",
  "tags": ["smoke", "config"],
  "replayEnabled": true,
  "preconditions": ["fixture:default-workspace"],
  "steps": [
    {
      "index": 1,
      "actionType": "command",
      "target": { "command": "logexplorer.editLogFileSourceConfig" },
      "expectedOutputs": [
        {
          "type": "visible",
          "source": { "selector": "[data-testid='logfile-config-form']" },
          "expected": true,
          "comparator": "equals"
        }
      ],
      "pauseAfter": true
    }
  ]
}
```

Validation rules:
- `id`, `name`, `steps` are required.
- `steps[].index` must be contiguous and unique.
- Each step must include at least one assertion in `expectedOutputs`.

## 3. Run Result Contract

Artifacts are generated under `test/e2e/ui/artifacts/<scenario>/<runId>/`.

### 3.1 `result.json`

```json
{
  "runId": "20260315T204512Z-abc123",
  "mode": "automated",
  "startedAt": "2026-03-15T20:45:12.001Z",
  "endedAt": "2026-03-15T20:47:20.112Z",
  "environment": {
    "os": "windows",
    "vscodeVersion": "1.99.0"
  },
  "results": [
    {
      "testCaseId": "filepath-config-smoke",
      "status": "passed",
      "assertionSummary": { "passed": 4, "failed": 0 },
      "failedStepIndex": null,
      "diagnostics": []
    }
  ]
}
```

### 3.2 `events.json`

```json
{
  "runId": "20260315T204512Z-abc123",
  "events": [
    {
      "timestamp": "2026-03-15T20:45:18.015Z",
      "stepIndex": 1,
      "phase": "afterAssert",
      "detail": { "assertion": "visible logfile-config-form", "status": "passed" },
      "snapshotRef": "snapshots/step-1-afterAssert.png"
    }
  ]
}
```

## 4. Replay Manifest Contract

`replay-manifest.json` must exist for replay-enabled runs.

```json
{
  "manifestVersion": "1.0",
  "runId": "20260315T204512Z-abc123",
  "scenarioRef": "filepath-config-smoke",
  "resultFile": "result.json",
  "eventsFile": "events.json",
  "screenshotsDir": "snapshots",
  "createdAt": "2026-03-15T20:47:20.130Z"
}
```

Replay validation:
- All manifest-referenced files exist.
- Event ordering is strictly timestamp ascending.
- Unknown `manifestVersion` values are rejected with compatibility guidance.

## 5. Error Contract

Any failure response MUST include:
- `code`: Stable machine-readable error code.
- `message`: Human-readable summary.
- `action`: Next-step guidance (for example: missing fixture, selector mismatch, corrupt artifact).
- `context`: Optional structured data (`scenarioId`, `stepIndex`, `selector`, `command`).
