import * as assert from 'assert';
import {
    isFileLogLineConfig,
    type TextLineConfig,
    type XmlLineConfig,
    type JsonLineConfig,
    type FileLogLineConfig
} from '../../../src/domain/filelog-config';

describe('FileLogLineConfig domain', function () {
    // ── Helpers ───────────────────────────────────────────────────────────────

    function base(type: string): object {
        return { shortName: 'test-config', label: 'Test', type };
    }

    // ── TextLineConfig — prefix-suffix extraction ─────────────────────────────

    describe('TextLineConfig (prefix-suffix)', function () {
        it('accepts valid prefix-suffix text config', () => {
            const cfg: TextLineConfig = {
                type: 'text',
                shortName: 'nginx',
                label: 'Nginx',
                fields: [
                    { name: 'ts', extraction: { kind: 'prefix-suffix', prefix: '[', suffix: ']' } }
                ]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });

        it('accepts prefix-suffix without suffix (to end-of-line)', () => {
            const cfg: TextLineConfig = {
                type: 'text',
                shortName: 'app',
                label: 'App',
                fields: [{ name: 'level', extraction: { kind: 'prefix-suffix', prefix: 'level=' } }]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });

        it('rejects prefix-suffix without prefix', () => {
            const cfg = {
                ...base('text'),
                fields: [{ name: 'x', extraction: { kind: 'prefix-suffix' } }]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), false);
        });

        it('accepts text config with datetime field', () => {
            const cfg: TextLineConfig = {
                type: 'text',
                shortName: 'iis',
                label: 'IIS',
                fields: [
                    {
                        name: 'ts',
                        extraction: { kind: 'prefix-suffix', prefix: '[', suffix: ']' },
                        datetime: { formatString: 'yyyy-MM-dd HH:mm:ss' }
                    }
                ]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });
    });

    // ── TextLineConfig — regex extraction ─────────────────────────────────────

    describe('TextLineConfig (regex)', function () {
        it('accepts valid regex text config', () => {
            const cfg: TextLineConfig = {
                type: 'text',
                shortName: 'access',
                label: 'Access',
                fields: [
                    { name: 'ip', extraction: { kind: 'regex', pattern: '(?<value>\\d+\\.\\d+\\.\\d+\\.\\d+)' } }
                ]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });

        it('rejects regex extraction without pattern', () => {
            const cfg = {
                ...base('text'),
                fields: [{ name: 'x', extraction: { kind: 'regex' } }]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), false);
        });
    });

    // ── XmlLineConfig ──────────────────────────────────────────────────────────

    describe('XmlLineConfig', function () {
        it('accepts valid xml config', () => {
            const cfg: XmlLineConfig = {
                type: 'xml',
                shortName: 'events',
                label: 'Events',
                rootXpath: '//Event',
                fields: [{ name: 'severity', xpath: '@Level' }]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });

        it('rejects xml config without rootXpath', () => {
            const cfg = { ...base('xml'), fields: [{ name: 'x', xpath: '//x' }] };
            assert.strictEqual(isFileLogLineConfig(cfg), false);
        });

        it('accepts xml config with no fields', () => {
            const cfg: XmlLineConfig = {
                type: 'xml', shortName: 'log', label: 'Log', rootXpath: '//Log', fields: []
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });
    });

    // ── JsonLineConfig ─────────────────────────────────────────────────────────

    describe('JsonLineConfig', function () {
        it('accepts valid json config', () => {
            const cfg: JsonLineConfig = {
                type: 'json',
                shortName: 'structured',
                label: 'Structured',
                fields: [
                    { name: 'level', jsonPath: 'level' },
                    { name: 'ts', jsonPath: 'metadata.timestamp', datetime: { autoDetect: true } }
                ]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });

        it('rejects json field without jsonPath', () => {
            const cfg = {
                ...base('json'),
                fields: [{ name: 'x' }]
            };
            assert.strictEqual(isFileLogLineConfig(cfg), false);
        });

        it('accepts json config with empty fields array', () => {
            const cfg: JsonLineConfig = {
                type: 'json', shortName: 'empty', label: 'Empty', fields: []
            };
            assert.strictEqual(isFileLogLineConfig(cfg), true);
        });
    });

    // ── Discriminant rejection ─────────────────────────────────────────────────

    describe('unknown type', function () {
        it('rejects unknown line type', () => {
            assert.strictEqual(isFileLogLineConfig({ ...base('csv'), fields: [] }), false);
        });
        it('rejects null', () => {
            assert.strictEqual(isFileLogLineConfig(null), false);
        });
        it('rejects missing shortName', () => {
            assert.strictEqual(
                isFileLogLineConfig({ type: 'text', label: 'L', fields: [] }),
                false
            );
        });
        it('rejects missing label', () => {
            assert.strictEqual(
                isFileLogLineConfig({ type: 'json', shortName: 'foo', fields: [] }),
                false
            );
        });
    });
});
