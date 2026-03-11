import * as assert from 'assert';
import * as vscode from 'vscode';
import { isSelectConfigMessage, isLogMessage } from '../../../src/utils/panelHelpers';

describe('panelHelpers', function () {
    it('detects selectConfig messages', () => {
        assert.ok(isSelectConfigMessage({ type: 'selectConfig', name: 'foo' }));
        assert.ok(!isSelectConfigMessage({ type: 'selectConfig' }));
        assert.ok(!isSelectConfigMessage({ type: 'other', name: 'foo' }));
    });
    it('detects log messages', () => {
        assert.ok(isLogMessage({ type: 'log', level: 'info', text: 'hi' }));
        assert.ok(!isLogMessage({ type: 'log', level: 'info' }));
        assert.ok(!isLogMessage({ foo: 'bar' }));
    });
});