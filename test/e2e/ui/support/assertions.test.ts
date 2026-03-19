import { expect } from "chai";

import { evaluateStepAssertions } from "./assertions";
import { UiE2EStep } from "./types";

class FakeDriver {
    public async isVisible(selector: string): Promise<boolean> {
        return selector === "#visible";
    }

    public async textContent(selector: string): Promise<string> {
        if (selector === "#status") {
            return "Config opened";
        }
        return "";
    }
}

describe("ui-e2e assertions", () => {
    it("evaluates visibility, text, and state assertions", async () => {
        const step: UiE2EStep = {
            index: 1,
            actionType: "command",
            target: { command: "noop" },
            expectedOutputs: [
                {
                    type: "visible",
                    source: { selector: "#visible" },
                    expected: true
                },
                {
                    type: "textContains",
                    source: { selector: "#status" },
                    expected: "opened"
                },
                {
                    type: "state",
                    source: { stateKey: "lastCommand" },
                    expected: "noop"
                }
            ]
        };

        const outcomes = await evaluateStepAssertions(step, {
            driver: new FakeDriver() as never,
            state: { lastCommand: "noop" }
        });

        expect(outcomes).to.have.length(3);
        expect(outcomes.every((outcome) => outcome.passed)).to.equal(true);
    });

    it("evaluates combined host and webview outcome assertions", async () => {
        const step: UiE2EStep = {
            index: 2,
            actionType: "command",
            target: { command: "message.send" },
            expectedOutputs: [
                {
                    type: "state",
                    source: { stateKey: "lastSentMessageType" },
                    expected: "fileaccess-config:save"
                },
                {
                    type: "state",
                    source: { stateKey: "lastReceivedMessageType" },
                    expected: "fileaccess-config:save-result"
                },
                {
                    type: "textEquals",
                    source: { selector: "#status" },
                    expected: "Config opened"
                }
            ]
        };

        const outcomes = await evaluateStepAssertions(step, {
            driver: new FakeDriver() as never,
            state: {
                lastSentMessageType: "fileaccess-config:save",
                lastReceivedMessageType: "fileaccess-config:save-result"
            }
        });

        expect(outcomes).to.have.length(3);
        expect(outcomes.every((outcome) => outcome.passed)).to.equal(true);
    });
});
