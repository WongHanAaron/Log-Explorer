import { expect } from 'chai';

let ConfigParser: any;
before(async () => {
    const cs = await import('../../../src/services/config-store.ts');
    ConfigParser = (cs as any).ConfigParser || (cs as any).default?.ConfigParser;
});

// verify serialization and validation

describe('FileAccessConfig domain', () => {
    it('round-trips to/from JSON via parser', async () => {
        const json = JSON.stringify({
            shortName: 'example',
            adapterType: 'local',
            settings: { basePath: '/tmp' }
        });
        const parsed = await ConfigParser.parseFileAccessConfig(json);
        expect(parsed.shortName).to.equal('example');
        expect(parsed.adapterType).to.equal('local');
    });

    it('rejects missing required fields', async () => {
        const incomplete = {};
        await expect(ConfigParser.parseFileAccessConfig(JSON.stringify(incomplete))).to.eventually.be.rejected;
    });

    it('applies adapter-specific validation', async () => {
        const json = JSON.stringify({
            shortName: 'sftp1',
            adapterType: 'sftp',
            settings: { host: 123 }
        });
        await expect(ConfigParser.parseFileAccessConfig(json)).to.eventually.be.rejected;
    });

});
