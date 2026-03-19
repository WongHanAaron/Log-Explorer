import fs from "node:fs";
import path from "node:path";

import { MigrationIssue, MigrationRecord } from "./types";

function toCanonicalScenario(raw: Record<string, unknown>): Record<string, unknown> {
    const id = String(raw.id ?? raw.scenarioId ?? "").trim();
    const steps = Array.isArray(raw.steps) ? raw.steps : [];

    return {
        schemaVersion: "2.0",
        scenarioId: id,
        name: String(raw.name ?? id),
        priority: raw.priority ?? "P2",
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        preconditions: Array.isArray(raw.preconditions) ? raw.preconditions : [],
        steps: steps.map((step: any, index) => ({
            index: Number(step.index ?? index + 1),
            action: step.action ?? (step.actionType === "command" ? "command.execute" : "webview.interact"),
            target: step.target ?? {},
            input: step.input,
            assertions: Array.isArray(step.assertions)
                ? step.assertions
                : (step.expectedOutputs ?? []).map((assertion: any) => ({
                    type: assertion.type === "state" ? "host.outcome" : `webview.${assertion.type}`,
                    source: assertion.source ?? {},
                    expected: assertion.expected
                }))
        }))
    };
}

function validateCanonicalPayload(payload: Record<string, unknown>): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    if (!payload.scenarioId) {
        issues.push({
            code: "MIGRATION_SCENARIO_ID_MISSING",
            severity: "error",
            fieldPath: "scenarioId",
            message: "Scenario id could not be resolved from legacy input.",
            suggestedFix: "Ensure legacy scenario has an id field."
        });
    }

    if (!Array.isArray(payload.steps) || payload.steps.length === 0) {
        issues.push({
            code: "MIGRATION_STEPS_MISSING",
            severity: "error",
            fieldPath: "steps",
            message: "Legacy scenario has no steps to migrate.",
            suggestedFix: "Add at least one scenario step."
        });
    }

    return issues;
}

export function runMigration(input: { sourceRoot: string; destinationRoot: string }): MigrationRecord[] {
    fs.mkdirSync(input.destinationRoot, { recursive: true });
    const files = fs.readdirSync(input.sourceRoot).filter((name) => name.endsWith(".json"));

    return files.map((name) => {
        const sourcePath = path.join(input.sourceRoot, name);
        const startedAt = new Date().toISOString();
        const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
        const canonical = toCanonicalScenario(raw);
        const issues = validateCanonicalPayload(canonical);
        const hasErrors = issues.some((issue) => issue.severity === "error");

        if (hasErrors) {
            return {
                legacyScenarioPath: sourcePath,
                status: "failed",
                issues,
                startedAt,
                endedAt: new Date().toISOString()
            };
        }

        const fileName = `${String(canonical.scenarioId)}.json`;
        const destinationPath = path.join(input.destinationRoot, fileName);
        fs.writeFileSync(destinationPath, `${JSON.stringify(canonical, null, 2)}\n`, "utf8");

        return {
            legacyScenarioPath: sourcePath,
            canonicalScenarioPath: destinationPath,
            status: "migrated",
            issues,
            startedAt,
            endedAt: new Date().toISOString()
        };
    });
}
