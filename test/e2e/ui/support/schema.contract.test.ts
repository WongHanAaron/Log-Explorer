import { expect } from "chai";

import { UiE2EError } from "./errors";
import { validateScenario } from "./schema";

describe("ui-e2e schema contract", () => {
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
});
