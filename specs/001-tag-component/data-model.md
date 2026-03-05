# Data Model: Tag Component

The feature introduces the following simple entities, used for UI state and
configuration persistence.

- **Tag**
  - Type: `string` (plain text)
  - Constraints: trimmed, non-empty
  - Normalization: stored lowercase for comparison; display retains user-provided
    casing.

- **TagSet**
  - Type: `string[]`
  - Description: an ordered list of `Tag` values attached to a configuration
    object such as a log-file-source.
  - Stored as part of existing config JSON; no schema change required beyond
    treating `tags` property as an array if not already.

No additional domain models or persisted tables are required. The component
operates entirely in memory; persistence is handled by the host panels via the
existing `ConfigStore` logic.