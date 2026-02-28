# Data Model

This feature does not introduce any persistent data structures. All
``Kibana Instance`` information is transient and derived from Docker container
state.

## Entities

- **Kibana Instance**
  - `version`: string (e.g. "8.4.0")
  - `host`: hostname or IP (typically `localhost`)
  - `port`: integer assigned on host
  - `containerId`: Docker container identifier

- **Version List**
  - a list of version strings read from `kibana-versions.txt` or environment.

No relationships or storage rules apply beyond the ephemeral lifecycle of
containers.
