import { expect } from "chai";

import { DebugSession } from "./debugSession";
import { UiE2EStep } from "./types";

describe("ui-e2e debug session", () => {
    it("pauses for manual step mode", async () => {
        const session = new DebugSession(true);
        const shouldPause = await session.shouldPause(
            {
                index: 1,
                actionType: "command",
                target: { command: "noop" },
                expectedOutputs: [
                    {
                        type: "state",
                        source: { stateKey: "x" },
                        expected: true
                    }
                ]
            },
            "before"
        );
        expect(shouldPause).to.equal(true);
    });

    it("respects pauseBefore and pauseAfter flags", async () => {
        const session = new DebugSession(false);
        const step: UiE2EStep = {
            index: 1,
            actionType: "command",
            target: { command: "noop" },
            pauseBefore: true,
            pauseAfter: true,
            expectedOutputs: [
                {
                    type: "state",
                    source: { stateKey: "x" },
                    expected: true
                }
            ]
        };

        expect(await session.shouldPause(step, "before")).to.equal(true);
        expect(await session.shouldPause(step, "after")).to.equal(true);
    });
});
