import fs from "node:fs";
import path from "node:path";

import { collectEvents, writeRunArtifacts } from "./artifacts";
import { ensureEnvironment, ensureScenarioDirectoryExists } from "./environment";
import { UiE2EError } from "./errors";
import { getExitCodeFromResults, normalizeResultsForDeterminism, summarizeResults } from "./results";
import { runAutomatedScenarios } from "./runner.automated";
import { runDebugScenarios } from "./runner.debug";
import { loadScenarioFile } from "./schema";
import { UiE2EMode, UiE2ERunnerOptions, UiE2ERunResult, UiE2ETestCase } from "./types";

function collectScenarioFiles(scenariosRoot: string): string[] {
    ensureScenarioDirectoryExists(scenariosRoot);
    return fs
        .readdirSync(scenariosRoot)
        .filter((name) => name.endsWith(".json") && !name.endsWith(".profile.json"))
        .map((name) => path.join(scenariosRoot, name));
}

function loadProfileScenarioIds(scenariosRoot: string, profile?: string): string[] | undefined {
    if (!profile) {
        return undefined;
    }

    const profilePath = path.join(scenariosRoot, `${profile}.profile.json`);
    if (!fs.existsSync(profilePath)) {
        return undefined;
    }

    const payload = JSON.parse(fs.readFileSync(profilePath, "utf8"));
    if (!Array.isArray(payload.scenarios)) {
        return undefined;
    }

    return payload.scenarios.filter((value: unknown) => typeof value === "string") as string[];
}

function filterScenarios(scenarios: UiE2ETestCase[], options: UiE2ERunnerOptions, profileScenarioIds?: string[]): UiE2ETestCase[] {
    let current = scenarios;

    if (profileScenarioIds && profileScenarioIds.length > 0) {
        const idSet = new Set(profileScenarioIds);
        current = current.filter((scenario) => idSet.has(scenario.id));
    }

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

function resolveScenarioRoot(baseRoot: string, _profile?: string): string {
    return baseRoot;
}

export async function runScenarioSet(options: UiE2ERunnerOptions): Promise<{ exitCode: number; runResult: UiE2ERunResult }> {
    if (options.mode === "replay") {
        throw new UiE2EError("E2E_UNKNOWN", "Replay mode is not implemented in this task slice.", "Use run or debug mode.");
    }

    const env = ensureEnvironment(options.fixture);
    const scenariosRoot = resolveScenarioRoot(env.scenariosRoot, options.profile);

    const files = collectScenarioFiles(scenariosRoot);
    const scenarios = files.map((filePath) => loadScenarioFile(filePath));
    const profileScenarioIds = loadProfileScenarioIds(scenariosRoot, options.profile);
    const selectedScenarios = filterScenarios(scenarios, options, profileScenarioIds);

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

    const normalizedResults = normalizeResultsForDeterminism(results);

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
        results: normalizedResults
    };

    const scenarioRef = selectedScenarios.length === 1 ? selectedScenarios[0].id : "suite";
    writeRunArtifacts(env, scenarioRef, runResult, collectEvents(normalizedResults));

    const summary = summarizeResults(normalizedResults);
    console.log(
        `[ui-e2e] run=${env.runId} mode=${options.mode} passed=${summary.passed} failed=${summary.failed} skipped=${summary.skipped} error=${summary.error}`
    );

    return {
        exitCode: getExitCodeFromResults(normalizedResults),
        runResult
    };
}
