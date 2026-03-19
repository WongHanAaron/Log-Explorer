import { UiE2EResult } from "./types";

export interface RunSummary {
    passed: number;
    failed: number;
    skipped: number;
    error: number;
}

export function summarizeResults(results: UiE2EResult[]): RunSummary {
    const summary: RunSummary = { passed: 0, failed: 0, skipped: 0, error: 0 };
    for (const result of results) {
        summary[result.status] += 1;
    }
    return summary;
}

export function normalizeResultsForDeterminism(results: UiE2EResult[]): UiE2EResult[] {
    return [...results].sort((a, b) => a.testCaseId.localeCompare(b.testCaseId));
}

export function getExitCodeFromResults(results: UiE2EResult[]): number {
    return results.some((result) => result.status === "failed" || result.status === "error") ? 1 : 0;
}
