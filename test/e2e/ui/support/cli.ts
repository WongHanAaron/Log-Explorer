import { toUiE2EError } from "./errors";
import { parseRunnerOptions } from "./cliArgs";
import { runScenarioSet } from "./runner";
import { UiE2EMode } from "./types";

interface MainInput {
    mode: UiE2EMode;
    argv: string[];
}

export async function main(input: MainInput): Promise<number> {
    try {
        const options = parseRunnerOptions(input.mode, input.argv);
        if (options.migrate) {
            console.log("[ui-e2e] running migration mode");
        }
        const result = await runScenarioSet(options);
        return result.exitCode;
    } catch (error) {
        const typed = toUiE2EError(error);
        console.error(`[ui-e2e] ${typed.code} ${typed.message}`);
        console.error(`[ui-e2e] action: ${typed.action}`);
        if (typed.context) {
            console.error(`[ui-e2e] context: ${JSON.stringify(typed.context)}`);
        }
        return 1;
    }
}
