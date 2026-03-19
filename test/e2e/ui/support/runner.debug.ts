import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { evaluateStepAssertions } from "./assertions";
import { executeStepAction } from "./commands";
import { DebugSession } from "./debugSession";
import { logDebugAssertion, logDebugInfo, logDebugStep } from "./debugOutput";
import { InProcessHostRuntime } from "./hostRuntime";
import { UiE2EResult, UiE2EStepEvent, UiE2ETestCase } from "./types";
import { WebviewDriver } from "./webviewDriver";

const PANEL_BUNDLE_BY_TYPE: Record<string, string> = {
    "fileaccess-config": "file-access-configs",
    "file-access-configs": "file-access-configs",
    "new-session": "new-session",
    "log-file-sources": "log-file-sources",
    "getting-started": "getting-started",
    "log-details": "log-details",
    "log-file-lines": "log-file-lines",
    "search-results": "search-results",
    "session-templates": "session-templates",
    "session-tools": "session-tools"
};

function createStepEvent(stepIndex: number, phase: UiE2EStepEvent["phase"], detail: unknown): UiE2EStepEvent {
    return {
        timestamp: new Date().toISOString(),
        stepIndex,
        phase,
        detail
    };
}

function buildStandaloneWebviewHtml(bundleHref: string, cssHref: string | undefined, panelType: string): string {
    const panelTypeLiteral = JSON.stringify(panelType);
    const bundleLiteral = JSON.stringify(bundleHref);
    const cssTag = cssHref ? `    <link rel="stylesheet" href="${cssHref}" />` : "";

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UI E2E Debug - ${panelType}</title>
${cssTag}
</head>
<body>
    <div id="root"></div>
    <script>
        (function() {
            const posted = [];
            let state = {};

            function emitToWebview(message) {
                window.dispatchEvent(new MessageEvent("message", { data: message }));
            }

            const vscodeApi = {
                postMessage(message) {
                    posted.push(message);
                    if (message && message.type === "ready") {
                        setTimeout(() => {
                            emitToWebview({ type: "init", panelType: ${panelTypeLiteral} });
                            emitToWebview({ type: "configData", config: null });
                        }, 0);
                    }
                    if (message && message.type === "fileaccess-config:save") {
                        setTimeout(() => {
                            emitToWebview({ type: "fileaccess-config:save-result", success: true });
                        }, 0);
                    }
                    return true;
                },
                getState() {
                    return state;
                },
                setState(next) {
                    state = next;
                    return next;
                }
            };

            window.__debugPostedMessages = posted;
            window.acquireVsCodeApi = function() {
                return vscodeApi;
            };
        })();
    </script>
    <script type="module" src=${bundleLiteral}></script>
</body>
</html>`;
}

async function tryUiAction(action: () => Promise<void>): Promise<void> {
    try {
        const actionPromise = action().catch(() => undefined);
        const timeoutPromise = new Promise<void>((resolve) => {
            setTimeout(resolve, 1500);
        });
        await Promise.race([actionPromise, timeoutPromise]);
    } catch {
        // Best-effort UI interaction in debug mode.
    }
}

function resolveDebugWebviewUrl(panelType: string, fixturePath?: string): string {
    const workspaceRoot = process.cwd();
    const normalized = panelType.trim().toLowerCase();
    const bundleName = PANEL_BUNDLE_BY_TYPE[normalized] ?? normalized;
    const bundlePath = path.join(workspaceRoot, "dist", "webview", `${bundleName}.js`);

    if (fs.existsSync(bundlePath)) {
        const debugRoot = path.join(workspaceRoot, "test", "e2e", "ui", "artifacts", ".debug-webview");
        fs.mkdirSync(debugRoot, { recursive: true });

        const bundleHref = pathToFileURL(bundlePath).href;
        const sharedCssPath = path.join(workspaceRoot, "dist", "webview", "shared.css");
        const cssHref = fs.existsSync(sharedCssPath) ? pathToFileURL(sharedCssPath).href : undefined;
        const htmlPath = path.join(debugRoot, `${bundleName}.debug.html`);
        fs.writeFileSync(htmlPath, buildStandaloneWebviewHtml(bundleHref, cssHref, panelType), "utf8");
        return pathToFileURL(htmlPath).href;
    }

    if (fixturePath) {
        const fallbackPath = path.join(fixturePath, "ui", "debug-harness.html");
        if (fs.existsSync(fallbackPath)) {
            return pathToFileURL(fallbackPath).href;
        }
    }

    return "about:blank";
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
        const hostRuntime = new InProcessHostRuntime();
        const state: Record<string, unknown> = {
            fixturePath: options.fixturePath
        };
        let failedStepIndex: number | undefined;
        let passedAssertions = 0;
        let failedAssertions = 0;

        logDebugInfo(`Starting debug scenario: ${scenario.id}`);

        try {
            await driver.openBrowser(false, 250);
            state.browserOpened = true;

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
                    debug: true,
                    onCommand: async (command, currentStep) => {
                        if (command === "panel.open") {
                            const panelType = String((currentStep.input as Record<string, unknown> | undefined)?.panelType ?? "fileaccess-config");
                            const opened = await hostRuntime.openPanel({
                                panelType,
                                fixturePath: String(state.fixturePath ?? "")
                            });
                            state.hostSessionId = opened.sessionId;
                            state.panelOpened = true;
                            const webviewUrl = resolveDebugWebviewUrl(panelType, String(state.fixturePath ?? ""));
                            await driver.goto(webviewUrl);
                            state.activeWebviewUrl = webviewUrl;
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

                            if (String(message.type) === "fileaccess-config:save") {
                                await tryUiAction(async () => {
                                    await driver.input("#shortName", "debug-config");
                                    await driver.click("text=Save");
                                });
                            }

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
