const { expect } = require('chai');
const {
    FileLogLineConfig,
    TextLineConfig,
    XmlLineConfig,
    JsonLineConfig,
    TextField,
    XmlFieldMapping,
    JsonFieldMapping,
    PrefixSuffixExtraction,
    RegexExtraction,
    DateTimeFormat
} = require('../../../src/domain/filelog-config.ts');

async function assertRoundTrip(clazz: any, obj: any) {
    const json = obj.toJson ? obj.toJson() : JSON.stringify(obj);
    const [inst, err] = await clazz.fromJson(json);
    expect(err).to.be.null;
    expect(inst).to.be.instanceOf(clazz);
    expect(inst).to.deep.equal(obj);
}

function base(type: string): any {
    return { shortName: 'test', type };
}

describe('FileLogLineConfig classes', () => {
    describe('TextLineConfig', () => {
        it('round-trips prefix-suffix extraction', async () => {
            const cfg = new TextLineConfig();
            cfg.type = 'text';
            cfg.shortName = 'nginx';
            const field = new TextField();
            field.name = 'ts';
            field.extraction = Object.assign(new PrefixSuffixExtraction(), {
                kind: 'prefix-suffix', prefix: '[', suffix: ']'
            });
            cfg.fields = [field];
            await assertRoundTrip(TextLineConfig, cfg);
        });

        it('rejects missing fields', async () => {
            const json = JSON.stringify({ type: 'text', shortName: 'foo' });
            const [cfg, err] = await FileLogLineConfig.fromJson(json);
            expect(cfg).to.be.null;
            expect(err).to.exist;
        });
    });

    describe('XmlLineConfig', () => {
        it('round-trips simple xml config', async () => {
            const cfg = new XmlLineConfig();
            cfg.type = 'xml';
            cfg.shortName = 'events';
            const m = new XmlFieldMapping();
            m.name = 'sev';
            m.xpath = '@Level';
            cfg.fields = [m];
            await assertRoundTrip(XmlLineConfig, cfg);
        });

        // no longer validate presence of rootXpath – it was removed from the model
        // because XML extraction always operates on the whole document

    });

    describe('JsonLineConfig', () => {
        it('round-trips simple json config', async () => {
            const cfg = new JsonLineConfig();
            cfg.type = 'json';
            cfg.shortName = 'structured';
            const j = new JsonFieldMapping();
            j.name = 'level';
            j.jsonPath = 'level';
            cfg.fields = [j];
            await assertRoundTrip(JsonLineConfig, cfg);
        });

        it('rejects missing jsonPath', async () => {
            const json = JSON.stringify({ type: 'json', shortName: 'x', fields: [{ name: 'y' }] });
            const [cfg, err] = await FileLogLineConfig.fromJson(json);
            expect(cfg).to.be.null;
            expect(err).to.exist;
        });
    });

    describe('discriminator logic', () => {
        it('produces TextLineConfig instance', async () => {
            const json = JSON.stringify({ type: 'text', shortName: 'a', fields: [] });
            const [inst, err] = await FileLogLineConfig.fromJson(json);
            expect(err).to.be.null;
            expect(inst).to.be.instanceOf(TextLineConfig);
        });

        it('fails on unknown type', async () => {
            const json = JSON.stringify({ type: 'csv', shortName: 'a', fields: [] });
            const [cfg, err] = await FileLogLineConfig.fromJson(json);
            expect(cfg).to.be.null;
            expect(err).to.exist;
        });
    });
});
