#!/usr/bin/env node
// CLI for generating and managing log files for e2e tests

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

interface Field {
    name: string;
    type: 'iso' | 'enum' | 'sentence' | 'number' | string;
    values?: string[];
    increment?: number;
    format?: string; // for iso type, date format pattern
}

interface Config {
    format: string;
    entries: number;
    fields: Field[];
    randomize?: boolean;
    timestampMode?: 'random' | 'sequential';
}

const program = new Command();

program
    .name('loggen')
    .description('E2E log generation and deployment utility')
    .version('0.1.0');

function validateConfig(cfg: any): asserts cfg is Config {
    if (!cfg.format || !cfg.entries || !Array.isArray(cfg.fields)) {
        throw new Error('configuration must include format, entries, and fields');
    }
    if (cfg.randomize && typeof cfg.randomize !== 'boolean') {
        throw new Error('randomize flag must be boolean');
    }
    if (cfg.timestampMode && !['random', 'sequential'].includes(cfg.timestampMode)) {
        throw new Error('timestampMode must be "random" or "sequential"');
    }
}

function formatDate(date: Date, pattern: string): string {
    // simple replacements for common tokens
    const pad = (n: number, width = 2) => n.toString().padStart(width, '0');
    return pattern
        .replace(/yyyy/g, date.getFullYear().toString())
        .replace(/MM/g, pad(date.getMonth() + 1))
        .replace(/dd/g, pad(date.getDate()))
        .replace(/HH/g, pad(date.getHours()))
        .replace(/mm/g, pad(date.getMinutes()))
        .replace(/ss/g, pad(date.getSeconds()))
        .replace(/SSS/g, pad(date.getMilliseconds(), 3));
}

function randomValueForField(field: Field): string | number {
    switch (field.type) {
        case 'enum':
            if (!Array.isArray(field.values) || field.values.length === 0) {
                return '';
            }
            return field.values[Math.floor(Math.random() * field.values.length)];
        case 'sentence':
            return 'Lorem ipsum dolor sit amet.';
        case 'number':
            return Math.floor(Math.random() * 100);
        default:
            return '';
    }
}

function generateLines(cfg: Config): string[] {
    const lines: string[] = [];
    const baseTime = Date.now();
    for (let i = 0; i < cfg.entries; i++) {
        const values = cfg.fields.map(f => {
            if (f.type === 'iso') {
                let date: Date;
                if (cfg.timestampMode === 'sequential') {
                    date = new Date(baseTime + i * (f.increment || 1000));
                } else {
                    date = new Date(Date.now() - Math.floor(Math.random() * 10000000));
                }
                if (f.format) {
                    return formatDate(date, f.format);
                }
                return date.toISOString();
            }
            return randomValueForField(f);
        });
        lines.push(values.join(' '));
    }
    if (cfg.randomize) {
        for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
        }
    }
    return lines;
}

program
    .command('generate')
    .requiredOption('--config <path>')
    .requiredOption('--output <dir>')
    .option('--count <n>', 'number of files', '1')
    .option('--format <type>', 'output format (text|es-bulk)', 'text')
    .option('--filename <pattern>', 'relative filename pattern (use {i},{timestamp},{random})', 'log-{timestamp}-{i}.txt')
    .action((opts: any) => {
        const configPath = path.resolve(opts.config);
        const outDir = path.resolve(opts.output);
        let cfg: Config;
        try {
            cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            validateConfig(cfg);
        } catch (e: any) {
            console.error('failed to read/validate config:', e.message);
            process.exit(1);
        }
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        const count = Number(opts.count) || 1;
        const pattern: string = opts.filename;
        for (let i = 0; i < count; i++) {
            const fileName = generateFilename(pattern, i);
            const filePath = path.join(outDir, fileName);
            // ensure subdirectories exist
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const lines = generateLines(cfg);
            if (opts.format === 'es-bulk') {
                const bulk = lines.map(l => JSON.stringify({ line: l })).join('\n');
                fs.writeFileSync(filePath, bulk);
            } else {
                fs.writeFileSync(filePath, lines.join('\n'));
            }
            console.log('created', filePath);
        }
    });

// utility to expand filename patterns
function generateFilename(pattern: string, index: number): string {
    const now = Date.now();
    return pattern
        .replace(/\{i\}/g, index.toString())
        .replace(/\{timestamp\}/g, now.toString())
        .replace(/\{random\}/g, Math.floor(Math.random() * 1e9).toString());
}

// core logic split out for easier testing
function deployLogs(target: string, sourceDir: string = process.cwd()): void {
    const [container, dest] = target.split(':');
    if (!container || !dest) {
        throw new Error('target must be in container:path format');
    }
    const src = path.resolve(sourceDir);
    try {
        child_process.execSync(`docker cp "${src}" "${container}:${dest}"`, { stdio: 'inherit' });
    } catch (e: any) {
        throw new Error(`docker cp failed: ${e.message}`);
    }
}

program
    .command('deploy')
    .requiredOption('--target <container:path>')
    .option('--source <dir>', 'source directory', process.cwd())
    .action((opts: any) => {
        try {
            deployLogs(opts.target, opts.source);
        } catch (e: any) {
            console.error(e.message);
            process.exit(1);
        }
    });

// similarly expose cleanup for testing
function cleanupLogs(target: string): void {
    const [container, dest] = target.split(':');
    if (!container || !dest) {
        throw new Error('target must be in container:path format');
    }
    try {
        child_process.execSync(`docker exec ${container} rm -rf ${dest}/*`, { stdio: 'inherit' });
    } catch (e: any) {
        throw new Error(`cleanup failed: ${e.message}`);
    }
}

program
    .command('cleanup')
    .requiredOption('--target <container:path>')
    .action((opts: any) => {
        try {
            cleanupLogs(opts.target);
        } catch (e: any) {
            console.error(e.message);
            process.exit(1);
        }
    });

// export parts of the module for testing
export {
    validateConfig,
    generateLines,
    deployLogs,
    cleanupLogs,
};

if (require.main === module) {
    program.parse(process.argv);
}
