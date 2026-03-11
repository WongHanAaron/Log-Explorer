# Quickstart: File Access Adapters

This document shows how to use the new adapter framework in production code. It
assumes you have already imported the module in a TypeScript context.

```ts
import {
  createFileAdapter,
  FileSourceConfig,
  ListDirOptions,
} from "../services/fileaccess";

// -- local example -------------------------------------------------------------
const localConfig: FileSourceConfig = { type: "local", basePath: "/var/logs" };
const localAdapter = createFileAdapter(localConfig);

const files = await localAdapter.listDir(".", { recursive: true, maxDepth: 2 });
console.log("local files:", files);

const data = await localAdapter.readFile("./today.log");
console.log("first bytes:", data.slice(0, 100).toString());

// -- SFTP example --------------------------------------------------------------
const sftpConfig: FileSourceConfig = {
  type: "sftp",
  host: "example.com",
  username: "user",
  password: "secret",
  root: "/logs",
};
const sftpAdapter = createFileAdapter(sftpConfig);
await sftpAdapter.listDir(".");

// -- SMB example ---------------------------------------------------------------
const smbConfig: FileSourceConfig = {
  type: "smb",
  share: "\\\\SERVER\\Share",
};
const smbAdapter = createFileAdapter(smbConfig);
await smbAdapter.readFile("C:\\path\\to\\file.txt");
```

### Extending with a new backend

1. Define a new config interface and add it to the `FileSourceConfig` union.
2. Implement a subclass of `FileAccessAdapter` implementing the required methods.
3. Add a case to `createFileAdapter` that instantiates the new class.

The factory will throw an error if given a `type` it does not recognize, which
helps catch configuration mistakes early.
