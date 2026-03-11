# Contract: File Access Adapter API

This document describes the public interface exposed by the file access adapter
module. Consumers of the module should rely only on the types and functions
specified here.

## Types

```ts
// union exported from "src/utils/fileAdapters/types.ts"
export type FileSourceConfig =
  | LocalConfig
  | SftpConfig
  | SmbConfig;

export interface LocalConfig { type: "local"; basePath: string }
export interface SftpConfig { type: "sftp"; host: string; port?: number; username?: string; password?: string; privateKey?: string|Buffer; root?: string }
export interface SmbConfig { type: "smb"; share: string; username?: string; password?: string; domain?: string }

export interface ListDirOptions { recursive?: boolean; maxDepth?: number }
```

## Classes

```ts
// base class
export abstract class FileAccessAdapter {
  constructor(config: FileSourceConfig)
  abstract readFile(path: string): Promise<Buffer>
  abstract listDir(path: string, options?: ListDirOptions): Promise<string[]>
  stat?(path: string): Promise<any>
  delete?(path: string): Promise<void>
}
```

Concrete subclasses are exported for convenience but are not required for
application code:

```ts
export class LocalFileAdapter extends FileAccessAdapter {}
export class SftpFileAdapter extends FileAccessAdapter {}
export class SmbFileAdapter extends FileAccessAdapter {}
```

## Factory

```ts
export function createFileAdapter(config: FileSourceConfig): FileAccessAdapter
```

The factory returns one of the concrete adapter instances corresponding to the
discriminated `type` field; it throws an error for unsupported types.

## Behavioral Guarantees

- `readFile` returns a `Buffer` containing file data; promise rejection indicates
  I/O errors or missing files.
- `listDir` returns an array of full path strings relative to the configured
  root. If `recursive` is true, the result includes entries from subdirectories
  up to `maxDepth`.
- Implementations MAY lazily establish network connections and SHOULD clean up
  resources when the adapter is no longer needed.
- Errors are propagated transparently; callers should handle them appropriately.

## Versioning

This contract is part of the 0.x API of the LogExplorer extension. Future
changes that add new adapter types or modify method signatures must be labeled as
breaking changes and documented in the changelog.
