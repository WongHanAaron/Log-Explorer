# Research Notes: File Access Adapters

## Decisions & Rationale

### Adapter dependencies

- **Local**: use built-in `fs.promises` for file operations. No external dependency.
- **SFTP**: adopt `ssh2-sftp-client` as it's already widely used, provides promise-based API,
  and supports `readdir`, `get`, `stat`, and `delete`. Recursion must be implemented
  manually using `readdir` and `stat` to differentiate files/directories.
- **SMB**: use `smb2` package which wraps Windows CIFS; it exposes `readdir`, `readFile`,
  `unlink` and `stat`. Similar recursion approach needed.

### Recursive listing algorithm

Both remote adapters will implement a shared helper that
```
async function walk(client, path, options, depth = 0, output = []) {
  if (options.maxDepth !== undefined && depth > options.maxDepth) return output;
  const entries = await client.readdir(path);
  for (const entry of entries) {
    const full = `${path}/${entry.name}`;
    if (options.recursive && entry.isDirectory) {
      output.push(full);
      await walk(client, full, options, depth + 1, output);
    } else {
      output.push(full);
    }
  }
  return output;
}
```
This pattern works for `ssh2-sftp-client` and `smb2` since both return directory entries
with type info or require a subsequent `stat` call.

### Error handling

Adapters will propagate errors from underlying libraries but may normalize
`ENOENT`/`FileNotFound` variants. Authentication failures should be surfaced
as rejected promises with descriptive messages. The factory throws for unsupported
config types.

### Config typing

TypeScript union discriminants (`type: 'local'|'sftp'|'smb'`) allow compile-time
checks. Additional fields are optional to accommodate defaults (e.g. port).

### Testing approach

- Local adapter: create temporary directory with `fs.promises` to write files and verify
  operations.
- SFTP/SMB: use mocking libraries or lightweight in-memory servers. For SFTP we can spin up
  `ssh2` server via `ssh2` package in tests. SMB is trickier; use a stubbed client object
  with the same interface instead of a real server. The goal is to test our recursion and
  error-handling logic without depending on external services.

### Extensibility

The factory will be a simple `switch` on `config.type`. For future adapters, add a
new config interface and a case. We considered using a registration mechanism but the
simple switch is clearer given the small number of types.

## Alternatives Considered

- **Using `node-glob` for recursion**: unsuitable because the remote file systems do not
  support globs and the libraries don't expose that interface.
- **Adopting a plugin registry for adapters**: overkill; adding cases in a factory is
  acceptable until the list grows significantly.

## Outcome

Decisions above provide enough detail to start implementation. No remaining
`NEEDS CLARIFICATION` items appear.
