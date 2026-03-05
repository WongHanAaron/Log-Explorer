import * as assert from 'assert';
import {
    isFilepathConfig,
    isKebabName,
    toKebabName,
    type FilepathConfig
} from '../../../src/domain/filepath-config';

describe('FilepathConfig domain', function () {
    // ── isKebabName ───────────────────────────────────────────────────────────

    describe('isKebabName', function () {
        it('accepts simple lowercase word', () => {
            assert.strictEqual(isKebabName('nginx'), true);
        });
        it('accepts lowercase-digit compound', () => {
            assert.strictEqual(isKebabName('app1-logs'), true);
        });
        it('accepts multi-segment kebab', () => {
            assert.strictEqual(isKebabName('nginx-access-log'), true);
        });
        it('rejects uppercase', () => {
            assert.strictEqual(isKebabName('Nginx'), false);
        });
        it('rejects spaces', () => {
            assert.strictEqual(isKebabName('my name'), false);
        });
        it('rejects leading hyphen', () => {
            assert.strictEqual(isKebabName('-foo'), false);
        });
        it('rejects trailing hyphen', () => {
            assert.strictEqual(isKebabName('foo-'), false);
        });
        it('rejects double hyphen', () => {
            assert.strictEqual(isKebabName('foo--bar'), false);
        });
        it('rejects empty string', () => {
            assert.strictEqual(isKebabName(''), false);
        });
    });

    // ── toKebabName ───────────────────────────────────────────────────────────

    describe('toKebabName', function () {
        it('lowercases uppercase chars', () => {
            assert.strictEqual(toKebabName('NginxAccess'), 'nginxaccess');
        });
        it('replaces spaces with hyphens', () => {
            assert.strictEqual(toKebabName('my app log'), 'my-app-log');
        });
        it('replaces special chars with hyphens and deduplicates', () => {
            assert.strictEqual(toKebabName('My.App/Log'), 'my-app-log');
        });
        it('strips leading and trailing hyphens', () => {
            assert.strictEqual(toKebabName('  leading-trailing  '), 'leading-trailing');
        });
    });

    // ── isFilepathConfig ──────────────────────────────────────────────────────

    describe('isFilepathConfig', function () {
        const valid: FilepathConfig = {
            shortName: 'nginx-access',
            label: 'Nginx Access Log',
            pathPattern: '/var/log/nginx/access.log'
        };

        it('accepts a valid config', () => {
            assert.strictEqual(isFilepathConfig(valid), true);
        });
        it('accepts with optional description', () => {
            assert.strictEqual(
                isFilepathConfig({ ...valid, description: 'prod log' }),
                true
            );
        });
        it('accepts with tags array', () => {
            assert.strictEqual(
                isFilepathConfig({ ...valid, tags: ['foo', 'bar'] }),
                true
            );
        });
        it('rejects tags that are not strings', () => {
            assert.strictEqual(
                isFilepathConfig({ ...valid, tags: ['good', 123 as any] }),
                false
            );
        });
        it('rejects tags with empty string', () => {
            assert.strictEqual(
                isFilepathConfig({ ...valid, tags: ['ok', '   '] }),
                false
            );
        });
        it('rejects missing shortName', () => {
            const { shortName: _, ...rest } = valid;
            assert.strictEqual(isFilepathConfig(rest), false);
        });
        it('rejects non-kebab shortName', () => {
            assert.strictEqual(
                isFilepathConfig({ ...valid, shortName: 'My Config' }),
                false
            );
        });
        it('rejects missing label', () => {
            const { label: _, ...rest } = valid;
            assert.strictEqual(isFilepathConfig(rest), false);
        });
        it('rejects empty label', () => {
            assert.strictEqual(isFilepathConfig({ ...valid, label: '   ' }), false);
        });
        it('rejects missing pathPattern', () => {
            const { pathPattern: _, ...rest } = valid;
            assert.strictEqual(isFilepathConfig(rest), false);
        });
        it('rejects empty pathPattern', () => {
            assert.strictEqual(isFilepathConfig({ ...valid, pathPattern: '' }), false);
        });
        it('rejects null input', () => {
            assert.strictEqual(isFilepathConfig(null), false);
        });
        it('rejects non-string description', () => {
            assert.strictEqual(isFilepathConfig({ ...valid, description: 42 }), false);
        });
    });
});
