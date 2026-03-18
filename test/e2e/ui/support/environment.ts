import fs from "node:fs";
import path from "node:path";

import { UiE2EError } from "./errors";
import { UiE2EEnvironment } from "./types";

function getWorkspaceRoot(): string {
    return path.resolve(__dirname, "../../../..");
}

function getRunId(): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "T").replace("Z", "Z");
    const random = Math.random().toString(16).slice(2, 8);
    return `${timestamp}-${random}`;
}

export function ensureEnvironment(fixtureName = "default-workspace"): UiE2EEnvironment {
    const workspaceRoot = getWorkspaceRoot();
    const uiRoot = path.join(workspaceRoot, "test", "e2e", "ui");
    const fixturesRoot = path.join(uiRoot, "fixtures");
    const scenariosRoot = path.join(uiRoot, "scenarios");
    const artifactsRoot = path.join(uiRoot, "artifacts");
    const fixturePath = path.join(fixturesRoot, fixtureName);

    if (!fs.existsSync(fixturePath)) {
        throw new UiE2EError(
            "E2E_FIXTURE_MISSING",
            `Fixture not found: ${fixtureName}`,
            "Create the fixture directory or pass --workspace <fixture-name>.",
            { fixtureName, fixturePath }
        );
    }

    fs.mkdirSync(artifactsRoot, { recursive: true });

    return {
        workspaceRoot,
        fixturesRoot,
        artifactsRoot,
        scenariosRoot,
        runId: getRunId(),
        fixtureName,
        fixturePath
    };
}

export function ensureScenarioDirectoryExists(scenariosRoot: string): void {
    if (!fs.existsSync(scenariosRoot)) {
        throw new UiE2EError(
            "E2E_SCENARIO_NOT_FOUND",
            "Scenario directory is missing.",
            "Create test/e2e/ui/scenarios and add at least one scenario definition.",
            { scenariosRoot }
        );
    }
}
