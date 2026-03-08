# Logging Guide

This document explains the new logging infrastructure available to extension
and webview code.

## Host-side logger

Import the singleton or create a new instance:

```ts
import { logger, OutputLogger } from '../utils/logger';

// use the shared channel with no scope (the channel is created as a
// "log" output channel so VS Code applies its built-in log‑colour rules)
logger.info('activation complete');

// you may also emit debug-level messages during startup:
// logger.debug('initializing workspace context');

// or scoped logger for a subsystem
const storageLogger = new OutputLogger('storage');
storageLogger.warn('could not load index');

// override level/scope explicitly
storageLogger.log('debug', 'not an info');
storageLogger.log('error', 'critical failure', 'storage');

// logging an error object:
storageLogger.error('caught exception', new Error('disk full'));
```

Call `logger.show()` or use the `logExplorer.showLog` command to bring the
"Log Explorer" output channel into view. To hide/close the channel without
unregistering listeners call `logger.close()` or invoke the
`logExplorer.hideLog` command. The channel is automatically re‑created on
next use and is fully disposed when the extension deactivates.

### Configuration

- `logExplorer.logLevel` (`"info"` | "warn" | "error" | "debug")
  controls the minimum level recorded. Lower‑level messages are filtered out.
- `logExplorer.allowedScopes` / `logExplorer.deniedScopes` allow filtering by
  scope name.

Settings may be changed at runtime; the logger subscribes to configuration
changes and updates its internal filter immediately.

## WebView logging

In webview scripts or React components use the helper:

```ts
import { WebViewLogger } from './webviewLogger';

WebViewLogger.log('User clicked button');
WebViewLogger.log('Fetch error', 'error', 'ui');
```

Messages are posted to the extension host using the standard
`acquireVsCodeApi().postMessage()` API. Panel code already registers an
`onDidReceiveMessage` handler and forwards valid `{type:'log'}` payloads to
the same output channel.

Malformed messages are ignored gracefully.
