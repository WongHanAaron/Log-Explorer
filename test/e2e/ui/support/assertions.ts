import { UiE2EAssertionOutcome, UiE2EStep } from "./types";
import { WebviewDriver } from "./webviewDriver";

export interface AssertionExecutionContext {
    driver: WebviewDriver;
    state: Record<string, unknown>;
}

function compareEquals(actual: unknown, expected: unknown): boolean {
    return actual === expected;
}

export async function evaluateStepAssertions(
    step: UiE2EStep,
    ctx: AssertionExecutionContext
): Promise<UiE2EAssertionOutcome[]> {
    const outcomes: UiE2EAssertionOutcome[] = [];

    for (const assertion of step.expectedOutputs) {
        switch (assertion.type) {
            case "visible": {
                const selector = assertion.source.selector ?? "";
                const actual = await ctx.driver.isVisible(selector);
                const passed = compareEquals(actual, assertion.expected);
                outcomes.push({
                    passed,
                    message: passed
                        ? `visible assertion passed for selector ${selector}`
                        : `visible assertion failed for selector ${selector}: expected=${String(assertion.expected)} actual=${String(actual)}`
                });
                break;
            }
            case "notVisible": {
                const selector = assertion.source.selector ?? "";
                const actual = await ctx.driver.isVisible(selector);
                const passed = compareEquals(actual, false);
                outcomes.push({
                    passed,
                    message: passed
                        ? `notVisible assertion passed for selector ${selector}`
                        : `notVisible assertion failed for selector ${selector}: element is visible`
                });
                break;
            }
            case "textEquals": {
                const selector = assertion.source.selector ?? "";
                const actual = await ctx.driver.textContent(selector);
                const passed = compareEquals(actual.trim(), String(assertion.expected).trim());
                outcomes.push({
                    passed,
                    message: passed
                        ? `textEquals assertion passed for selector ${selector}`
                        : `textEquals assertion failed for selector ${selector}: expected='${String(assertion.expected)}' actual='${actual}'`
                });
                break;
            }
            case "textContains": {
                const selector = assertion.source.selector ?? "";
                const actual = await ctx.driver.textContent(selector);
                const expected = String(assertion.expected);
                const passed = actual.includes(expected);
                outcomes.push({
                    passed,
                    message: passed
                        ? `textContains assertion passed for selector ${selector}`
                        : `textContains assertion failed for selector ${selector}: expected substring='${expected}' actual='${actual}'`
                });
                break;
            }
            case "state": {
                const key = assertion.source.stateKey ?? "";
                const actual = ctx.state[key];
                const passed = compareEquals(actual, assertion.expected);
                outcomes.push({
                    passed,
                    message: passed
                        ? `state assertion passed for key ${key}`
                        : `state assertion failed for key ${key}: expected='${String(assertion.expected)}' actual='${String(actual)}'`
                });
                break;
            }
            default:
                outcomes.push({ passed: false, message: `Unsupported assertion type: ${String(assertion.type)}` });
                break;
        }
    }

    return outcomes;
}
