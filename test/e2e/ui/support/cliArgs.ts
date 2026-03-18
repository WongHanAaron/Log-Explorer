import { UiE2EMode, UiE2ERunnerOptions } from "./types";

function getValue(args: string[], key: string): string | undefined {
    const index = args.findIndex((arg) => arg === key);
    if (index === -1 || index + 1 >= args.length) {
        return undefined;
    }
    return args[index + 1];
}

function hasFlag(args: string[], key: string): boolean {
    return args.includes(key);
}

export function parseRunnerOptions(mode: UiE2EMode, argv: string[]): UiE2ERunnerOptions {
    const grep = getValue(argv, "--grep");
    const scenario = getValue(argv, "--scenario");
    const fixture = getValue(argv, "--workspace");
    const step = hasFlag(argv, "--step");
    const continueOnFail = hasFlag(argv, "--continue-on-fail");

    return {
        mode,
        grep,
        scenario,
        fixture,
        step,
        continueOnFail
    };
}
