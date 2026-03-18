import fs from "node:fs";
import path from "node:path";

import { UiE2EEnvironment, UiE2EResult, UiE2ERunResult, UiE2EStepEvent } from "./types";

export interface ArtifactWriteResult {
    runDir: string;
    resultFile: string;
    eventsFile: string;
    manifestFile: string;
}

function writeJson(filePath: string, value: unknown): void {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeRunArtifacts(
    env: UiE2EEnvironment,
    scenarioRef: string,
    runResult: UiE2ERunResult,
    events: UiE2EStepEvent[]
): ArtifactWriteResult {
    const runDir = path.join(env.artifactsRoot, scenarioRef, env.runId);
    fs.mkdirSync(runDir, { recursive: true });

    const resultFile = path.join(runDir, "result.json");
    const eventsFile = path.join(runDir, "events.json");
    const manifestFile = path.join(runDir, "replay-manifest.json");

    writeJson(resultFile, runResult);
    writeJson(eventsFile, { runId: env.runId, events });

    writeJson(manifestFile, {
        manifestVersion: "1.0",
        runId: env.runId,
        scenarioRef,
        resultFile: "result.json",
        eventsFile: "events.json",
        screenshotsDir: "snapshots",
        createdAt: new Date().toISOString()
    });

    return { runDir, resultFile, eventsFile, manifestFile };
}

export function collectEvents(results: UiE2EResult[]): UiE2EStepEvent[] {
    return results.flatMap((result) => result.stepEvents);
}
