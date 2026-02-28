#!/usr/bin/env node
// helper to run the Kibana integration tests after TypeScript compilation

const Mocha = require('mocha');
const path = require('path');

async function main() {
    const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 300000 });
    const testFile = path.resolve(__dirname, '../out/test/suite/kibana.integration.js');
    mocha.addFile(testFile);
    mocha.run(failures => {
        process.exitCode = failures ? 1 : 0;
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
