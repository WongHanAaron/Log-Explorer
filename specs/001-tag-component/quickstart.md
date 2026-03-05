# Quickstart: Tag Component Feature

1. **Checkout the feature branch**
   ```sh
   git checkout 001-tag-component
   npm run watch   # start build/watch tasks if not already running
   ```

2. **Open VS Code development host**
   - Press `F5` or run the `Run Extension` debug configuration.
   - Wait for the extension to activate in the new window.

3. **Navigate to Log File Sources panel**
   - Use the command palette (`Ctrl+Shift+P`) and execute `Log Explorer: Edit Filepath Config` or `Edit Filelog Source` depending on the command name.
   - Alternatively, if you have an existing configuration file, use the `Log Explorer` tree view to open it.

4. **Interact with the tag UI**
   - Observe the new pill-style tags component replacing the previous Labels textbox.
   - Click the `+ Add` button to create a new tag; type a name and press Enter.
   - Click an existing tag to rename it; change the case or text and blur the input.
   - Try adding a tag whose lowercase matches an existing one; the previous tag should update its casing instead of duplicating.
   - Remove a tag using the delete/backspace key or by clicking the remove icon.
   - If you exceed the `maxTags` prop (if implemented), verify that the add button is disabled or shows a warning.

5. **Use keyboard only**
   - Tab into the tag area, press Enter to add, arrow keys to navigate, Esc to cancel rename.

6. **Inspect configuration storage**
   - Save and close the panel; open the `.logex/filelog-configs/<name>.json` file or equivalent to ensure the `tags` field is a proper array.

7. **Reuse in another panel (optional)**
   - For development/testing, import `TagSet` into any webview and provide sample tags. Verify identical behavior.

8. **Run tests**
   - Unit tests for the new components should be added later; run `npm run test` once available.

This quickstart ensures the UI works as expected and that the component is ready
for reuse in future features.