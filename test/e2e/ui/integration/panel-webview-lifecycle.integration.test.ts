import { expect } from "chai";

import { runScenarioSet } from "../support/runner";

describe("ui-e2e panel-webview lifecycle integration", () => {
    it("runs canonical lifecycle scenario using integrated profile", async () => {
        const result = await runScenarioSet({
            mode: "run",
            profile: "panel-webview-integrated",
            scenario: "panel-webview-lifecycle",
            fixture: "default-workspace"
        });

        expect(result.exitCode).to.equal(0);
        expect(result.runResult.results).to.have.length(1);
        expect(result.runResult.results[0].status).to.equal("passed");
    });
});
