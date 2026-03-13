# Quickstart: Using File Access Configs

This feature adds a new editor panel where you can create, browse, and
edit file access adapter configurations. Each configuration defines how the
extension should connect to a local directory, an SFTP server, or an SMB share.

## Opening the Panel

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Type **"FileAccessConfigs"** and select **LogExplorer: Open FileAccessConfigs**.
3. The panel will appear with a two‑column list on the left and an editor on
the right. If you have no configs yet, the list will show a friendly message.

## Creating a New Configuration

1. Click the **New** button (or the blank row) to start a fresh config.
2. Enter a unique **Name** and choose an **Adapter Type** (`local`, `sftp`, or
   `smb`).
3. Fill in the fields that appear for your adapter type (e.g. host/port for
   SFTP).
4. Click **Save**. The configuration is written to the workspace and appears in
the list immediately.

## Editing or Deleting

1. Use the search box above the list to filter configs by name or type.
2. Click a row to load its details into the editor.
3. Modify values and click **Save** to persist changes.
4. To remove a config, load it and click **Delete**; confirm the prompt.

## Sharing and Portability

Configurations are stored under the workspace’s `.logex/fileaccess-configs`
directory, one file per config. You can commit them to source control or copy
them between projects. Sensitive fields such as passwords are stored in
plaintext; treat these files accordingly.

## Keyboard Shortcuts

- `Ctrl+F` / `Cmd+F` focuses the search box.
- Arrow keys navigate the configuration list.
- `Ctrl+S` / `Cmd+S` saves the current config.

This quickstart covers the most common tasks. For details on the full UI and
validation rules, refer to the documentation in `docs/` once the feature is
implemented.