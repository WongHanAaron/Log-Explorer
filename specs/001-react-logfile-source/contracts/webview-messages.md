# Contract: Webview ↔ Host Messages for Filepath Config Editor

This contract defines the JSON messages exchanged between the React webview and the extension host for the Log Filepath Config panel. It corresponds to the TypeScript interfaces in `src/webview/messages.ts`.

## Webview → Host

- **`filepath-config:save`**
  - Payload: `{ config: FilepathConfig }`

- **`filepath-config:validate-name`**
  - Payload: `{ shortName: string }`

- **`filepath-config:cancel`**
  - No payload; indicates the user clicked Cancel and the panel should close.

- **`ready`**
  - (Generic) Sent by the webview when React has mounted; host responds by loading initial data.

## Host → Webview

- **`filepath-config:load`**
  - Payload: `{ config: FilepathConfig | null; isNew: boolean }` – host provides the configuration to edit or indicates a new one.

- **`filepath-config:name-available`**
  - Payload: `{ available: boolean }` – result of a validation check.

- **`filepath-config:save-result`**
  - Payload: `{ success: boolean; errorMessage?: string }` – result of an attempted save.

Messages are dispatched via the standard `window.postMessage` / `vscode.window.onDidReceiveMessage` APIs in the webview environment.
