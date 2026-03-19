import { expect } from "chai";

import { UiE2EError } from "./errors";
import { validateScenario } from "./schema";

describe("ui-e2e schema contract", () => {
    it("accepts a valid canonical lifecycle scenario", () => {
        const scenario = validateScenario({
            schemaVersion: "2.0",
            scenarioId: "panel-webview-lifecycle",
            name: "Panel Webview Lifecycle",
            priority: "P1",
            steps: [
                {
                    index: 1,
                    action: "panel.open",
                    target: { panelType: "fileaccess-config" },
                    assertions: [
                        {
                            type: "host.outcome",
                            source: { stateKey: "panelOpened" },
                            expected: true
                        }
                    ]
                }
            ]
        });

        expect(scenario.id).to.equal("panel-webview-lifecycle");
        expect(scenario.steps[0].actionType).to.equal("command");
    });

    it("accepts a valid scenario", () => {
        const scenario = validateScenario({
            id: "valid-scenario",
            name: "Valid Scenario",
            priority: "P1",
            steps: [
                {
                    index: 1,
                    actionType: "command",
                    target: { command: "noop", stateKey: "ran" },
                    input: true,
                    expectedOutputs: [
                        {
                            type: "state",
                            source: { stateKey: "ran" },
                            expected: true
                        }
                    ]
                }
            ]
        });
        expect(scenario.id).to.equal("valid-scenario");
    });

    it("rejects non-contiguous steps", () => {
        expect(() =>
            validateScenario({
                id: "bad-scenario",
                name: "Bad Scenario",
                priority: "P1",
                steps: [
                    {
                        index: 2,
                        actionType: "command",
                        target: { command: "noop" },
                        expectedOutputs: [
                            {
                                type: "state",
                                source: { stateKey: "x" },
                                expected: true
                            }
                        ]
                    }
                ]
            })
        ).to.throw(UiE2EError);
    });

    it("rejects unsupported canonical action", () => {
        expect(() =>
            validateScenario({
                schemaVersion: "2.0",
                scenarioId: "bad-canonical",
                name: "Bad Canonical",
                priority: "P1",
                steps: [
                    {
                        index: 1,
                        action: "panel.reveal",
                        assertions: [
                            {
                                type: "host.outcome",
                                expected: true
                            }
                        ]
                    }
                ]
            })
        ).to.throw(UiE2EError);
    });
});
