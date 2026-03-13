# Config Store Service

This module provides an abstraction layer for working with **FilepathConfig** and
**FileLogLineConfig** objects stored in the workspace's hidden `.logex` directory.

## Core concepts

- **FilepathConfig**, **FileLogLineConfig**, and **FileAccessConfig** — domain interfaces defined in
  `src/domain/*.ts`.
- **ConfigCategory** — TypeScript enum with values `Filepath`, `Filelog`, and `FileAccess`.
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

// subscribe to additions detected from filesystem events
const disposable = store.subscribeConfigAdded(ConfigCategory.Filepath, name => {
  console.log('new filepath config', name);
});

// when done
disposable.dispose();
```

All operations return promises and may throw `Error` objects on I/O or
validation failures.  The class is intentionally thin, but unlike earlier
versions it now accepts an injectable filesystem provider (`FsProvider`) in
its constructor; the default uses `vscode.workspace.fs`.  This makes it
straightforward to supply an in‑memory fake in unit tests.  Subscriptions are
backed by filesystem change events and are not triggered directly from
`writeConfig` calls.  There are no public free functions in this module; all
functionality is accessed via the `ConfigStore` instance.

### Parsing helpers

To assist with filename conversion and JSON validation outside of a
workspace, the module also exports `ConfigParser` with purely static methods:

```ts
import { ConfigParser } from 'logexplorer';

const filename = ConfigParser.configFilename('app-logs'); // "app-logs.json"
const cfg = ConfigParser.parseFilepathConfig(jsonString);
```

These helpers are useful in unit tests or other contexts where you want to
exercise parsing logic without creating a `ConfigStore`.
