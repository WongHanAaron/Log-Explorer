# Phase 0 Research: FileAccessConfigs

This feature largely mirrors the existing FilePathConfig editor. Research
focused on identifying any gaps when adapting that pattern for a new config
type and understanding how adapter-specific settings should be modeled.

## Decisions

| Unknown | Decision | Rationale |
|---------|----------|-----------|
| How to render adapter-specific settings in the editor panel | Reuse the
  existing dynamic field renderer from FilePathConfig, which inspects the
  config object's `adapterType` and displays a sub-form using a schema map.
  Add new schema definitions for `sftp`, `smb`, and `local`. | Avoids
  duplicating UI logic; keep adapter schemas next to domain types for
  consistency.
| Config-store collection/namespace for file access configs | Use a new
  category `ConfigCategory.FileAccess` (enum addition) and store files as
  `.logex/fileaccess-configs/*.json` matching the filepath pattern. | Matches
  existing convention and keeps data segregated.
| Command and panel identifier names | Register command under
  `logExplorer.openFileAccessConfigs` and panel in webview namespace
  `FileAccessConfigsPanel`. | Follows naming scheme from FilePathConfig.
| Handling validation & uniqueness | Leverage `ConfigParser` utility used by
  FilePathConfig, extend it with a `parseFileAccessConfig` method; enforce
  unique `name` property at save time. | Reuses parser infrastructure.

## Alternatives Considered

- **Separate lightweight panel**: Implement list and editor from scratch
  without reusing FilePathConfig code.  Rejected because it would duplicate
  thousands of lines of existing UI and increase maintenance burden.
- **Store configs in a single JSON file**: Could have used one file with an
  array.  Rejected because the existing store abstraction uses per-config
  files and subscriptions operate at file granularity; rewriting that would be
  larger than adding a new category.

## Tasks Generated

1. Research `ConfigStore` API to confirm how to add a new category and
   subscribe to it.  (already familiar, low effort.)
2. Inspect FilePathConfig source (webview, command, editor) to extract
   reusable components and patterns.
3. Identify schema for FileAccessConfig and decide which adapter types to
   include initially (sftp, smb, local).
4. Verify that search/list component supports two columns and filtering by
   multiple properties; if not, plan to enhance it.

## Conclusion

No major technical unknowns remain; all research yielded clear reuse
opportunities. The primary work will be implementation of the new UI panel,
command, and config category along the same lines as FilePathConfig. With the
above decisions recorded, we can proceed to Phase 1 design.