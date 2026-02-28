#!/usr/bin/env bash
# Convenience wrapper for docker-compose use with the Kibana integration stack.
# Designed for WSL or any POSIX shell environment.

set -euo pipefail

cmd="${1:-up}"

case "$cmd" in
    up)
        echo "Starting Elasticsearch + Kibana via docker-compose..."
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose up -d
        else
            echo "warning: docker-compose not found, trying 'docker compose' plugin"
            docker compose up -d
        fi
        ;;
    down)
        echo "Stopping and removing the compose stack..."
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose down
        else
            docker compose down
        fi
        ;;
    ps)
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose ps
        else
            docker compose ps
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
