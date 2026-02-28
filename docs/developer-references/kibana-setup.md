# Kibana Instance Setup (Developer Reference)

This document explains how to launch a Kibana server for local development and
end-to-end testing of the LogExplorer extension. Two methods are supported:

1. **Lightweight single-container helper** (`scripts/kibana.sh`)
2. **Full stack via Docker Compose** (`scripts/compose.sh`)

Both approaches are usable from Windows (Git Bash/WSL), macOS, and Linux.

---

## Prerequisites

* Docker Engine or Docker Desktop installed and running.
* A POSIX shell (`bash`) for the helper scripts.
* Node.js is required only to run the integration tests (`npm run test:kibana`).

Optional:

* `docker-compose` binary or the newer `docker compose` plugin (the wrapper
  script chooses automatically).

---

## Method 1 – Helper script

Use this when you only need Kibana (no Elasticsearch) or want fine-grained
control from within tests.

### Commands

```bash
# start, specifying version or rely on versions file
./scripts/kibana.sh start --version 8.4.0

# query current container
./scripts/kibana.sh status

# stop container
./scripts/kibana.sh stop
```

Output is JSON containing `host`, `port`, `version`, and `containerId`.
The `--port` flag may be provided to select a host port; otherwise Docker will
assign a random port to avoid collisions.

### Configuration

* `kibana-versions.txt` in repo root lists default versions to test.
* `KIBANA_VERSIONS` (comma-separated) env var overrides the file for tests.

### Integration tests

Run with `npm run test:kibana`; this compiles and executes the test suite,
which loops over configured versions and exercises `/api/status`.

---

## Method 2 – Docker Compose stack

When you need Elasticsearch alongside Kibana or prefer a preconfigured network,
this method brings up both services with one command.

```bash
# start services
./scripts/compose.sh up

# show running containers
./scripts/compose.sh ps

# tear down
./scripts/compose.sh down
```

By default the compose file (located at `test/e2e/docker-compose.yml`) exposes
only the container port 5601. Docker selects a free host port if 5601 is busy;
use `docker compose port kibana 5601` or the `ps` command above to see the
actual mapping.

### Environment variables

* `KIBANA_VERSION` – Kibana image tag (default `8.4.0`)
* `ELASTICSEARCH_VERSION` – Elasticsearch image tag (default `8.4.0`)

---

## Notes

* Containers started via Compose can also be queried with
  `./scripts/kibana.sh status` (it works against any running Kibana container).
* The compose setup may be slower to start since it pulls both images.
* Port-in-use errors are handled by random host-port allocation in both
  helpers.

This reference is intended for contributors who need to spin up a Kibana backend
to exercise extension functionality or write further integration tests.