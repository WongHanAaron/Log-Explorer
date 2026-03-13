import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
const { expect } = chai;
chai.use(chaiAsPromised);

let isKebabName: any;
let toKebabName: any;
let FilepathConfig: any;

async function assertRoundTrip<T>(
    clazz: { new(): T; fromJson(json: string): Promise<[T | null, any | null]> },
    obj: T
) {
    const json = (obj as any).toJson ? (obj as any).toJson() : JSON.stringify(obj);
    const [inst, err] = await clazz.fromJson(json);
    expect(err).to.be.null;
    expect(inst).to.be.instanceOf(clazz as any);
    expect(inst).to.deep.equal(obj);
}

before(async () => {
    const domain = await import('../../../src/domain/config/filepath-config.ts');
    isKebabName = (domain as any).isKebabName || (domain as any).default?.isKebabName;
    toKebabName = (domain as any).toKebabName || (domain as any).default?.toKebabName;
    FilepathConfig = (domain as any).FilepathConfig || (domain as any).default?.FilepathConfig;
});

describe('FilepathConfig domain', function () {
    // ── isKebabName ───────────────────────────────────────────────────────────

    describe('isKebabName', function () {
        it('accepts simple lowercase word', () => {
            expect(isKebabName('nginx')).to.be.true;
        });
        it('accepts lowercase-digit compound', () => {
            expect(isKebabName('app1-logs')).to.be.true;
        });
        it('accepts multi-segment kebab', () => {
            expect(isKebabName('nginx-access-log')).to.be.true;
        });
        it('rejects uppercase', () => {
            expect(isKebabName('Nginx')).to.be.false;
        });
        it('rejects spaces', () => {
            expect(isKebabName('my name')).to.be.false;
        });
        it('rejects leading hyphen', () => {
            expect(isKebabName('-foo')).to.be.false;
        });
        it('rejects trailing hyphen', () => {
            expect(isKebabName('foo-')).to.be.false;
        });
        it('rejects double hyphen', () => {
            expect(isKebabName('foo--bar')).to.be.false;
        });
        it('rejects empty string', () => {
            expect(isKebabName('')).to.be.false;
        });
    });

    // ── toKebabName ───────────────────────────────────────────────────────────

    describe('toKebabName', function () {
        it('lowercases uppercase chars', () => {
            expect(toKebabName('NginxAccess')).to.equal('nginxaccess');
        });
        it('replaces spaces with hyphens', () => {
            expect(toKebabName('my app log')).to.equal('my-app-log');
        });
        it('replaces special chars with hyphens and deduplicates', () => {
            expect(toKebabName('My.App/Log')).to.equal('my-app-log');
        });
        it('strips leading and trailing hyphens', () => {
            expect(toKebabName('  leading-trailing  ')).to.equal('leading-trailing');
        });
    });


    // ── serialization behaviour ───────────────────────────────────────────────

    describe('serialization/validation', function () {
        it('round-trips a valid instance', async () => {
            const cfg = new FilepathConfig();
            cfg.shortName = 'my-source';
            cfg.pathPattern = '/var/log/*.log';
            cfg.description = 'example';
            cfg.tags = ['foo', 'bar'];

            await assertRoundTrip(FilepathConfig, cfg);
        });

        it('toJson produces parseable JSON with the expected props', () => {
            const cfg = new FilepathConfig();
            cfg.shortName = 'test';
            cfg.pathPattern = '*.log';
            const json = cfg.toJson();
            const obj = JSON.parse(json);
            expect(obj).to.include({ shortName: 'test', pathPattern: '*.log' });
        });

        it('fromJson returns instance when given output of toJson', async () => {
            const cfg = new FilepathConfig();
            cfg.shortName = 'round';
            cfg.pathPattern = '/x';
            const json = cfg.toJson();
            const [parsed, err] = await FilepathConfig.fromJson(json);
            expect(err).to.be.null;
            expect(parsed).to.be.instanceOf(FilepathConfig);
            expect(parsed).to.deep.equal(cfg);
        });

        it('rejects missing required property', async () => {
            const json = JSON.stringify({

                pathPattern: '/tmp/x'
            });

            const [cfg, err] = await FilepathConfig.fromJson(json);
            expect(cfg).to.be.null;
            expect(err).to.exist;
            expect(err[0].property).to.equal('shortName');
        });

        it('rejects invalid shortName format', async () => {
            const json = JSON.stringify({
                shortName: 'Bad Name!',
                pathPattern: '/tmp/x'
            });

            const [cfg, err] = await FilepathConfig.fromJson(json);
            expect(cfg).to.be.null;
            expect(err).to.exist;
            expect(err[0].property).to.equal('shortName');
        });

        it('rejects extra properties', async () => {
            const json = JSON.stringify({
                shortName: 'ok',
                pathPattern: '/tmp/x',
                extra: 42
            });

            const [cfg, err] = await FilepathConfig.fromJson(json);
            expect(cfg).to.be.null;
            expect(err).to.exist;
            expect(err.some((v: any) => v.property === 'extra')).to.be.true;
        });
    });
});
