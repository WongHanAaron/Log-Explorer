import { evaluateStepAssertions } from "./assertions";
import { executeStepAction } from "./commands";
import { classifyFailureOrigin } from "./debugOutput";
import { UiE2EError } from "./errors";
import { InProcessHostRuntime } from "./hostRuntime";
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
        const hostRuntime = new InProcessHostRuntime();
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
                    debug: options.debug,
                    onCommand: async (command, currentStep) => {
                        if (command === "panel.open") {
                            const panelType = String((currentStep.input as Record<string, unknown> | undefined)?.panelType ?? "fileaccess-config");
                            const opened = await hostRuntime.openPanel({
                                panelType,
                                fixturePath: String(state.fixturePath ?? "")
                            });
                            state.hostSessionId = opened.sessionId;
                            state.panelOpened = true;
                            return;
                        }

                        const sessionId = String(state.hostSessionId ?? "");
                        if (!sessionId) {
                            return;
                        }

                        if (command === "panel.dispose") {
                            await hostRuntime.disposePanel({ sessionId });
                            state.panelOpened = false;
                            state.panelDisposed = true;
                            return;
                        }

                        if (command === "message.wait") {
                            const expectedType = String((currentStep.input as Record<string, unknown> | undefined)?.type ?? "init");
                            const message = await hostRuntime.waitForMessage({
                                sessionId,
                                type: expectedType,
                                timeoutMs: currentStep.timeoutMs ?? 5000
                            });
                            state.initMessageType = message.type;
                            state.lastReceivedMessageType = message.type;
                            state.lastMessagePayload = message.payload;
                            return;
                        }

                        if (command === "message.send") {
                            const message = (currentStep.input as Record<string, unknown> | undefined) ?? { type: "unknown" };
                            await hostRuntime.sendWebviewMessage({
                                sessionId,
                                message: {
                                    type: String(message.type ?? "unknown"),
                                    ...message
                                }
                            });
                            state.lastSentMessageType = String(message.type ?? "unknown");
                            return;
                        }

                        await hostRuntime.executeCommand({
                            sessionId,
                            command,
                            args: Array.isArray(currentStep.input) ? currentStep.input : [currentStep.input]
                        });
                    }
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
            let typed: UiE2EError;
            if (error instanceof UiE2EError) {
                typed = error;
            } else {
                const message = String(error);
                if (state.panelOpened && /timeout|timed out/i.test(message)) {
                    typed = new UiE2EError(
                        "E2E_INIT_TIMEOUT",
                        "Panel initialization timed out before expected state was observed.",
                        "Increase timeout or inspect host/webview initialization sequence.",
                        { message }
                    );
                } else {
                    typed = new UiE2EError(
                        "E2E_UNKNOWN",
                        message,
                        "Inspect logs"
                    );
                }
            }
            diagnostics.push(`${typed.code}: ${typed.message}`);
            diagnostics.push(`failure-origin=${classifyFailureOrigin(typed.message)}`);
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
