import { expect } from 'chai';
import { buildPayload } from '../../../../src/webview/log-file-lines/App';
import { TextField, XmlField, JsonField } from '../../../../src/webview/log-file-lines/components/FormPage';

describe('buildPayload helper', () => {
    it('constructs a text payload correctly', () => {
        const fields: TextField[] = [
            { name: 'a', extraction: { kind: 'prefix-suffix', prefix: '[', suffix: ']' } }
        ];
        const result = buildPayload('text', 'foo', '', ['t1'], fields, [], []);
        expect(result).to.deep.equal({
            type: 'text',
            shortName: 'foo',
            tags: ['t1'],
            fields,
        });
    });

    it('constructs an xml payload correctly', () => {
        const xmlFields: XmlField[] = [ { name: 'x', xpath: 'foo' } ];
        const result = buildPayload('xml', 'bar', 'desc', [], [], xmlFields, []);
        expect(result).to.deep.equal({
            type: 'xml',
            shortName: 'bar',
            description: 'desc',
            fields: xmlFields,
        });
    });

    it('constructs a json payload correctly', () => {
        const jsonFields: JsonField[] = [ { name: 'j', jsonPath: '$.a' } ];
        const result = buildPayload('json', 'baz', '', [], [], [], jsonFields);
        expect(result).to.deep.equal({
            type: 'json',
            shortName: 'baz',
            fields: jsonFields,
        });
    });
});
