export type UiE2EMode = "run" | "grep" | "debug" | "replay";

export type CanonicalTracePolicy = "minimal" | "full";

export type CanonicalActionType =
    | "panel.open"
    | "panel.dispose"
    | "command.execute"
    | "webview.interact"
    | "message.send"
    | "message.wait";

export interface CanonicalAssertion {
    type: string;
    source?: Record<string, unknown>;
    expected: unknown;
}

export interface CanonicalStep {
    index: number;
    action: CanonicalActionType;
    target?: Record<string, unknown>;
    input?: unknown;
    assertions: CanonicalAssertion[];
    timeoutMs?: number;
    tracePolicy?: CanonicalTracePolicy;
}

export interface CanonicalScenario {
    schemaVersion: "2.0";
    scenarioId: string;
    name: string;
    priority: UiE2EPriority;
    tags?: string[];
    preconditions?: string[];
    steps: CanonicalStep[];
}

export interface HostRuntime {
    openPanel(input: { panelType: string; fixturePath: string; initialState?: Record<string, unknown> }): Promise<{ sessionId: string }>;
    executeCommand(input: { sessionId: string; command: string; args?: unknown[] }): Promise<{ success: boolean; details: Record<string, unknown> }>;
    sendWebviewMessage(input: { sessionId: string; message: { type: string;[k: string]: unknown } }): Promise<void>;
    waitForMessage(input: { sessionId: string; type: string; timeoutMs: number }): Promise<{ type: string; payload: unknown }>;
    getTrace(input: { sessionId: string }): Promise<MessageTraceEvent[]>;
    disposePanel(input: { sessionId: string }): Promise<void>;
}

export interface HostRuntimeSession {
    sessionId: string;
    panelType: string;
    status: "created" | "initialized" | "ready" | "disposed" | "error";
    openedAt: string;
    disposedAt?: string;
    hostState: Record<string, unknown>;
    lastError?: string;
}

export interface MessageTraceEvent {
    ordinal: number;
    sessionId: string;
    direction: "webview_to_host" | "host_to_webview";
    type: string;
    payload: unknown;
    timestamp: string;
    accepted: boolean;
    errorCode?: string;
    errorMessage?: string;
}

export interface HostOutcome {
    sessionId: string;
    stepIndex: number;
    outcomeType: "panel_opened" | "message_handled" | "command_executed" | "validation_result" | "save_result" | "disposed" | "error";
    success: boolean;
    details: Record<string, unknown>;
    recordedAt: string;
}

export interface MigrationIssue {
    code: string;
    severity: "error" | "warning";
    fieldPath: string;
    message: string;
    suggestedFix?: string;
}

export interface MigrationRecord {
    legacyScenarioPath: string;
    canonicalScenarioPath?: string;
    status: "migrated" | "failed";
    issues: MigrationIssue[];
    startedAt: string;
    endedAt: string;
}

export type UiE2EPriority = "P1" | "P2" | "P3";

export type UiE2EActionType =
    | "openBrowser"
    | "goto"
    | "click"
    | "input"
    | "waitForSelector"
    | "command"
    | "pause";

export type UiE2EAssertionType =
    | "textEquals"
    | "textContains"
    | "visible"
    | "notVisible"
    | "state";

export interface UiE2EActionTarget {
    selector?: string;
    url?: string;
    command?: string;
    stateKey?: string;
}

export interface UiE2EAssertion {
    type: UiE2EAssertionType;
    source: {
        selector?: string;
        stateKey?: string;
    };
    expected: unknown;
    comparator?: "equals" | "contains";
    required?: boolean;
}

export interface UiE2EStep {
    index: number;
    actionType: UiE2EActionType;
    target: UiE2EActionTarget;
    input?: unknown;
    expectedOutputs: UiE2EAssertion[];
    pauseBefore?: boolean;
    pauseAfter?: boolean;
    timeoutMs?: number;
}

export interface UiE2ETestCase {
    id: string;
    name: string;
    priority: UiE2EPriority;
    tags?: string[];
    replayEnabled?: boolean;
    preconditions?: string[];
    steps: UiE2EStep[];
}

export interface UiE2EStepEvent {
    timestamp: string;
    stepIndex: number;
    phase: "beforeAction" | "afterAction" | "beforeAssert" | "afterAssert" | "pause" | "resume";
    detail: unknown;
    snapshotRef?: string;
}

export interface UiE2EResult {
    testCaseId: string;
    status: "passed" | "failed" | "skipped" | "error";
    failedStepIndex?: number;
    assertionSummary: {
        passed: number;
        failed: number;
    };
    diagnostics: string[];
    stepEvents: UiE2EStepEvent[];
}

export interface UiE2ERunResult {
    runId: string;
    mode: "automated" | "debug" | "replay";
    startedAt: string;
    endedAt: string;
    environment: {
        os: string;
        node: string;
        workspace: string;
        fixture: string;
    };
    results: UiE2EResult[];
}

export interface UiE2EEnvironment {
    workspaceRoot: string;
    fixturesRoot: string;
    artifactsRoot: string;
    scenariosRoot: string;
    runId: string;
    fixtureName: string;
    fixturePath: string;
}

export interface UiE2ERunnerOptions {
    mode: UiE2EMode;
    grep?: string;
    scenario?: string;
    fixture?: string;
    step?: boolean;
    continueOnFail?: boolean;
    profile?: string;
}

export interface UiE2EExecutionContext {
    state: Record<string, unknown>;
    debug: boolean;
    manualStep: boolean;
    continueOnFail: boolean;
}

export interface UiE2EAssertionOutcome {
    passed: boolean;
    message: string;
}
