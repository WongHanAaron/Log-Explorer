import { expect } from "chai";

import { runScenarioSet } from "../support/runner";

describe("ui-e2e automated runner integration", () => {
    it("returns a passing result for state-only scenario", async () => {
        const result = await runScenarioSet({
            mode: "run",
            scenario: "state-only-smoke",
            fixture: "default-workspace"
        });

        expect(result.exitCode).to.equal(0);
        expect(result.runResult.results[0].status).to.equal("passed");
    });
});
