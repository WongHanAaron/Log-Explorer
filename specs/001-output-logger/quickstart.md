# Quickstart: Logging from Extension and WebView

This guide shows how to use the new logging abstractions added in feature
`001-output-logger`.

## Host-side logger

1. Import either the default singleton or create a new instance from `src/utils/logger.ts`:
   ```ts
   import { logger, OutputLogger } from '../utils/logger';
   // singleton with no specific scope
   logger.info('activation complete');
   // or create a scoped logger for a service
   const storageLogger = new OutputLogger('storage');
   storageLogger.warn('could not load index');
   // explicit level/scope overrides
   storageLogger.log('debug', 'not an info');
   storageLogger.log('error', 'critical failure', 'storage');
   // logging an Error object
   storageLogger.error('caught exception', new Error('disk full'));
   ```
2. Log messages using methods; scope prefixes will appear automatically if provided.

3. To filter by scope, set the configuration `logExplorer.allowedScopes` (or
`logExplorer.deniedScopes`) in `settings.json` with an array of scope names.  
   Example:
   ```json
   "logExplorer.allowedScopes": ["storage","session"]
   ```
   Only messages from the listed scopes will appear; omit the setting to show all.
3. View logs by opening the **Output** panel (`View → Output`) and selecting
   "Log Explorer" from the channel dropdown. The channel is created automatically
   on first use and disposed when the extension deactivates.
4. Call `logger.show()` programmatically to bring the pane into view without
   taking focus (`logger.show(true)`) or with focus (`logger.show(false)`).

## WebView logging

1. In any webview script or React component, add the helper:
   ```ts
   import { WebViewLogger } from './webviewLogger';
   // or simply:
   const { log } = WebViewLogger;
   ```
2. Send log entries like this:
   ```ts
   log('User clicked button');
   log('Fetch error', 'error', 'ui');
   ```
   The helper internally calls `acquireVsCodeApi().postMessage` with a
   `{type:'log', text, level, scope}` payload.
3. The extension host will receive these messages via
   `panel.webview.onDidReceiveMessage` and forward them to the same output
   channel. You can then view them in the "Log Explorer" Output pane along with
   host-originated logs.

## Configuration (optional)

- The setting `logExplorer.logLevel` controls the minimum level recorded by the
  `OutputLogger`. Valid values are `info` (default), `warn`, and `error`.
- To display the output channel automatically when a message is logged, call
  `logger.show()` in your code or add a command that toggles visibility.

No build steps are required; the logger modules are included in the normal
extension bundle.
