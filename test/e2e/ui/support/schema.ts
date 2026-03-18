import fs from "node:fs";

import { UiE2EError } from "./errors";
import { UiE2EAssertion, UiE2EActionType, UiE2ETestCase } from "./types";

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

export function validateScenario(value: unknown): UiE2ETestCase {
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
