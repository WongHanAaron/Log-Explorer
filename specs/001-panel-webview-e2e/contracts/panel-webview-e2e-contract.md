# Contract: Canonical Panel-Webview E2E Interface

## Purpose

Define the canonical contract for rewritten panel+webview integrated e2e execution using an in-process abstracted host runtime.

## 1. In-Process Host Runtime Interface

```ts
export interface HostRuntime {
  openPanel(input: { panelType: string; fixturePath: string; initialState?: Record<string, unknown> }): Promise<{ sessionId: string }>;
  executeCommand(input: { sessionId: string; command: string; args?: unknown[] }): Promise<{ success: boolean; details: Record<string, unknown> }>;
  sendWebviewMessage(input: { sessionId: string; message: { type: string; [k: string]: unknown } }): Promise<void>;
  waitForMessage(input: { sessionId: string; type: string; timeoutMs: number }): Promise<{ type: string; payload: unknown }>;
  getTrace(input: { sessionId: string }): Promise<Array<{ ordinal: number; direction: string; type: string; payload: unknown; timestamp: string }>>;
  disposePanel(input: { sessionId: string }): Promise<void>;
}
```

Runtime rules:
- deterministic ordering for all emitted trace events
- explicit errors for unsupported commands and message types
- isolated session state per scenario

Debug execution rule:
- interactive debug runs must execute in headed browser mode so each automated action is visible

## 2. Canonical Scenario Contract

Required top-level fields:
- `schemaVersion` must be `2.0`
- `scenarioId`, `name`, `priority`, `steps`, `preconditions`

Required step fields:
- `index`
- `action`
- `assertions` (one or more)

Canonical action categories:
- `panel.open`
- `panel.dispose`
- `command.execute`
- `webview.interact`
- `message.send`
- `message.wait`

## 3. Canonical Assertion Contract

Supported assertion families:
- host outcome assertions
- message trace assertions
- webview visibility/text assertions
- filesystem assertions

Rule:
- every step must include at least one assertion mapped to expected outcome.

## 4. File Access Message Contract

Webview to host:
- `ready`
- `selectConfig`
- `fileaccess-config:validate-name`
- `fileaccess-config:save`
- `fileaccess-config:delete`
- `fileaccess-config:cancel`

Host to webview:
- `init`
- `configListChanged`
- `configData`
- `fileaccess-config:name-available`
- `fileaccess-config:save-result`

Validation:
- all messages require explicit `type`
- unknown message type is a contract error and must be reported in artifacts

## 5. Canonical Artifacts

Required outputs per run:
- `summary.json`
- `events.json`
- `trace.json`
- `migration-report.json` (migration mode)

Required properties:
- scenario identity
- step assertion outcomes
- host runtime outcomes
- ordered message traces
- failure classification hints
