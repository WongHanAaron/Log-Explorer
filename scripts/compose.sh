#!/usr/bin/env bash
# Convenience wrapper for docker-compose use with the Kibana integration stack.
# Designed for WSL or any POSIX shell environment.

set -euo pipefail

cmd="${1:-up}"

case "$cmd" in
    up)
        echo "Starting Elasticsearch + Kibana via docker-compose..."
        docker-compose up -d
        ;;
    down)
        echo "Stopping and removing the compose stack..."
        docker-compose down
        ;;
    ps)
        docker-compose ps
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
