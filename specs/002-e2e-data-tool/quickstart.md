# Quickstart: E2E Data Tool

This document explains how to use the log‑generation utility for end‑to‑end
testing.

## Prerequisites

* Node.js 18+ installed.
* Docker (with CLI) available on the host.
* A POSIX shell (`bash`) for running the tool scripts.

## Generating Logs

```bash
# generate two log files using sample config
npm run loggen -- generate --config configs/sample-log-config.json \
    --output /tmp/logs --count 2

# you can control the name (and even subdirectory) of each file;
# supported tokens are {i}, {timestamp}, and {random}:
npm run loggen -- generate --config configs/sample-log-config.json \
    --output /tmp/logs --count 3 --filename "sub/roll-{i}-{random}.log"
```

*ISO timestamps* may be customized in the config by supplying a `format`
string on an `iso` field (see below).

The output folder will contain files like `/tmp/logs/log-20260228-001.txt`.

## Deploying into a Container

```bash
node tools/loggen.js deploy --target mycontainer:/var/logs --source /tmp/logs
```

This copies all files from the source directory into the indicated path inside
the named container.

## Cleaning Up

```bash
node tools/loggen.js cleanup --target mycontainer:/var/logs
```

Removed files will be listed on stdout.

## Config File Example

```json
{
  "format": "json",
  "entries": 100,
  "fields": [
    {"name": "timestamp", "type": "iso"},
    {"name": "level", "type": "enum", "values": ["info","error"]},
    {"name": "message", "type": "sentence"}
  ]
}
```

## Notes

* The same tool may later support `--format es-bulk` to produce Elasticsearch
  bulk upload payloads or even push directly to an ES/Kibana instance.
* To run unit tests for the tool:

  ```bash
  npm run test:e2e-data
  ```

which will compile and execute the test files under `test/unit` and `test/e2e`.
