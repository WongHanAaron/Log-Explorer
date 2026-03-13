import * as assert from 'assert';
import { sanitizeConfigError, formatConfigLoadError } from '../../../src/utils/errorUtils.ts';

describe('errorUtils', () => {
    describe('sanitizeConfigError', () => {
        it('leaves innocuous messages alone', () => {
            assert.strictEqual(sanitizeConfigError('oops'), 'oops');
        });

        it('rewrites iterable errors to friendly text', () => {
            assert.strictEqual(sanitizeConfigError('undefined is not iterable'), 'Malformed configuration file.');
            assert.strictEqual(sanitizeConfigError('(intermediate value) is not iterable'), 'Malformed configuration file.');
        });
    });

    describe('formatConfigLoadError', () => {
        it('returns null for not-found errors', () => {
            assert.strictEqual(formatConfigLoadError('File not found'), null);
            assert.strictEqual(formatConfigLoadError('ENOENT: no such file'), null);
        });

        it('sanitizes other errors', () => {
            assert.strictEqual(formatConfigLoadError('(intermediate value) is not iterable'), 'Malformed configuration file.');
            assert.strictEqual(formatConfigLoadError('some other message'), 'some other message');
        });
    });
});
