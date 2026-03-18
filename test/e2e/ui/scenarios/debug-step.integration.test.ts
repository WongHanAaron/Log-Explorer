import { expect } from "chai";

import { runDebugScenarios } from "../support/runner.debug";

describe("ui-e2e debug stepping integration", () => {
    it("emits pause and resume events for pauseBefore/pauseAfter", async () => {
        process.env.UI_E2E_NONINTERACTIVE = "1";

        const results = await runDebugScenarios(
            [
                {
                    id: "debug-step-check",
                    name: "Debug Step Check",
                    priority: "P2",
                    steps: [
                        {
                            index: 1,
                            actionType: "command",
                            target: { command: "set", stateKey: "ok" },
                            input: true,
                            pauseBefore: true,
                            pauseAfter: true,
                            expectedOutputs: [
                                {
                                    type: "state",
                                    source: { stateKey: "ok" },
                                    expected: true
                                }
                            ]
                        }
                    ]
                }
            ],
            {
                manualStep: false,
                continueOnFail: false,
                fixturePath: "."
            }
        );

        const events = results[0].stepEvents;
        const pauseEvents = events.filter((event) => event.phase === "pause");
        const resumeEvents = events.filter((event) => event.phase === "resume");

        expect(results[0].status).to.equal("passed");
        expect(pauseEvents.length).to.equal(2);
        expect(resumeEvents.length).to.equal(2);
    });
});
