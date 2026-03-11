# Access Tester Tool

This directory contains a lightweight command-line utility used for manually
exercising the file access adapters (`LocalFileAdapter`, `SftpFileAdapter`,
`SmbFileAdapter`). It is **not** part of the automated unit test suite; instead
it's intended for development/debugging scenarios where you need to verify
connectivity or behaviour against a real filesystem or server.

## Location

`test/tools/fileaccess/accessTester.ts`

## Requirements

- Node.js 18+ (the same version used by the project)
- [`ts-node`](https://github.com/TypeStrong/ts-node/) installed globally or as
a dev dependency (it is already a dependency of the project).
- Network access to the target SMB/SFTP server, if testing those adapters.

## Usage

Run the script with `npx ts-node` from the workspace root, passing in
adapter-type-specific options and a command:

```bash
npx ts-node test/tools/fileaccess/accessTester.ts \
  --type=smb --share="\\SERVER\\SHARE" --username=user --password=pass \
  read /some/path
```

### Supported commands

- `read <path>`: fetch the file at `<path>` and print its contents.
- `list [<path>]`: list directory entries; use `--recursive` and
  `--maxDepth=<n>` for recursive enumeration.
- `stat <path>`: output metadata for `<path>` (when supported by the adapter).
- `delete <path>`: delete the target path (if the adapter supports deletion).

### Adapter-specific options

| Adapter | Required options | Notes |
|---------|------------------|-------|
| `local` | `--basePath=<dir>` (defaults to `.`) | Local filesystem root |
| `smb`   | `--share=<\\SERVER\\SHARE>` | Optionally `--username`, `--password`, `--domain` |
| `sftp`  | `--host=<host>` | Optionally `--port`, `--username`, `--password`,
  `--privateKey`, `--root` |

### Examples

List the root of an SMB share:

```bash
npx ts-node test/tools/fileaccess/accessTester.ts \
  --type=smb --share="\\SERVER\\SHARE" list
```

Read a file over SFTP:

```bash
npx ts-node test/tools/fileaccess/accessTester.ts \
  --type=sftp --host=example.com --username=foo --password=bar \
  read /path/to/file.txt
```

Stat a local path:

```bash
npx ts-node test/tools/fileaccess/accessTester.ts --type=local --basePath=. stat src
```

## Extending the tool

The script is intentionally simple; feel free to add support for additional
operations, output formatting, or to convert it to a compiled utility if you
want to distribute it separately.

## License

Same as the rest of the repository (MIT, see `LICENSE`).
