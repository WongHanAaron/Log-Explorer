import { expect } from "chai";
import fs from "node:fs";
import path from "node:path";

import { runScenarioSet } from "../support/runner";

describe("ui-e2e canonical CI artifacts", () => {
    it("writes summary and trace artifacts for canonical run", async () => {
        const result = await runScenarioSet({
            mode: "run",
            profile: "panel-webview-integrated",
            scenario: "panel-webview-lifecycle",
            fixture: "default-workspace"
        });

        expect(result.exitCode).to.equal(0);

        const runId = result.runResult.runId;
        const basePath = path.join(
            process.cwd(),
            "test",
            "e2e",
            "ui",
            "artifacts",
            "panel-webview-lifecycle",
            runId
        );

        expect(fs.existsSync(path.join(basePath, "summary.json"))).to.equal(true);
        expect(fs.existsSync(path.join(basePath, "trace.json"))).to.equal(true);
        expect(fs.existsSync(path.join(basePath, "events.json"))).to.equal(true);
    });
});
