#!/usr/bin/env node
// Cross-platform helper for `npm run package:local`.
// Creates releases/ directory and packages the extension via vsce.

import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import path from 'path';

try {
    const root = process.cwd();
    const releases = path.join(root, 'releases');
    mkdirSync(releases, { recursive: true });

    console.log('Packaging extension to releases/ ...');
    execSync('npx vsce package --out releases/ --allow-missing-repository', { stdio: 'inherit' });
    console.log('Package complete.');
} catch (err) {
    console.error('Failed to package extension:', err.message || err);
    process.exit(1);
}