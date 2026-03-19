import { expect } from "chai";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runMigration } from "./migration";

describe("ui-e2e migration", () => {
    it("fails fast when legacy scenario is missing id", () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ui-e2e-migrate-"));
        const sourceRoot = path.join(tempRoot, "scenarios");
        const destinationRoot = path.join(tempRoot, "scenarios-canonical");
        fs.mkdirSync(sourceRoot, { recursive: true });

        fs.writeFileSync(
            path.join(sourceRoot, "missing-id.json"),
            JSON.stringify({ name: "Missing Id", steps: [{ index: 1, actionType: "command", expectedOutputs: [] }] }, null, 2),
            "utf8"
        );

        const records = runMigration({ sourceRoot, destinationRoot });

        expect(records).to.have.length(1);
        expect(records[0].status).to.equal("failed");
        expect(records[0].issues.some((issue) => issue.code === "MIGRATION_SCENARIO_ID_MISSING")).to.equal(true);
    });

    it("migrates valid legacy scenario to canonical format", () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ui-e2e-migrate-"));
        const sourceRoot = path.join(tempRoot, "scenarios");
        const destinationRoot = path.join(tempRoot, "scenarios-canonical");
        fs.mkdirSync(sourceRoot, { recursive: true });

        fs.writeFileSync(
            path.join(sourceRoot, "valid.json"),
            JSON.stringify(
                {
                    id: "legacy-valid",
                    name: "Legacy Valid",
                    priority: "P1",
                    steps: [
                        {
                            index: 1,
                            actionType: "command",
                            target: { command: "noop" },
                            expectedOutputs: [
                                {
                                    type: "state",
                                    source: { stateKey: "ok" },
                                    expected: true
                                }
                            ]
                        }
                    ]
                },
                null,
                2
            ),
            "utf8"
        );

        const records = runMigration({ sourceRoot, destinationRoot });

        expect(records).to.have.length(1);
        expect(records[0].status).to.equal("migrated");

        const migratedPath = path.join(destinationRoot, "legacy-valid.json");
        expect(fs.existsSync(migratedPath)).to.equal(true);
    });
});
