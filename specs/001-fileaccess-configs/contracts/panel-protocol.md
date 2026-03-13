# Panel Protocol: FileAccessConfigs

This document describes the message exchange between the webview and host
for the FileAccessConfigs panel.  It mirrors the protocol used by the
FilepathConfig panel, with minor additions for the new config type.

## Host → Webview messages

- `init`: sent when the panel first loads.  Payload:
  ```ts
  { type: 'init'; configs: string[]; current?: FileAccessConfig | null; }
  ```
- `configListChanged`: sent whenever the set of config names changes (added or
  removed).  Payload: `{ type: 'configListChanged'; configs: string[] }`.
- `configData`: delivered in response to a `selectConfig` request, contains the
  full `FileAccessConfig` object from the store.
- `fileaccess-config:save-result`: result of a save operation.
  `{ type: 'fileaccess-config:save-result'; success: boolean; errorMessage?: string }`.
- `fileaccess-config:name-available`: response to name validation request.
  `{ type: 'fileaccess-config:name-available'; available: boolean }`.

## Webview → Host messages

- `selectConfig`: user clicked a config name.
  `{ type: 'selectConfig'; name: string }`.
- `fileaccess-config:save`: save the config data provided by the form.
  `{ type: 'fileaccess-config:save'; config: FileAccessConfig }`.
- `fileaccess-config:validate-name`: host should check shortName uniqueness.
  `{ type: 'fileaccess-config:validate-name'; shortName: string }`.
- `fileaccess-config:delete`: delete the config with the given shortName.
  `{ type: 'fileaccess-config:delete'; shortName: string }`.

## Error Handling

- Host messages may include an error message field.  Webview should display
  these to the user and allow retry.
- Webview should guard against unexpected message types by ignoring them and
  logging a console warning.
