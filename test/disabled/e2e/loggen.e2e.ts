// end-to-end tests validate generation/deploy/cleanup using a real container
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

describe('LogGen E2E', () => {
    it('should generate logs, push them into a container, and clean up', function () {
        // skip if docker isn't available
        try {
            execSync('docker version', { stdio: 'ignore' });
        } catch (e) {
            this.skip();
            return;
        }

        const containerName = 'loggen-e2e-test';
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loggen-'));
        try {
            // start an alpine container that just sleeps
            execSync(`docker run -d --name ${containerName} alpine sleep 600`);

            // generate two log files
            execSync(`npm run loggen -- generate --config "tools/samples/sample-log-config.json" --output "${tmpDir}" --count 2`);
            const files = fs.readdirSync(tmpDir);
            assert.ok(files.length >= 2, 'should have generated at least two log files');

            // deploy into container
            execSync(`npm run loggen -- deploy --target ${containerName}:/tmp/logs --source \"${tmpDir}\"`);

            // verify inside container
            const inside = execSync(`docker exec ${containerName} ls /tmp/logs`).toString();
            const insideFiles = inside.split(/\r?\n/).filter(l => l.length > 0);
            assert.ok(insideFiles.length >= 2, 'container should contain the deployed logs');

            // cleanup
            execSync(`npm run loggen -- cleanup --target ${containerName}:/tmp/logs`);
            const after = execSync(`docker exec ${containerName} ls /tmp/logs || true`).toString().trim();
            assert.strictEqual(after, '');
        } finally {
            // remove container and tmp
            try {
                execSync(`docker rm -f ${containerName}`);
            } catch { }
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }).timeout(2 * 60 * 1000); // give two minutes for container operations
});