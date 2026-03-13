import * as assert from 'assert';
import { normalizeSettings } from '../../../../src/webview/file-access-configs/utils.ts';

describe('normalizeSettings helper', () => {
    it('returns object unchanged', () => {
        const obj = { a: 1 };
        assert.strictEqual(normalizeSettings(obj), obj);
    });
    it('converts arrays or primitives to {}', () => {
        assert.deepStrictEqual(normalizeSettings([]), {});
        assert.deepStrictEqual(normalizeSettings(null), {});
        assert.deepStrictEqual(normalizeSettings('string'), {});
    });
});
