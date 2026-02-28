#!/usr/bin/env bash
# Helper script for starting/stopping a Kibana Docker container for testing.
# Usage: ./scripts/kibana.sh <command> [options]

set -euo pipefail

# Variables that may be overridden by flags
KIBANA_VERSION=""
HOST_PORT=""
CONTAINER_ID_FILE=".kibana_container"

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

check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo "Error: docker CLI not found. Please install Docker and ensure \"docker\" is on your PATH." >&2
        exit 1
    fi
    # try a simple command to ensure docker daemon responds
    if ! docker version >/dev/null 2>&1; then
        echo "Error: Docker daemon not responding. Please start Docker." >&2
        exit 1
    fi
}

choose_host_port() {
    # if user supplied a port, use it
    if [ -n "$HOST_PORT" ]; then
        echo "$HOST_PORT"
        return
    fi
    # default port
    local default=5601
    # check using bash TCP redirection (works on most Unix shells)
    if (echo > /dev/tcp/localhost/$default) >/dev/null 2>&1; then
        # port busy; let docker assign random port later
        echo ""
    else
        echo "$default"
    fi
}

parse_global_flags() {
    # simple loop to pull --version and --port from args
    local args=()
    while [ $# -gt 0 ]; do
        case "$1" in
            --version)
                shift
                KIBANA_VERSION="$1"
                ;;
            --port)
                shift
                HOST_PORT="$1"
                ;;
            start|stop|status|help|-h|--help)
                args+=("$1")
                ;;
            *)
                args+=("$1")
                ;;
        esac
        shift || break
    done
    set -- "${args[@]}" # reassign positional parameters
    cmd="${1:-help}"
    shift || true
}

# initial checks
check_docker
parse_global_flags "$@"

read_default_version() {
    # prefer explicitly set variable
    if [ -n "$KIBANA_VERSION" ]; then
        echo "$KIBANA_VERSION"
        return
    fi
    # environment override
    if [ -n "${KIBANA_VERSION:-}" ]; then
        echo "$KIBANA_VERSION"
        return
    fi
    # read first non-comment non-empty line of kibana-versions.txt
    if [ -f kibana-versions.txt ]; then
        while IFS= read -r line; do
            line="${line%%#*}"    # strip comments
            line="$(echo -n "$line" | xargs)"  # trim whitespace
            if [ -n "$line" ]; then
                echo "$line"
                return
            fi
        done < kibana-versions.txt
    fi
    echo ""    # empty if none found
}

save_container_id() {
    local id="$1"
    echo "$id" > "$CONTAINER_ID_FILE"
}

load_container_id() {
    if [ -f "$CONTAINER_ID_FILE" ]; then
        cat "$CONTAINER_ID_FILE"
    else
        echo ""  # no container info
    fi
}

start_container() {
    local version="$(read_default_version)"
    if [ -z "$version" ]; then
        echo "Error: No Kibana version specified and no default found." >&2
        exit 1
    fi
    # choose host port
    local hostport="$(choose_host_port)"
    local port_arg=""
    if [ -n "$HOST_PORT" ]; then
        port_arg="-p $HOST_PORT:5601"
        hostport="$HOST_PORT"
    elif [ -n "$hostport" ]; then
        port_arg="-p $hostport:5601"
    else
        port_arg="-P"  # random port assignment
    fi
    # check if container already running
    local existing="$(load_container_id)"
    if [ -n "$existing" ] && docker ps -q --filter id="${existing}" | grep -q .; then
        # container still running
        echo "{\"host\":\"localhost\",\"port\":${hostport:-null},\"version\":\"$version\",\"containerId\":\"$existing\"}"
        return
    fi
    # start new container
    local cid
    cid=$(docker run -d $port_arg "docker.elastic.co/kibana:$version")
    save_container_id "$cid"
    # if we let docker choose port, query it
    if [ -z "$hostport" ]; then
        hostport=$(docker port "$cid" 5601/tcp | sed 's/.*://')
    fi
    printf '{"host":"localhost","port":%s,"version":"%s","containerId":"%s"}\n' "$hostport" "$version" "$cid"
}

stop_container() {
    local cid="${1:-$(load_container_id)}"
    if [ -z "$cid" ]; then
        echo "No container ID known; nothing to stop." >&2
        exit 1
    fi
    docker stop "$cid" >/dev/null 2>&1 || true
    docker rm "$cid" >/dev/null 2>&1 || true
    rm -f "$CONTAINER_ID_FILE" >/dev/null 2>&1 || true
    echo "Stopped container $cid"
}

status_container() {
    local cid="${1:-$(load_container_id)}"
    if [ -z "$cid" ]; then
        echo "{}"
        return
    fi
    if ! docker ps -q --filter id="$cid" | grep -q .; then
        echo "{}"
        return
    fi
    local port
    port=$(docker port "$cid" 5601/tcp | sed 's/.*://')
    local version="$(docker inspect --format='{{index .Config.Image}}' "$cid" | awk -F: '{print $2}')"
    printf '{"host":"localhost","port":%s,"version":"%s","containerId":"%s"}\n' "$port" "$version" "$cid"
}

# command dispatch
case "$cmd" in
    start)
        start_container "$@"
        ;;
    stop)
        stop_container "$@"
        ;;
    status)
        status_container "$@"
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
