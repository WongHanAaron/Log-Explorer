import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('LogGen Unit', function () {
    const sample = path.resolve('tools/samples/sample-log-config.json');
    const outdir = path.resolve('tmp-test-logs');

    afterEach(() => {
        if (fs.existsSync(outdir)) {
            fs.rmSync(outdir, { recursive: true, force: true });
        }
    });

    it('should error with missing config', () => {
        try {
            execSync('npm run loggen -- generate --config missing.json --output out');
        } catch (e: any) {
            assert.ok(e.stderr.toString().includes('failed to read/validate config'));
            return;
        }
        assert.fail('command should have exited with error');
    });

    it('should create files with correct number of entries', () => {
        execSync(`npm run loggen -- generate --config "${sample}" --output "${outdir}" --count 2`);
        const files = fs.readdirSync(outdir);
        assert.strictEqual(files.length, 2);
        const lines = fs.readFileSync(path.join(outdir, files[0]), 'utf8').split('\n');
        assert.strictEqual(lines.length, 5); // sample config entries
    });

    it('supports filename patterns with subdirectories and randomness', () => {
        const pattern = 'subdir/log-{i}-{random}.txt';
        execSync(`npm run loggen -- generate --config "${sample}" --output "${outdir}" --count 3 --filename "${pattern}"`);
        const subfiles = fs.readdirSync(path.join(outdir, 'subdir'));
        assert.strictEqual(subfiles.length, 3);
        subfiles.forEach(f => assert.ok(f.startsWith('log-')));
    });

    it('honors iso format patterns in config', () => {
        // write a temporary config with a formatted iso field
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir, { recursive: true });
        }
        const cfg = {
            format: 'text',
            entries: 2,
            fields: [
                { name: 'ts', type: 'iso', format: 'yyyyMMdd-HHmmss' },
                { name: 'msg', type: 'sentence' }
            ]
        };
        const cfgPath = path.join(outdir, 'cfg.json');
        fs.writeFileSync(cfgPath, JSON.stringify(cfg));
        execSync(`npm run loggen -- generate --config "${cfgPath}" --output "${outdir}" --count 1`);
        const files = fs.readdirSync(outdir).filter(x => x.endsWith('.txt'));
        const content = fs.readFileSync(path.join(outdir, files[0]), 'utf8');
        const line = content.split('\n')[0];
        assert.match(line, /\d{8}-\d{6} /);
    });

    it('deploy should call docker cp with correct arguments', () => {
        // monkey patch execSync inside the loggen module
        const loggen = require('../../tools/loggen');
        let called = false;
        const child = require('child_process');
        const orig = child.execSync;
        child.execSync = (cmd: string, opts?: any) => {
            called = true;
            assert.ok(cmd.includes('docker cp'));
            // restore original to avoid side effects
            child.execSync = orig;
            return Buffer.from('');
        };
        // create dummy source dir
        fs.mkdirSync(outdir, { recursive: true });
        loggen.deployLogs('abc:/path', outdir);
        assert.ok(called);
    });

    it('cleanup should call docker exec with correct arguments', () => {
        const loggen = require('../../tools/loggen');
        let called = false;
        const child = require('child_process');
        const orig = child.execSync;
        child.execSync = (cmd: string, opts?: any) => {
            called = true;
            assert.ok(cmd.includes('docker exec'));
            assert.ok(cmd.includes('rm -rf'));
            // restore original
            child.execSync = orig;
            return Buffer.from('');
        };
        loggen.cleanupLogs('abc:/path');
        assert.ok(called);
    });
});