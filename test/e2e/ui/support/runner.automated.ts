import { evaluateStepAssertions } from "./assertions";
import { executeStepAction } from "./commands";
import { UiE2EError } from "./errors";
import { UiE2EResult, UiE2EStepEvent, UiE2ETestCase } from "./types";
import { WebviewDriver } from "./webviewDriver";

function createStepEvent(stepIndex: number, phase: UiE2EStepEvent["phase"], detail: unknown): UiE2EStepEvent {
    return {
        timestamp: new Date().toISOString(),
        stepIndex,
        phase,
        detail
    };
}

export async function runAutomatedScenarios(
    scenarios: UiE2ETestCase[],
    options: {
        debug: boolean;
        continueOnFail: boolean;
        fixturePath?: string;
    }
): Promise<UiE2EResult[]> {
    const results: UiE2EResult[] = [];

    for (const scenario of scenarios) {
        const stepEvents: UiE2EStepEvent[] = [];
        const diagnostics: string[] = [];
        const driver = new WebviewDriver();
        const state: Record<string, unknown> = {
            fixturePath: options.fixturePath
        };
        let failedStepIndex: number | undefined;
        let passedAssertions = 0;
        let failedAssertions = 0;

        try {
            for (const step of scenario.steps) {
                stepEvents.push(createStepEvent(step.index, "beforeAction", { actionType: step.actionType }));
                await executeStepAction(step, {
                    driver,
                    state,
                    debug: options.debug
                });
                stepEvents.push(createStepEvent(step.index, "afterAction", { actionType: step.actionType }));

                stepEvents.push(createStepEvent(step.index, "beforeAssert", { expectedCount: step.expectedOutputs.length }));
                const assertionOutcomes = await evaluateStepAssertions(step, { driver, state });
                for (const outcome of assertionOutcomes) {
                    if (outcome.passed) {
                        passedAssertions += 1;
                    } else {
                        failedAssertions += 1;
                        diagnostics.push(outcome.message);
                    }
                }
                stepEvents.push(createStepEvent(step.index, "afterAssert", { assertionOutcomes }));

                if (assertionOutcomes.some((outcome) => !outcome.passed)) {
                    failedStepIndex = step.index;
                    if (!options.continueOnFail) {
                        break;
                    }
                }
            }
        } catch (error) {
            const typed = error instanceof UiE2EError ? error : new UiE2EError("E2E_UNKNOWN", String(error), "Inspect logs");
            diagnostics.push(`${typed.code}: ${typed.message}`);
            failedAssertions += 1;
            if (!failedStepIndex) {
                failedStepIndex = scenario.steps[0]?.index;
            }
        } finally {
            await driver.close();
        }

        const hasFailure = failedAssertions > 0;

        results.push({
            testCaseId: scenario.id,
            status: hasFailure ? "failed" : "passed",
            failedStepIndex,
            assertionSummary: {
                passed: passedAssertions,
                failed: failedAssertions
            },
            diagnostics,
            stepEvents
        });
    }

    return results;
}
