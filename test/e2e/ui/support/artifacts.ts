import fs from "node:fs";
import path from "node:path";

import { MigrationRecord, UiE2EEnvironment, UiE2EResult, UiE2ERunResult, UiE2EStepEvent } from "./types";

export interface ArtifactWriteResult {
    runDir: string;
    resultFile: string;
    eventsFile: string;
    manifestFile: string;
    summaryFile: string;
    traceFile: string;
    migrationReportFile?: string;
}

function writeJson(filePath: string, value: unknown): void {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeRunArtifacts(
    env: UiE2EEnvironment,
    scenarioRef: string,
    runResult: UiE2ERunResult,
    events: UiE2EStepEvent[],
    extras?: {
        migrationRecords?: MigrationRecord[];
    }
): ArtifactWriteResult {
    const runDir = path.join(env.artifactsRoot, scenarioRef, env.runId);
    fs.mkdirSync(runDir, { recursive: true });

    const resultFile = path.join(runDir, "result.json");
    const eventsFile = path.join(runDir, "events.json");
    const manifestFile = path.join(runDir, "replay-manifest.json");
    const summaryFile = path.join(runDir, "summary.json");
    const traceFile = path.join(runDir, "trace.json");
    const migrationReportFile = extras?.migrationRecords ? path.join(runDir, "migration-report.json") : undefined;

    writeJson(resultFile, runResult);
    writeJson(eventsFile, { runId: env.runId, events });
    writeJson(summaryFile, {
        runId: env.runId,
        startedAt: runResult.startedAt,
        endedAt: runResult.endedAt,
        scenarioRef,
        totals: {
            passed: runResult.results.filter((result) => result.status === "passed").length,
            failed: runResult.results.filter((result) => result.status === "failed").length,
            skipped: runResult.results.filter((result) => result.status === "skipped").length,
            error: runResult.results.filter((result) => result.status === "error").length
        }
    });
    writeJson(traceFile, {
        runId: env.runId,
        events
    });

    if (migrationReportFile && extras?.migrationRecords) {
        writeJson(migrationReportFile, {
            runId: env.runId,
            records: extras.migrationRecords
        });
    }

    writeJson(manifestFile, {
        manifestVersion: "1.0",
        runId: env.runId,
        scenarioRef,
        resultFile: "result.json",
        eventsFile: "events.json",
        screenshotsDir: "snapshots",
        createdAt: new Date().toISOString()
    });

    return { runDir, resultFile, eventsFile, manifestFile, summaryFile, traceFile, migrationReportFile };
}

export function collectEvents(results: UiE2EResult[]): UiE2EStepEvent[] {
    return results.flatMap((result) => result.stepEvents);
}
