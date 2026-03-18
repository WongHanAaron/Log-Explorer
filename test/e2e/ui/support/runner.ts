import fs from "node:fs";
import path from "node:path";

import { collectEvents, writeRunArtifacts } from "./artifacts";
import { ensureEnvironment, ensureScenarioDirectoryExists } from "./environment";
import { UiE2EError } from "./errors";
import { getExitCodeFromResults, summarizeResults } from "./results";
import { runAutomatedScenarios } from "./runner.automated";
import { runDebugScenarios } from "./runner.debug";
import { loadScenarioFile } from "./schema";
import { UiE2EMode, UiE2ERunnerOptions, UiE2ERunResult, UiE2ETestCase } from "./types";

function collectScenarioFiles(scenariosRoot: string): string[] {
    ensureScenarioDirectoryExists(scenariosRoot);
    return fs
        .readdirSync(scenariosRoot)
        .filter((name) => name.endsWith(".json"))
        .map((name) => path.join(scenariosRoot, name));
}

function filterScenarios(scenarios: UiE2ETestCase[], options: UiE2ERunnerOptions): UiE2ETestCase[] {
    let current = scenarios;

    if (options.scenario) {
        current = current.filter((scenario) => scenario.id === options.scenario || scenario.name === options.scenario);
    }

    if (options.grep) {
        const matcher = new RegExp(options.grep, "i");
        current = current.filter(
            (scenario) => matcher.test(scenario.name) || matcher.test(scenario.id) || (scenario.tags ?? []).some((tag) => matcher.test(tag))
        );
    }

    return current;
}

function toInternalMode(mode: UiE2EMode): UiE2ERunResult["mode"] {
    if (mode === "debug") {
        return "debug";
    }
    if (mode === "replay") {
        return "replay";
    }
    return "automated";
}

export async function runScenarioSet(options: UiE2ERunnerOptions): Promise<{ exitCode: number; runResult: UiE2ERunResult }> {
    if (options.mode === "replay") {
        throw new UiE2EError("E2E_UNKNOWN", "Replay mode is not implemented in this task slice.", "Use run or debug mode.");
    }

    const env = ensureEnvironment(options.fixture);
    const files = collectScenarioFiles(env.scenariosRoot);
    const scenarios = files.map((filePath) => loadScenarioFile(filePath));
    const selectedScenarios = filterScenarios(scenarios, options);

    if (selectedScenarios.length === 0) {
        throw new UiE2EError(
            "E2E_SCENARIO_NOT_FOUND",
            "No scenarios matched the given filters.",
            "Adjust --scenario or --grep filters.",
            { scenario: options.scenario, grep: options.grep }
        );
    }

    const startedAt = new Date().toISOString();
    const results =
        options.mode === "debug"
            ? await runDebugScenarios(selectedScenarios, {
                manualStep: Boolean(options.step),
                continueOnFail: Boolean(options.continueOnFail),
                fixturePath: env.fixturePath
            })
            : await runAutomatedScenarios(selectedScenarios, {
                debug: false,
                continueOnFail: Boolean(options.continueOnFail),
                fixturePath: env.fixturePath
            });

    const runResult: UiE2ERunResult = {
        runId: env.runId,
        mode: toInternalMode(options.mode),
        startedAt,
        endedAt: new Date().toISOString(),
        environment: {
            os: process.platform,
            node: process.version,
            workspace: env.workspaceRoot,
            fixture: env.fixtureName
        },
        results
    };

    const scenarioRef = selectedScenarios.length === 1 ? selectedScenarios[0].id : "suite";
    writeRunArtifacts(env, scenarioRef, runResult, collectEvents(results));

    const summary = summarizeResults(results);
    console.log(
        `[ui-e2e] run=${env.runId} mode=${options.mode} passed=${summary.passed} failed=${summary.failed} skipped=${summary.skipped} error=${summary.error}`
    );

    return {
        exitCode: getExitCodeFromResults(results),
        runResult
    };
}
