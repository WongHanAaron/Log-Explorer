# Data Model for Log File Source Editor Save

This feature operates on the existing `FilepathConfig` domain object, which is already
defined in `src/domain/filepath-config.ts`. No new persistent entities are introduced.

## FilepathConfig (existing)

- **shortName**: `string` — kebab‑cased identifier used as the filename when stored.
- **pathPattern**: `string` — glob or absolute path pattern for log files.
- **description**: `string | undefined` — optional human‑readable notes.
- **tags**: `string[]` — optional list; added in earlier tag component work.
- **schemaVersion**: number — used for future migrations (not touched here).

## In‑memory state (webview)

- `shortName`, `pathPattern`, `description`, and `tags` maintained via React `useState`.
- `errors` object holds validation messages for short name and path pattern.
- `status` holds success/error feedback from save attempts.
- `savedConfig` snapshot mirrors a `FilepathConfig` trimmed to current values and is used
to detect whether the form has unsaved changes.
- `canSave` is a derived boolean: `validateForm() && dirty`.

The webview posts `filepath-config:save` messages containing a trimmed `FilepathConfig`.
The panel persists these via `ConfigStore` to JSON files under `.logex/filepath-configs/`.

No additional data model artifacts are required for this feature.
