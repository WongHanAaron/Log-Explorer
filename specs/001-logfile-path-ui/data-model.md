# Data Model: Log File Path Config Split‑View

The feature does not introduce new persistent entities; it operates on the
existing `LogFilePathConfig` objects managed by `ConfigStore`.

## LogFilePathConfig

Represents a saved configuration for mapping a file path to log parsing rules.
Fields are defined in `src/domain/filelog-config.ts` but include:

- `name: string` – unique identifier displayed in the list.
- `path: string` – file system path or glob.
- `lineRegex: string` – regex used to split lines (etc.).
- Additional parser options as defined by the current model.

The panel will load and edit complete `LogFilePathConfig` instances.

## Transient UI state

- **SearchState** (`string`) – current search filter text entered by the user.
- **SelectedConfig** (`string | null`) – name of the config currently loaded in
the right‑hand editor.

No new backend data storage or serialization is required; the view merely
surfaces and modifies existing objects.
