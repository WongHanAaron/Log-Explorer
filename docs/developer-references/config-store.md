# Config Store Service

This module provides an abstraction layer for working with **FilepathConfig** and
**FileLogLineConfig** objects stored in the workspace's hidden `.logex` directory.

## Core concepts

- **FilepathConfig** and **FileLogLineConfig** — domain interfaces defined in
  `src/domain/*.ts`.
- **ConfigCategory** — TypeScript enum with values `Filepath` and `Filelog`.
- **ConfigStore** — class that binds to a workspace root and offers methods
  for querying, fetching, and subscribing to config changes.

## Usage

```ts
import { ConfigStore, ConfigCategory } from 'logexplorer';

// inside an activated extension or test:
const store = new ConfigStore(vscode.workspace.workspaceFolders![0].uri);

// list all filepath config names
const names = await store.listConfigNames(ConfigCategory.Filepath);

// read a specific config
const cfg = await store.getConfig(ConfigCategory.Filepath, 'app-logs');

// subscribe to additions
const disposable = store.subscribeConfigAdded(ConfigCategory.Filepath, name => {
  console.log('new filepath config', name);
});

// when done
disposable.dispose();
```

All operations return promises and may throw `Error` objects on I/O or
validation failures.  The class is intentionally thin; most of the real work
is done by the free functions in the same module, which are exported for
internal use and unit testing.
