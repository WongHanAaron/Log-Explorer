# CLI Contract: `scripts/kibana.sh`

This document describes the public commands and flags for the Kibana helper
script used by developers and tests.

## Usage

```bash
./scripts/kibana.sh <command> [options]
```

### Commands

- `start` – start a Kibana container.
  - Flags:
    - `--version <version>`: Kibana version tag (default read from
      `kibana-versions.txt` first line or `KIBANA_VERSION` env var).
    - `--port <port>`: host port to bind; default 5601, or random if occupied.
    - `--detach`: run container in background (default for tests).
  - Output: prints JSON with `host`, `port`, `version`, and `containerId`.

- `stop` – stop and remove the container previously started by this script.
  - Flags:
    - `--container <id>`: identifier of container to stop; otherwise uses a
      cached value from last `start` invocation.

- `status` – query running container; returns JSON with same fields as `start`.

- `help` – display usage information.

## Behavior

- Invoking `start` when a container is already running will return the existing
  details rather than create a new container.
- Errors are printed to stderr and the script exits with nonzero status.

## Integration Test Contract

The automated test will call the script via `npm run test:kibana`, which will
internally execute a node script that shells out to `scripts/kibana.sh` and
parses its JSON output. The test must clean up the container after each
version.
