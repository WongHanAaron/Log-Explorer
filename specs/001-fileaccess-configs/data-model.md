# Data Model: FileAccessConfig

The `FileAccessConfig` entity represents a named configuration for a file
access adapter. It is stored in the config-store under the new category
`FileAccess` and persisted to disk as JSON in `.logex/fileaccess-configs/<name>.json`.

## FileAccessConfig

| Field        | Type                       | Description |
|--------------|----------------------------|-------------|
| `id`         | `string` (UUID or name)    | Unique identifier (filename without extension). |
| `name`       | `string`                   | Human-readable name; must be unique within the store. |
| `adapterType`| `'local' |'sftp' |'smb'` | Determines which adapter will be used and which settings are required. |
| `settings`   | `object`                   | Adapter-specific configuration parameters.  See schema below. |

### Adapter-specific schemas

#### Local

```ts
interface LocalSettings {
  basePath: string;        // path on the local filesystem
}
```

#### SFTP

```ts
interface SftpSettings {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  root?: string;
}
```

#### SMB

```ts
interface SmbSettings {
  share: string;
  username?: string;
  password?: string;
  domain?: string;
}
```

The `settings` field is validated according to the selected `adapterType`.
Validation utilities will be added to `ConfigParser` analogous to
`parseFilepathConfig`.

## Relationships

This entity is independent; it does not reference other domain entities.
However, the adapter classes in `services/fileaccess` will consume
`FileAccessConfig` objects when instantiated via the factory.

## Storage Format

Each config file is a JSON object matching the `FileAccessConfig` interface.
Example:

```json
{
  "id": "sftp-logs",
  "name": "SFTP Logs",
  "adapterType": "sftp",
  "settings": {
    "host": "example.com",
    "username": "user",
    "password": "pass",
    "root": "/var/logs"
  }
}
```

No additional data-model artifacts are required; the existing `ConfigStore`
is generic enough to handle the new type once the enum and parser are
extended.