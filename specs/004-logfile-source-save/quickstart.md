# Quickstart: Testing Log File Source Save Feature

1. **Checkout branch**
   ```bash
   git checkout 004-logfile-source-save
   ```

2. **Build and run unit tests**
   ```bash
   npm run build
   npx mocha --require ts-node/register test/unit/webview/log-file-sources/**/*.ts
   ```
   All tests should pass, particularly the new ones verifying Save button visibility.

3. **Manual UI trial**
   - Launch the extension (`F5` in VS Code).
   - Execute the `Log Explorer: Edit Log Filepath Config` command from the Command Palette.
   - Observe that the Save button is initially hidden.
   - Fill in a valid short name (kebab-case) and path/glob; the Save button will appear.
   - Click Save and confirm the `Saved successfully.` status text appears.
   - Look in the workspace under `.logex/filepath-configs/` to find the generated JSON file.
   - Modify a field; the Save button should reappear when the form is valid.

4. **Error path**
   - Intentionally enter an invalid short name or empty path; the Save button disappears and red
     validation messages are shown.
   - Make the workspace or config directory read-only and attempt to save; an error message
     should appear.

The feature uses the existing `ConfigStore` class, so no additional setup is necessary.
