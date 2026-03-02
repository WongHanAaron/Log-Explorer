# Quickstart: File Source Setup (003)

This guide walks through the core user flows introduced by this feature from the developer perspective – both the end-user experience and how to exercise it during development.

---

## Prerequisites

- Extension installed (F5 to launch Extension Development Host, or run `npm run build && code --install-extension …`).
- A workspace folder open in VS Code.

---

## Flow 1 – Initialize Workspace

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **Log Explorer: Initialize Workspace**.
3. Verify that `.logex/filepath-configs/` and `.logex/filelog-configs/` now exist in the workspace root.
4. If a `.gitignore` is present, confirm the prompt: **Add .logex/ to .gitignore?** → click **Yes**.
5. `.gitignore` should now contain `.logex/`.

---

## Flow 2 – Create a Filepath Config

1. Run **Log Explorer: Open Filepath Config Editor** from the Command Palette.
2. The editor panel opens with a blank form.
3. Fill in:
   - **Short Name**: `nginx-access` (kebab-case, used as filename)
   - **Label**: `Nginx Access Log`
   - **Path Pattern**: `/var/log/nginx/access.log`
   - **Description** (optional): `Production access log`
4. Click **Save**.
5. Verify that `.logex/filepath-configs/nginx-access.json` exists with the expected content:
   ```json
   {
       "shortName": "nginx-access",
       "label": "Nginx Access Log",
       "pathPattern": "/var/log/nginx/access.log",
       "description": "Production access log"
   }
   ```

---

## Flow 3 – Edit an Existing Filepath Config

1. Run **Log Explorer: Open Filepath Config Editor** with argument `nginx-access`.
2. The editor loads the saved config.
3. Change the **Description** field.
4. Click **Save** → file updated in-place.

---

## Flow 4 – Create a File Log Line Config (Text)

1. Run **Log Explorer: Open File Log Line Config Editor** from the Command Palette.
2. The editor opens with a blank **Text** form (text is the default type).
3. Fill in:
   - **Short Name**: `nginx-combined`
   - **Label**: `Nginx Combined Format`
   - **Type**: `text` (default)
4. Add a field:
   - **Name**: `timestamp`
   - **Extraction kind**: `prefix-suffix`
   - **Prefix**: `[`
   - **Suffix**: `]`
   - **Datetime format**: `dd/MMM/yyyy:HH:mm:ss`
5. Add another field:
   - **Name**: `statusCode`
   - **Extraction kind**: `prefix-suffix`
   - **Prefix**: `" `
   - No suffix
6. Click **Save**.
7. Verify that `.logex/filelog-configs/nginx-combined.json` exists.

---

## Flow 5 – Create a File Log Line Config (JSON)

1. Open the File Log Line Config Editor.
2. Choose **Type**: `json`.
3. Fill **Short Name**: `structured-app`, **Label**: `Structured App Log`.
4. Add field mappings:
   | Name | JSON Path |
   |------|-----------|
   | `level` | `level` |
   | `message` | `msg` |
   | `time` | `time` (with datetime format `yyyy-MM-ddTHH:mm:ss.SSS`) |
5. Click **Save**.
6. Verify `.logex/filelog-configs/structured-app.json`.

---

## Validation Errors to Exercise

| Scenario | Expected Behaviour |
|----------|--------------------|
| Short name contains uppercase (`MyConfig`) | Inline error: "Short name must be kebab-case" |
| Short name already exists (on new config) | Inline error: "A config with this name already exists" |
| Empty label | Save button disabled or inline error |
| Regex field with invalid pattern (e.g. `(unclosed`) | Inline error: "Invalid regular expression" |

---

## Development Notes

- Re-run `npm run build` after any source change, then reload the Extension Development Host (`Ctrl+R` in the host window).
- Config files are plain JSON; you can edit them manually and re-open the editor to see the loaded state.
- The `.logex/` directory is excluded from git (added by Initialize Workspace); share configs by committing them explicitly if needed.
