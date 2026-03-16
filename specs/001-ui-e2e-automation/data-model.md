# Data Model: UI E2E Automation and Replay

## Entity: E2ETestCase

- Description: Declarative definition of a UI E2E scenario.
- Fields:
  - `id` (string, required): Stable unique identifier.
  - `name` (string, required): Human-readable scenario title.
  - `priority` (enum: P1|P2|P3, required): Scenario priority.
  - `tags` (string[], optional): Filtering labels (feature, smoke, regression).
  - `preconditions` (string[], optional): Required environment assumptions.
  - `steps` (E2EInteractionStep[], required, min 1): Ordered actions/assertions.
  - `replayEnabled` (boolean, default true): Whether run artifacts must be replayable.
- Validation rules:
  - `id` is unique across scenarios.
  - `steps` must be strictly ordered and non-empty.
  - Each step must include at least one assertion target.

## Entity: E2EInteractionStep

- Description: One atomic user interaction and verification boundary.
- Fields:
  - `index` (number, required): 1-based step order.
  - `actionType` (enum, required): Click/input/command/open/wait/message/etc.
  - `target` (object, required): Selector or command target metadata.
  - `input` (object|string, optional): Data used by the action.
  - `expectedOutputs` (E2EAssertion[], required, min 1): Expected observable results.
  - `pauseBefore` (boolean, default false): Debug pause before action.
  - `pauseAfter` (boolean, default false): Debug pause after assertions.
  - `timeoutMs` (number, optional): Step-level timeout override.
- Validation rules:
  - `index` increments by 1 with no gaps.
  - `actionType` determines required `target` attributes.
  - `timeoutMs`, if supplied, must be > 0 and below global max.

## Entity: E2EAssertion

- Description: A single expected condition checked during a step.
- Fields:
  - `type` (enum, required): textEquals/textContains/visible/notVisible/state/message/file.
  - `source` (object, required): Where to observe state (UI node, extension event, artifact file).
  - `expected` (string|number|boolean|object, required): Expected value/shape.
  - `comparator` (enum, optional): equals/contains/regex/deepEqual/range.
  - `required` (boolean, default true): Whether failure is hard-fail.
- Validation rules:
  - `expected` type must match `type` semantics.
  - `regex` comparator requires a valid regex pattern.

## Entity: E2ETestRun

- Description: One execution of one or more test cases.
- Fields:
  - `runId` (string, required): Unique execution identifier.
  - `startedAt` (ISO datetime, required)
  - `endedAt` (ISO datetime, optional until completion)
  - `mode` (enum: automated|debug|replay, required)
  - `environment` (object, required): VS Code version, OS, workspace fixture.
  - `selectedCases` (string[], required): Case IDs included in run.
  - `results` (E2EResult[], required): Per-case result records.
  - `artifactPath` (string, required): Root path for replay/evidence output.
- Validation rules:
  - `endedAt` must be >= `startedAt` when present.
  - `selectedCases` must reference existing `E2ETestCase.id` values.

## Entity: E2EResult

- Description: Per-case execution outcome within a test run.
- Fields:
  - `testCaseId` (string, required)
  - `status` (enum: passed|failed|skipped|error, required)
  - `failedStepIndex` (number, optional)
  - `assertionSummary` (object, required): passed/failed counts.
  - `diagnostics` (string[], optional): Human-readable failure info.
  - `stepEvents` (E2EStepEvent[], required): Ordered timeline of step actions/assertions.
- Validation rules:
  - `failedStepIndex` required when `status` is failed.
  - `stepEvents` sorted by timestamp.

## Entity: E2EStepEvent

- Description: Timestamped event emitted during step execution.
- Fields:
  - `timestamp` (ISO datetime, required)
  - `stepIndex` (number, required)
  - `phase` (enum: beforeAction|afterAction|beforeAssert|afterAssert|pause|resume, required)
  - `detail` (object|string, required)
  - `snapshotRef` (string, optional): Path to screenshot/UI snapshot.
- Validation rules:
  - `stepIndex` must exist in the owning test case.
  - `snapshotRef` must point inside the run artifact root.

## Entity: ReplayArtifact

- Description: Persisted data package enabling manual replay of a completed run.
- Fields:
  - `runId` (string, required)
  - `manifestVersion` (string, required)
  - `scenarioRef` (string, required)
  - `eventsFile` (string, required)
  - `screenshotsDir` (string, optional)
  - `resultFile` (string, required)
  - `createdAt` (ISO datetime, required)
- Validation rules:
  - All referenced files must exist.
  - `manifestVersion` must match supported parser versions.

## Relationships

- One `E2ETestCase` has many `E2EInteractionStep`.
- One `E2EInteractionStep` has many `E2EAssertion`.
- One `E2ETestRun` has many `E2EResult`.
- One `E2EResult` has many `E2EStepEvent`.
- One `E2ETestRun` has one or more `ReplayArtifact` entries (one per scenario/case).

## State Transitions

- `E2ETestRun`: `queued -> running -> completed` or `queued -> running -> failed_to_start`.
- `E2EResult`: `pending -> running -> passed|failed|skipped|error`.
- Replay availability: `not_generated -> generated -> available` or `generated -> invalid` (corrupted/missing files).
