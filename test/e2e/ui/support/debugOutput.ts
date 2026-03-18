import { UiE2EStep } from "./types";

function now(): string {
    return new Date().toISOString();
}

export function logDebugStep(step: UiE2EStep, phase: string): void {
    console.log(`[ui-e2e][${now()}][debug] step=${step.index} phase=${phase} action=${step.actionType}`);
}

export function logDebugAssertion(message: string): void {
    console.log(`[ui-e2e][${now()}][assert] ${message}`);
}

export function logDebugInfo(message: string): void {
    console.log(`[ui-e2e][${now()}][info] ${message}`);
}
