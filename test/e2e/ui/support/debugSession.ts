import readline from "node:readline";

import { UiE2EStep } from "./types";

export class DebugSession {
    private readonly manualStep: boolean;

    public constructor(manualStep: boolean) {
        this.manualStep = manualStep;
    }

    public async shouldPause(step: UiE2EStep, phase: "before" | "after"): Promise<boolean> {
        if (this.manualStep) {
            return true;
        }
        if (phase === "before" && step.pauseBefore) {
            return true;
        }
        if (phase === "after" && step.pauseAfter) {
            return true;
        }
        return false;
    }

    public async waitForContinue(step: UiE2EStep, phase: "before" | "after"): Promise<void> {
        if (!(await this.shouldPause(step, phase))) {
            return;
        }
        if (!process.stdin.isTTY || process.env.UI_E2E_NONINTERACTIVE === "1") {
            return;
        }
        await new Promise<void>((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(
                `[ui-e2e][debug] step ${step.index} (${phase}) paused. Press Enter to continue...`,
                () => {
                    rl.close();
                    resolve();
                }
            );
        });
    }
}
