import { evaluateStepAssertions } from "./assertions";
import { executeStepAction } from "./commands";
import { DebugSession } from "./debugSession";
import { logDebugAssertion, logDebugInfo, logDebugStep } from "./debugOutput";
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

export async function runDebugScenarios(
    scenarios: UiE2ETestCase[],
    options: {
        manualStep: boolean;
        continueOnFail: boolean;
        fixturePath?: string;
    }
): Promise<UiE2EResult[]> {
    const results: UiE2EResult[] = [];
    const debugSession = new DebugSession(options.manualStep);

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

        logDebugInfo(`Starting debug scenario: ${scenario.id}`);

        try {
            for (const step of scenario.steps) {
                logDebugStep(step, "beforeAction");
                stepEvents.push(createStepEvent(step.index, "beforeAction", { actionType: step.actionType }));

                if (await debugSession.shouldPause(step, "before")) {
                    stepEvents.push(createStepEvent(step.index, "pause", { phase: "before" }));
                    await debugSession.waitForContinue(step, "before");
                    stepEvents.push(createStepEvent(step.index, "resume", { phase: "before" }));
                }

                await executeStepAction(step, {
                    driver,
                    state,
                    debug: true
                });
                stepEvents.push(createStepEvent(step.index, "afterAction", { actionType: step.actionType }));

                const assertionOutcomes = await evaluateStepAssertions(step, { driver, state });
                for (const outcome of assertionOutcomes) {
                    logDebugAssertion(outcome.message);
                    if (outcome.passed) {
                        passedAssertions += 1;
                    } else {
                        failedAssertions += 1;
                        diagnostics.push(outcome.message);
                    }
                }
                stepEvents.push(createStepEvent(step.index, "afterAssert", { assertionOutcomes }));

                if (await debugSession.shouldPause(step, "after")) {
                    stepEvents.push(createStepEvent(step.index, "pause", { phase: "after" }));
                    await debugSession.waitForContinue(step, "after");
                    stepEvents.push(createStepEvent(step.index, "resume", { phase: "after" }));
                }

                if (assertionOutcomes.some((outcome) => !outcome.passed)) {
                    failedStepIndex = step.index;
                    if (!options.continueOnFail) {
                        break;
                    }
                }
            }
        } finally {
            await driver.close();
        }

        results.push({
            testCaseId: scenario.id,
            status: failedAssertions > 0 ? "failed" : "passed",
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
