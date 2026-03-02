import * as assert from 'assert';
import {
    configFilename,
    parseFilepathConfig,
    parseFileLogLineConfig
} from '../../../src/services/config-store';

describe('ConfigStore (pure parsing)', function () {
    // ── configFilename ────────────────────────────────────────────────────────

    describe('configFilename', function () {
        it('appends .json to the short name', () => {
            assert.strictEqual(configFilename('nginx-access'), 'nginx-access.json');
        });
        it('works for single-word names', () => {
            assert.strictEqual(configFilename('app'), 'app.json');
        });
    });

    // ── parseFilepathConfig ───────────────────────────────────────────────────

    describe('parseFilepathConfig', function () {
        it('returns a valid FilepathConfig on valid JSON', () => {
            const json = JSON.stringify({
                shortName: 'my-log',
                label: 'My Log',
                pathPattern: '/var/log/app.log'
            });
            const cfg = parseFilepathConfig(json);
            assert.strictEqual(cfg.shortName, 'my-log');
            assert.strictEqual(cfg.label, 'My Log');
            assert.strictEqual(cfg.pathPattern, '/var/log/app.log');
        });

        it('throws on malformed JSON', () => {
            assert.throws(() => parseFilepathConfig('{invalid'), /malformed/i);
        });

        it('throws on valid JSON but invalid schema', () => {
            const json = JSON.stringify({ shortName: 'INVALID NAME', label: 'X', pathPattern: 'y' });
            assert.throws(() => parseFilepathConfig(json), /invalid.*filepath/i);
        });

        it('preserves optional description field', () => {
            const json = JSON.stringify({
                shortName: 'app',
                label: 'App',
                pathPattern: '*.log',
                description: 'main app'
            });
            const cfg = parseFilepathConfig(json);
            assert.strictEqual(cfg.description, 'main app');
        });
    });

    // ── parseFileLogLineConfig ────────────────────────────────────────────────

    describe('parseFileLogLineConfig', function () {
        it('returns TextLineConfig on valid text JSON', () => {
            const json = JSON.stringify({
                type: 'text',
                shortName: 'iis',
                label: 'IIS',
                fields: [{ name: 'ts', extraction: { kind: 'prefix-suffix', prefix: '[', suffix: ']' } }]
            });
            const cfg = parseFileLogLineConfig(json);
            assert.strictEqual(cfg.type, 'text');
            assert.strictEqual(cfg.shortName, 'iis');
        });

        it('returns JsonLineConfig on valid json-type JSON', () => {
            const json = JSON.stringify({
                type: 'json',
                shortName: 'structured',
                label: 'Structured',
                fields: [{ name: 'level', jsonPath: 'level' }]
            });
            const cfg = parseFileLogLineConfig(json);
            assert.strictEqual(cfg.type, 'json');
        });

        it('throws on malformed JSON', () => {
            assert.throws(() => parseFileLogLineConfig('{{'), /malformed/i);
        });

        it('throws on valid JSON but invalid schema', () => {
            const json = JSON.stringify({ type: 'unknown', shortName: 'x', label: 'X', fields: [] });
            assert.throws(() => parseFileLogLineConfig(json), /invalid.*filelog/i);
        });
    });
});
