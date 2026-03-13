import * as assert from 'assert';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as http from 'http';
import * as fs from 'fs';

const execAsync = promisify(exec);

/**
 * Read versions list from file or environment variable.
 */
function getVersions(): string[] {
    const env = process.env.KIBANA_VERSIONS;
    if (env) {
        return env.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }
    const path = 'kibana-versions.txt';
    if (!fs.existsSync(path)) {
        return [];
    }
    const lines = fs.readFileSync(path, 'utf8')
        .split(/\r?\n/)
        .map(l => l.replace(/#.*$/, '').trim())
        .filter(l => l.length > 0);
    return lines;
}

async function startKibana(version?: string, port?: number) {
    const args = ['start'];
    if (version) {
        args.push('--version', version);
    }
    if (port) {
        args.push('--port', port.toString());
    }
    const { stdout, stderr } = await execAsync(`bash scripts/kibana.sh ${args.join(' ')}`);
    if (stderr) {
        // docker messages may be on stderr, but if process failed it will throw
    }
    return JSON.parse(stdout);
}

async function stopKibana(containerId?: string) {
    const args = ['stop'];
    if (containerId) {
        args.push('--container', containerId);
    }
    await execAsync(`bash scripts/kibana.sh ${args.join(' ')}`);
}

function httpGet(url: string): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode || 0, body: data }));
        }).on('error', reject);
    });
}

suite('Kibana Integration', () => {
    const versions = getVersions();
    if (versions.length === 0) {
        console.warn('No Kibana versions configured; skipping integration tests');
        return;
    }

    versions.forEach(version => {
        test(`Kibana ${version} should start and respond to /api/status`, async function () {
            this.timeout(5 * 60 * 1000); // allow up to 5 minutes for container startup
            const info = await startKibana(version);
            assert.ok(info.port, 'start output should include port');
            const { statusCode } = await httpGet(`http://localhost:${info.port}/api/status`);
            assert.strictEqual(statusCode, 200, 'API status endpoint should return 200');
            await stopKibana(info.containerId);
        });
    });
});
