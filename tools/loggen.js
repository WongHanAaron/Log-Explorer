#!/usr/bin/env node
// bootstrap loader that delegates to the TypeScript implementation

// when executed directly, use ts-node to run the TS source
require('ts-node/register');
const impl = require('./loggen.ts');
// re-export for consumers (unit tests, etc.)
module.exports = impl;
