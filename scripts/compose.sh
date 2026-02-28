#!/usr/bin/env bash
# Convenience wrapper for docker-compose use with the Kibana integration stack.
# Designed for WSL or any POSIX shell environment.
# The compose file lives in test/e2e/docker-compose.yml to isolate it from
# normal development workflows.

set -euo pipefail

COMPOSE_FILE="test/e2e/docker-compose.yml"
cmd="${1:-up}"

case "$cmd" in
    up)
        echo "Starting Elasticsearch + Kibana via docker-compose (file: $COMPOSE_FILE)..."
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose -f "$COMPOSE_FILE" up -d
        else
            echo "warning: docker-compose not found, trying 'docker compose' plugin"
            docker compose -f "$COMPOSE_FILE" up -d
        fi
        ;;
    down)
        echo "Stopping and removing the compose stack (file: $COMPOSE_FILE)..."
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose -f "$COMPOSE_FILE" down
        else
            docker compose -f "$COMPOSE_FILE" down
        fi
        ;;
    ps)
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose -f "$COMPOSE_FILE" ps
        else
            docker compose -f "$COMPOSE_FILE" ps
        fi
        ;;
    help|--help|-h)
        cat <<'EOF'
Usage: compose.sh [up|down|ps]

Commands:
  up     Start the stack (background)
  down   Stop and remove containers
  ps     List running services
EOF
        ;;
    *)
        echo "Unknown command: $cmd" >&2
        exit 1
        ;;
esac
