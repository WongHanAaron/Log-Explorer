# Data Model: File Access Adapters

This feature introduces several related types and classes that comprise the
adapter framework. The model is primarily TypeScript interfaces and class
definitions; relationships are indicated by inheritance and composition.

## Types

### FileSourceConfig (discriminated union)

| Variant     | Fields |
|-------------|--------|
| `LocalConfig`  | `type: "local"`<br>`basePath: string` |
| `SftpConfig`   | `type: "sftp"`<br>`host: string`<br>`port?: number`<br>`username?: string`<br>`password?: string`<br>`privateKey?: string | Buffer`<br>`root?: string` |
| `SmbConfig`    | `type: "smb"`<br>`share: string`<br>`username?: string`<br>`password?: string`<br>`domain?: string` |

### ListDirOptions

- `recursive?: boolean` – if true, traverse directories
- `maxDepth?: number` – limit recursion depth (0 = only given directory)

## Classes

### FileAccessAdapter (abstract)

- **constructor**(config: FileSourceConfig)
- **readFile(path: string): Promise<Buffer>** – abstract
- **listDir(path: string, options?: ListDirOptions): Promise<string[]>** – abstract
- Optional helpers:
  - `stat?(path: string): Promise<any>`
  - `delete?(path: string): Promise<void>`

The base class doesn't implement behavior but may provide shared utilities
(e.g. normalizing paths, validating options).

### Concrete Subclasses

- **LocalFileAdapter** extends `FileAccessAdapter` and implements all methods
  using `fs.promises`. Supports optional `stat` and `delete`.
- **SftpFileAdapter** extends `FileAccessAdapter`, internally holds an
  `ssh2-sftp-client` instance. Implements recursive `listDir` by walking remote
  directories. Supports `stat` and `delete` through the client.
- **SmbFileAdapter** extends `FileAccessAdapter` and wraps an `smb2` client.
  Methods map to the SMB API; recursive listing uses a similar walk function.

### Factory

- **createFileAdapter(config: FileSourceConfig): FileAccessAdapter** – returns an
  instance of the appropriate subclass or throws an error.

## Relationships

- `FileAccessAdapter` (abstract) ←– `LocalFileAdapter` / `SftpFileAdapter` / `SmbFileAdapter`
- `FileAccessAdapter` uses `FileSourceConfig` for configuration.
- `ListDirOptions` is passed into `listDir` calls of all adapters.

## Validation Rules

- Each config variant requires its discriminant (`type`) and mandatory fields;
  TypeScript enforces compile-time checks.
- `listDir` must throw if `maxDepth` is negative.
- `readFile` resolves to data for existing files; rejects with `ENOENT` style error
  for missing paths.

## State Transitions

Adapters are essentially stateless except for connection management in remote
clients. An adapter may move through states such as `connected` (for SFTP/SMB) and
`closed`; methods should establish the connection lazily and close on `dispose` if
provided.
