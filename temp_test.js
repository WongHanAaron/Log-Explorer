(async () => {
    const { ConfigParser } = require('./src/services/config-store.ts');
    try {
        const bad = '{"shortName":"a","adapterType":"local","settings":null}';
        const res = await ConfigParser.parseFileAccessConfig(bad);
        console.log('result', res);
    } catch (e) {
        console.error('err', e);
    }
})();
