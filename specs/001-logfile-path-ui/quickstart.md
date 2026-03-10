# Quickstart: Log File Path Split‑View Feature

This guide helps developers build and try the new two‑column configuration
panel.

1. **Checkout branch**
   ```bash
   git checkout 001-logfile-path-ui
   npm install
   ```
2. **Run the watch build**
   ```bash
   npm run watch
   ```
3. **Launch extension host**
   - Press **F5** or run `Run Extension` configuration in VSCode.
   - A new window opens with the extension loaded.
4. **Open the Log File Path panel**
   - Use the command palette: `Log Explorer: Edit Log File Path Config` (or
     equivalent existing command).
   - The panel should appear with two columns.
5. **Populate some configurations**
   - In another VSCode session or the developer console, call the
     `ConfigStore` API:
     ```ts
     const store = new ConfigStore(vscode.workspace.workspaceFolders[0].uri);
     await store.createConfig({ name: 'foo', path: '/var/log/foo.log', ... });
     ```
   - The left column list will update automatically to show "foo".
6. **Search filtering**
   - Type part of a name into the search box; the list narrows accordingly.
7. **Load and edit a config**
   - Click a name in the list; the right panel should display its fields.
   - Modify a value and click Save.  Verify the underlying store reflects the
     change (`await store.getConfig('foo')`).
8. **External changes**
   - In a separate terminal or extension code, delete a config from the
     workspace.  The left list should remove that name within a second.
9. **Keyboard navigation**
   - Tab to the search box, type, press Down/Up arrows to move selection, and
     Enter to load.

10. **Observe logging**
    - Open the **Output** panel and select the "Log Explorer" channel.
    - Create, update, or delete a configuration via the panel or using the
      `ConfigStore` API; each operation should emit an informational log entry
      with the action and config name.

11. **Run tests**
    - Unit: `npm run test:e2e-data -- --grep LogFilePathPanel` (adjust as
      necessary).  New unit tests will be added under `test/unit`.
    - Integration: use existing `npm run test` harness; look for
      `logfile-path-ui` tests.

This quickstart assumes the new panel has been implemented.  If you are
reviewing the design before coding, you can simulate list updates from the
developer console by sending `configListChanged` messages to the webview.

10. **Run tests**
    - Unit: `npm run test:e2e-data -- --grep LogFilePathPanel` (adjust as
      necessary).  New unit tests will be added under `test/unit`.
    - Integration: use existing `npm run test` harness; look for
      `logfile-path-ui` tests.

This quickstart assumes the new panel has been implemented.  If you are
reviewing the design before coding, you can simulate list updates from the
developer console by sending `configListChanged` messages to the webview.
