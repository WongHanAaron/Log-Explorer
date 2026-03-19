# Data Model: Panel-Webview E2E Rewrite

## 1. CanonicalScenario

Represents one integrated scenario in the canonical rewritten schema.

Fields:
- `scenarioId: string` globally unique identifier
- `name: string`
- `priority: "P1" | "P2" | "P3"`
- `tags: string[]`
- `preconditions: string[]`
- `steps: CanonicalStep[]`
- `schemaVersion: "2.0"`

Validation rules:
- `scenarioId` required and unique across loaded scenarios
- `steps` non-empty with contiguous `index` values
- action and assertion names must belong to canonical enums

## 2. CanonicalStep

Represents one executable lifecycle or interaction step.

Fields:
- `index: number`
- `action: ScenarioAction`
- `assertions: ScenarioAssertion[]`
- `timeoutMs?: number`
- `tracePolicy?: "minimal" | "full"`

Action categories:
- panel lifecycle: open, reveal, dispose
- host command invocation
- webview interaction
- message send and wait checkpoints

Validation rules:
- at least one assertion per step
- action payload shape must match action type

## 3. HostRuntimeSession

Represents active state for one in-process host runtime session.

Fields:
- `sessionId: string`
- `panelType: string`
- `status: "created" | "initialized" | "ready" | "disposed" | "error"`
- `openedAt: string`
- `disposedAt?: string`
- `hostState: Record<string, unknown>`
- `lastError?: string`

State transitions:
- `created -> initialized -> ready`
- `ready -> disposed`
- any state may transition to `error`

## 4. MessageTraceEvent

Represents ordered directional message traffic captured during execution.

Fields:
- `ordinal: number` strict monotonic sequence per session
- `sessionId: string`
- `direction: "webview_to_host" | "host_to_webview"`
- `type: string`
- `payload: unknown`
- `timestamp: string`
- `accepted: boolean`
- `errorCode?: string`
- `errorMessage?: string`

Validation rules:
- no duplicate `ordinal` values per `sessionId`
- payload must be JSON-serializable

## 5. HostOutcome

Represents deterministic host-side outcomes asserted within scenarios.

Fields:
- `sessionId: string`
- `stepIndex: number`
- `outcomeType: "panel_opened" | "message_handled" | "command_executed" | "validation_result" | "save_result" | "disposed" | "error"`
- `success: boolean`
- `details: Record<string, unknown>`
- `recordedAt: string`

## 6. MigrationRecord

Represents one legacy-to-canonical migration result.

Fields:
- `legacyScenarioPath: string`
- `canonicalScenarioPath?: string`
- `status: "migrated" | "failed"`
- `issues: MigrationIssue[]`
- `startedAt: string`
- `endedAt: string`

Constraint:
- `failed` records must include at least one issue.

## 7. MigrationIssue

Represents strict validation diagnostics from migration.

Fields:
- `code: string`
- `severity: "error" | "warning"`
- `fieldPath: string`
- `message: string`
- `suggestedFix?: string`

Rule:
- any `error` severity causes immediate non-zero migration exit.

## 8. ArtifactEnvelope

Represents canonical artifact outputs for integrated runs.

Files:
- `summary.json`
- `events.json`
- `trace.json`
- `migration-report.json` (migration runs only)

Compatibility note:
- legacy artifact format remains historical input only after cutover.
