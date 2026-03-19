#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const scenarioIndex = process.argv.indexOf("--scenario");
const scenario = scenarioIndex !== -1 ? process.argv[scenarioIndex + 1] : "panel-webview-lifecycle";

const scriptPath = path.resolve(__dirname, "run-ui-e2e.js");
let allPassed = true;

for (let i = 1; i <= 3; i += 1) {
    const result = spawnSync(
        process.execPath,
        [scriptPath, "run", "--profile", "panel-webview-integrated", "--scenario", scenario],
        { stdio: "inherit" }
    );

    if (result.status !== 0) {
        allPassed = false;
    }
}

process.exit(allPassed ? 0 : 1);
