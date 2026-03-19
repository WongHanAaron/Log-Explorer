import fs from "node:fs";

import { UiE2EError } from "./errors";
import { CanonicalAssertion, CanonicalScenario, UiE2EAssertion, UiE2EActionType, UiE2ETestCase } from "./types";

const VALID_ACTION_TYPES = new Set<UiE2EActionType>([
    "openBrowser",
    "goto",
    "click",
    "input",
    "waitForSelector",
    "command",
    "pause"
]);

function assertCondition(condition: boolean, message: string, context?: Record<string, unknown>): void {
    if (!condition) {
        throw new UiE2EError("E2E_SCHEMA_INVALID", message, "Fix scenario JSON schema violations.", context);
    }
}

function validateAssertion(assertion: UiE2EAssertion, stepIndex: number): void {
    assertCondition(Boolean(assertion.type), "Assertion type is required.", { stepIndex });
    assertCondition(assertion.source !== undefined, "Assertion source is required.", { stepIndex });
    assertCondition(assertion.expected !== undefined, "Assertion expected value is required.", { stepIndex });
}

const VALID_CANONICAL_ACTION_TYPES = new Set([
    "panel.open",
    "panel.dispose",
    "command.execute",
    "webview.interact",
    "message.send",
    "message.wait"
]);

function canonicalAssertionToLegacy(assertion: CanonicalAssertion): UiE2EAssertion {
    if (assertion.type === "webview.visible") {
        return {
            type: "visible",
            source: { selector: String(assertion.source?.selector ?? "") },
            expected: assertion.expected
        };
    }

    if (assertion.type === "webview.textContains") {
        return {
            type: "textContains",
            source: { selector: String(assertion.source?.selector ?? "") },
            expected: assertion.expected
        };
    }

    return {
        type: "state",
        source: { stateKey: String(assertion.source?.stateKey ?? assertion.type) },
        expected: assertion.expected
    };
}

function canonicalActionToLegacyAction(action: string): UiE2EActionType {
    switch (action) {
        case "panel.open":
        case "panel.dispose":
        case "command.execute":
        case "message.send":
        case "message.wait":
            return "command";
        case "webview.interact":
            return "click";
        default:
            return "command";
    }
}

function isCanonicalScenario(value: unknown): value is CanonicalScenario {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as Partial<CanonicalScenario>;
    return candidate.schemaVersion === "2.0" && typeof candidate.scenarioId === "string" && Array.isArray(candidate.steps);
}

function validateCanonicalScenario(value: CanonicalScenario): CanonicalScenario {
    assertCondition(value.schemaVersion === "2.0", "Canonical scenario schemaVersion must be 2.0.");
    assertCondition(typeof value.scenarioId === "string" && value.scenarioId.length > 0, "Canonical scenarioId is required.");
    assertCondition(Array.isArray(value.steps) && value.steps.length > 0, "Canonical scenario steps are required.");

    value.steps.forEach((step, index) => {
        const expectedIndex = index + 1;
        assertCondition(step.index === expectedIndex, "Canonical scenario steps must be contiguous starting at 1.", {
            expectedIndex,
            actualIndex: step.index
        });
        assertCondition(VALID_CANONICAL_ACTION_TYPES.has(step.action), "Unsupported canonical action.", {
            stepIndex: step.index,
            action: step.action
        });
        assertCondition(Array.isArray(step.assertions) && step.assertions.length > 0, "Each canonical step needs assertions.", {
            stepIndex: step.index
        });
    });

    return value;
}

function convertCanonicalScenario(canonical: CanonicalScenario): UiE2ETestCase {
    return {
        id: canonical.scenarioId,
        name: canonical.name,
        priority: canonical.priority,
        tags: canonical.tags,
        preconditions: canonical.preconditions,
        steps: canonical.steps.map((step) => ({
            index: step.index,
            actionType: canonicalActionToLegacyAction(step.action),
            target: step.action === "webview.interact"
                ? { selector: String(step.target?.selector ?? "") }
                : {
                    command: step.action,
                    stateKey: String(step.target?.stateKey ?? "lastCanonicalAction")
                },
            input: step.input ?? step.target,
            expectedOutputs: step.assertions.map((assertion) => canonicalAssertionToLegacy(assertion)),
            timeoutMs: step.timeoutMs
        }))
    };
}

export function validateScenario(value: unknown): UiE2ETestCase {
    if (isCanonicalScenario(value)) {
        return convertCanonicalScenario(validateCanonicalScenario(value));
    }

    assertCondition(typeof value === "object" && value !== null, "Scenario must be a JSON object.");
    const scenario = value as UiE2ETestCase;

    assertCondition(typeof scenario.id === "string" && scenario.id.length > 0, "Scenario id is required.");
    assertCondition(typeof scenario.name === "string" && scenario.name.length > 0, "Scenario name is required.");
    assertCondition(Array.isArray(scenario.steps) && scenario.steps.length > 0, "Scenario steps are required.");

    scenario.steps.forEach((step, index) => {
        const expectedIndex = index + 1;
        assertCondition(step.index === expectedIndex, "Scenario steps must be contiguous starting at 1.", {
            expectedIndex,
            actualIndex: step.index
        });
        assertCondition(VALID_ACTION_TYPES.has(step.actionType), "Unsupported actionType in scenario step.", {
            stepIndex: step.index,
            actionType: step.actionType
        });
        assertCondition(Array.isArray(step.expectedOutputs) && step.expectedOutputs.length > 0, "Each step needs expectedOutputs.", {
            stepIndex: step.index
        });
        step.expectedOutputs.forEach((assertion) => validateAssertion(assertion, step.index));
    });

    return scenario;
}

export function loadScenarioFile(filePath: string): UiE2ETestCase {
    const raw = fs.readFileSync(filePath, "utf8");
    return validateScenario(JSON.parse(raw));
}
