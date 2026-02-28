#!/usr/bin/env node
// Cross-platform helper for `npm run install:local`.
// Locates .vsix in releases/ and installs it via the `code` CLI.

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';

try {
    const root = process.cwd();
    const releases = path.join(root, 'releases');
    const files = readdirSync(releases);
    const vsix = files.find(f => f.endsWith('.vsix'));
    if (!vsix) {
        console.error("No .vsix found in releases/. Run 'npm run package:local' first.");
        process.exit(1);
    }
    const vsixPath = path.join(releases, vsix);
    console.log(`Installing ${vsixPath}...
`);
    execSync(`code --install-extension "${vsixPath}" --force`, { stdio: 'inherit' });
    console.log('Installation complete.');
} catch (err) {
    console.error('Failed to install extension:', err.message || err);
    process.exit(1);
}