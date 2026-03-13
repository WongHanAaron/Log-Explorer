#!/usr/bin/env node
// wrapper to run mocha with ts-node/esm and ensure ts-node compiles to ES module

// configure ts-node to emit ES modules (this avoids CJS named export problems)
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'ES2020' });
// ensure ts-node/esm loader is used
process.env.NODE_OPTIONS = '--loader ts-node/esm';

const { spawnSync } = require('child_process');

// pass through any additional arguments (e.g., --grep)
const args = process.argv.slice(2);

// build mocha invocation; if user specified any files/flags, include them after the defaults
// but if the only args are file paths (no flags) and they don't include globs, we can use them exclusively.
let mochaArgs;
if (args.length > 0 && args.every(a => !a.startsWith('-') && !a.includes('*'))) {
    // treat args as explicit file list
    mochaArgs = [...args];
} else {
    mochaArgs = ['test/unit/**/*.ts', 'test/e2e/**/*.ts', ...args];
}

const result = spawnSync('npx', ['mocha', ...mochaArgs], { stdio: 'inherit', shell: true });
process.exit(result.status);
