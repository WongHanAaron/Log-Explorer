# Quickstart: Using the Kibana Integration Tools

These steps get you up and running with a local Kibana instance for testing.

1. **Ensure prerequisites**
   * Docker Desktop or Docker Engine installed and running.
   * Node.js (already required by the project) for running test scripts.
   * A POSIX‑style shell (`bash`) is required to run `scripts/kibana.sh`.
     On Windows this typically means using Git Bash, WSL, or similar.
   * (Optional) Docker Compose/final plugin if you prefer to spin up Elasticsearch
     + Kibana together; install either the standalone `docker-compose` binary or
     the newer `docker compose` plugin. `scripts/compose.sh` will try whichever
     command is available.

2. **Start a Kibana container**

   ```bash
   cd /path/to/LogExplorer
   # start with explicit version, default port 5601 (or random if busy)
   ./scripts/kibana.sh start --version 8.4.0
   
   # or let the script pick the version from kibana-versions.txt
   ./scripts/kibana.sh start
   ```

3. **Check container status**

   ```bash
   ./scripts/kibana.sh status
   ```

4. **Stop the container**

   ```bash
   ./scripts/kibana.sh stop
   ```

   Output will be JSON similar to:

   ```json
   {"host":"localhost","port":5601,"version":"8.4.0","containerId":"abcd1234"}
   ```

   If port 5601 is already in use the script will choose a random available
   host port and report it.

3. **Verify connectivity**

   ```bash
   curl http://localhost:5601/api/status
   ```

   Expect HTTP 200 with version details.

4. **Stop the container**

   ```bash
   ./scripts/kibana.sh stop --container abcd1234
   ```

   Or simply run `./scripts/kibana.sh stop` if you only have one instance.

5. **Run the automated integration tests**

   A helper npm script is provided:

   ```bash
   npm run test:kibana
   ```

   This command reads `kibana-versions.txt` (or the `KIBANA_VERSIONS` env var),
   launches each version in turn, performs a simple API check, and cleans up
afterwards.  It exits with zero if all versions passed, nonzero otherwise.

6. **Customizing versions**

   Edit `kibana-versions.txt` in the repo root to change which major versions are
   exercised. Use `#` for comments. Alternatively, set environment variable
   `KIBANA_VERSIONS="7.16.3,8.4.0"` before running the tests.

7. **Using Docker Compose (WSL-friendly)**

   You can start both Elasticsearch and Kibana with a single command via the
   supplied wrapper:

   ```bash
   ./scripts/compose.sh up
   ```

   This is the same as running `docker-compose up -d` but ensures the
   executable has the proper permissions on Windows/WSL. The script accepts
   `down` and `ps` subcommands as well. It respects the `KIBANA_VERSION` and
   `ELASTICSEARCH_VERSION` environment variables (defaults are `8.4.0`).

   By default the compose file now only exposes port 5601 on the container and
   lets Docker choose a host port, which avoids conflicts. Use
   `docker compose port kibana 5601` or `./scripts/compose.sh ps` to discover
   the mapped host port. You can also still interrogate Kibana via
   `./scripts/kibana.sh status` once the stack is running.

   Tear everything down with
   `./scripts/compose.sh down`.

That's it! The quickstart above gets developers and CI configured for Kibana
integration.