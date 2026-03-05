# Data Model: LogFileSourcesPanel

This feature reuses the existing **FilepathConfig** entity. No new persistent data structures are required.

## FilepathConfig

Represents a configuration that describes how to locate a set of log files.

| Field         | Type   | Description |
|---------------|--------|-------------|
| `shortName`   | string | Unique kebab-case identifier; used as the filename in `.logex/filepath-configs/{shortName}.json`. |
| `label`       | string | Human-readable label displayed in the UI. |
| `pathPattern` | string | Filesystem path or glob pattern matching the log files. |
| `description` | string\|undefined | Optional notes about the configuration. |

### Relationships

- Stored on disk under the workspace root; no database involved.
- Used by other panels (e.g., log file lines editor) when constructing sessions.

### Validation rules

- `shortName` must be non-empty and match `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
- `label` and `pathPattern` are required and non-blank.

No schema changes accompany this feature since the underlying type already exists in `src/domain/filepath-config.ts`.
