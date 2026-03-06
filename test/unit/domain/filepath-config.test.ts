import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
const { expect } = chai;
chai.use(chaiAsPromised);
import {
    isKebabName,
    toKebabName,
    FilepathConfig
} from '../../../src/domain/filepath-config';
import { assertRoundTrip } from './utils';

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
            cfg.label = 'My Source';
            cfg.pathPattern = '/var/log/*.log';
            cfg.description = 'example';
            cfg.tags = ['foo', 'bar'];

            await assertRoundTrip(FilepathConfig, cfg);
        });

        it('rejects missing required property', async () => {
            const json = JSON.stringify({
                label: 'No name',
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
                label: 'Label',
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
                label: 'Label',
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
