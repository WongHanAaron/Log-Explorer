import { expect } from "chai";
import Ajv from "ajv";
import canonicalScenarioSchema from "../templates/canonical-scenario.schema.json";

// Load the canonical schema for validation
const ajv = new Ajv();
const validateCanonical = ajv.compile(canonicalScenarioSchema);

describe("ui-e2e canonical schema validation", () => {
    it("rejects scenario without schemaVersion", () => {
        const invalid = {
            scenarioId: "test",
            name: "Test",
            priority: "P1",
            steps: []
        };

        const valid = validateCanonical(invalid);
        expect(valid).to.equal(false);
        expect(validateCanonical.errors).to.be.an("array");
        expect(validateCanonical.errors?.some((e) => e.keyword === "required")).to.equal(true);
    });

    it("rejects scenario without scenarioId", () => {
        const invalid = {
            schemaVersion: "2.0",
            name: "Test",
            priority: "P1",
            steps: []
        };

        const valid = validateCanonical(invalid);
        expect(valid).to.equal(false);
    });

    it("accepts valid canonical scenario", () => {
        const validScenario = {
            schemaVersion: "2.0",
            scenarioId: "valid-scenario",
            name: "Valid Scenario",
            priority: "P1",
            tags: ["test"],
            preconditions: ["fixture:default-workspace"],
            steps: [
                {
                    index: 1,
                    action: "command.execute",
                    target: { command: "setState" },
                    input: { stateKey: "ok" },
                    assertions: [
                        {
                            type: "host.outcome",
                            source: { stateKey: "ok" },
                            expected: true
                        }
                    ]
                }
            ]
        };

        const valid = validateCanonical(validScenario);
        expect(valid).to.equal(true);
    });

    it("enforces schemaVersion must be 2.0", () => {
        const invalidVersion = {
            schemaVersion: "1.0",
            scenarioId: "test",
            name: "Test",
            priority: "P1",
            steps: []
        };

        const valid = validateCanonical(invalidVersion);
        expect(valid).to.equal(false);
    });
});
