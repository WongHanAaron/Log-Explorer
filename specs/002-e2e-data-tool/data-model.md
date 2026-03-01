# Data Model

This feature mostly deals with transient, generated data. Minimal formal
entities exist.

## Entities

- **LogConfig**: JSON object defining how logs should be generated. Fields may
  include `format` (e.g. "apache", "json"), `entries` (number of lines),
  `fields` (array of field definitions with names/types), `outputFormat`
  (`text` or `es-bulk`), and `filePrefix`.

- **GeneratedLogFile**: File on disk containing `LogConfig.entries` lines
  formatted according to the configuration. Attributes include `path`,
  `sizeBytes`, `createdAt`.

- **ContainerTarget**: Pair comprised of a container identifier and a
  filesystem path inside the container where logs are deployed.

No persistent storage is required; all entities live in memory or as filesystem
artifacts during execution.