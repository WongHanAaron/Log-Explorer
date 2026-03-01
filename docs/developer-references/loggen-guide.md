# LogGen Developer Reference

This document explains how developers can run and extend the `loggen` utility
that lives in the repository under `tools/loggen.ts` (with a small JavaScript
bootstrap `tools/loggen.js`). The tool is intended to generate synthetic log
files and optionally deploy/clean them inside Docker containers, primarily for
end-to-end testing of the LogExplorer extension.

## Running the tool

A helper npm script has been added so the TypeScript source can be executed
without manual compilation:

```bash
# show help
npm run loggen -- --help

# generate logs using the included sample configuration
npm run loggen -- generate \
    --config tools/samples/sample-log-config.json \
    --output /tmp/logs --count 2

# deploy the generated files into a container
npm run loggen -- deploy --target mycontainer:/var/logs --source /tmp/logs

# cleanup the container path
npm run loggen -- cleanup --target mycontainer:/var/logs
```

> The `--` after `npm run loggen` passes arguments through to the underlying
> `ts-node` invocation.

The script is defined in `package.json`:

```json
"scripts": {
  "loggen": "ts-node tools/loggen.ts",
  ...
}
```

If you prefer to bypass npm you can simply run the bootstrap directly:

```bash
node tools/loggen.js generate --config ...
```

## Options

### generate

```
loggen generate --config <path> --output <dir> [--count <n>]
              [--format <text|es-bulk>] [--filename <pattern>]
```

* `--config` – path to a JSON configuration describing the fields and
timestamps.
* `--output` – directory where files will be written. Subdirectories may be
specified via the `--filename` pattern.
* `--count` – number of files to emit (default 1).
* `--format` – `text` or `es-bulk`; the latter emits a simple Elasticsearch
  bulk ingestion payload.
* `--filename` – relative filename pattern. Tokens supported:
  * `{i}` – current index (0-based)
  * `{timestamp}` – current UNIX timestamp in ms
  * `{random}` – a random integer (0–1e9) for uniqueness

Example:

```bash
npm run loggen -- generate ... --count 3 --filename "sub/evt-{i}-{random}.log"
```

### deploy

```
loggen deploy --target <container:path> [--source <dir>]
```

Copies all files from `source` (current working directory by default) into the
given container and path using `docker cp`.

### cleanup

```
loggen cleanup --target <container:path>
```

Executes `docker exec <container> rm -rf <path>/*` to remove previously deployed
files.

## Configuration file format

A configuration object has the following shape:

```json
{
  "format": "text",
  "entries": 100,
  "fields": [
    { "name": "timestamp", "type": "iso", "format": "yyyyMMdd-HHmmss" },
    { "name": "level", "type": "enum", "values": ["info","error"] },
    { "name": "msg", "type": "sentence" }
  ],
  "randomize": true,
  "timestampMode": "sequential"
}
```

* `format`, `entries` and `fields` are required.
* `fields` is an array; each element has `name` and `type`.
* Supported types:
  * `iso` – ISO timestamp. May include optional `format` to override the
    output pattern (see date tokens below) and `increment` for sequential
    mode.
  * `enum`, `sentence`, `number` – see source for handling logic.

### Date format tokens

If an `iso` field has a `format` property, it is used to format the generated
`Date` object. Supported tokens:

* `yyyy` – four‑digit year
* `MM` – month (01–12)
* `dd` – day (01–31)
* `HH` – hour (00–23)
* `mm` – minute (00–59)
* `ss` – second (00–59)
* `SSS` – milliseconds (000–999)

These are replaced literally; for example `yyyyMMdd-HHmmss` produces
`20260228-151230`.

## Development notes

* The implementation is in TypeScript (`tools/loggen.ts`); the JS bootstrap
  (`tools/loggen.js`) loads it via `ts-node` so the code can run directly.
* Unit tests live in `test/unit/loggen.test.ts`; they exercise generation,
  deploy/cleanup mocks and formatting behaviour. E2E tests are under
  `test/e2e/loggen.e2e.ts` and spawn a real container.
* When editing the tool, you can run `npm run test:e2e-data` to verify
  regressions.
* The sample configuration file (`tools/samples/sample-log-config.json`) is
  committed and updated with new format examples as features evolve.

---

This reference should help any developer understand and extend the loggen
utility. Feel free to expand it with more examples or internal comments as
needed.