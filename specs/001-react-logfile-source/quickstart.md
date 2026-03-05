# Quickstart: React-based Log Filepath Config Editor

This document shows how to try the new React-powered editor once the feature is built and installed.

1. **Open a workspace** containing log files or an empty project.
2. Execute the command **"Log Explorer: Edit Log File Source"** (registered as `logexplorer.editLogFileSourceConfig`).
3. The panel titled **"Log Filepath Config"** appears; it is implemented entirely in React.
4. Fill out the **Short Name**, **Label**, and **Path / Glob Pattern** fields. Optionally provide a description.
5. Click **Save**; the configuration will be written to `.logex/filepath-configs/{shortName}.json` in the workspace.
6. To edit an existing config, run the same command and choose the desired `shortName`. The React form loads the values and disables editing the short name.

**Developer Notes:**

- The React source lives in `src/webview/log-file-sources/main.tsx`.
- The host panel class is `src/panels/editors/LogFileSourcesPanel.ts` and uses `getReactWebviewHtml` to render the webview.
- Run `npm run watch` during development to rebuild on file changes; the new UI automatically updates.
- Message types are defined in `src/webview/messages.ts` for strong typing between host and webview.
