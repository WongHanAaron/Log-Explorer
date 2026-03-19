import { expect } from "chai";

import { runScenarioSet } from "../support/runner";

describe("ui-e2e panel-webview messageflow integration", () => {
    it("runs canonical bidirectional messageflow scenario", async () => {
        const result = await runScenarioSet({
            mode: "run",
            profile: "panel-webview-integrated",
            scenario: "panel-webview-messageflow",
            fixture: "default-workspace"
        });

        expect(result.exitCode).to.equal(0);
        expect(result.runResult.results[0].status).to.equal("passed");
    });
});
