#!/usr/bin/env bash
# Helper script for starting/stopping a Kibana Docker container for testing.
# Usage: ./scripts/kibana.sh <command> [options]

set -euo pipefail

show_help() {
    cat <<'EOF'
Usage: kibana.sh <command> [options]

Commands:
  start   Start a Kibana container
  stop    Stop the running Kibana container
  status  Show status of the container
  help    Display this message

Global options:
  --version <version>   Kibana version tag to use (overrides config)
  --port <port>         Host port to bind (default 5601 or random if busy)
EOF
}

# simple dispatch
cmd="${1:-help}"
shift || true

case "$cmd" in
    start)
        # will implement later
        ;;
    stop)
        ;;
    status)
        ;;
    help|--help|-h)
        show_help
        exit 0
        ;;
    *)
        echo "Unknown command: $cmd" >&2
        show_help
        exit 1
        ;;
esac
