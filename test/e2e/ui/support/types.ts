export type UiE2EMode = "run" | "grep" | "debug" | "replay";

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
