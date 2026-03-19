#!/usr/bin/env node

const path = require("path");

function parseArgs(argv) {
    const [modeArg, ...rest] = argv;
    let mode = modeArg && !modeArg.startsWith("-") ? modeArg : "run";
    const passthrough = modeArg && !modeArg.startsWith("-") ? rest : argv;

    return { mode, passthrough };
}

async function main() {
    const { mode, passthrough } = parseArgs(process.argv.slice(2));

    process.env.LOGEXPLORER_UI_E2E_MODE = mode;
    process.env.TS_NODE_PROJECT = path.resolve(__dirname, "../test/tsconfig.json");
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: "commonjs" });

    // Use transpile-only registration for fast local execution of test harness TS files.
    require("ts-node/register/transpile-only");

    const cliPath = path.resolve(__dirname, "../test/e2e/ui/support/cli.ts");
    const cli = require(cliPath);
    if (typeof cli.main !== "function") {
        throw new Error("UI E2E CLI entrypoint not found: test/e2e/ui/support/cli.ts::main");
    }

    const exitCode = await cli.main({ mode, argv: passthrough });
    if (typeof exitCode === "number") {
        process.exit(exitCode);
    }
}

main().catch((error) => {
    console.error("[ui-e2e] fatal launcher error", error);
    process.exit(1);
});
