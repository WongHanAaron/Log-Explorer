# Contract: Log File Path Panel Message Protocol

This document defines the messages exchanged between the extension host and
the Log File Path webview.  The split‑view enhancement adds new message
types to support the configuration list.

## Messages sent from host to webview

- `init` – sent when the panel is first created.  Payload:
  ```ts
  {
      configs: string[];         // list of all config names
      current?: LogFilePathConfig; // optional currently loaded config
  }
  ```

- `configListChanged` – sent whenever the `ConfigStore` notifies of
  additions or deletions.  Payload:
  ```ts
  { configs: string[] }
  ```

- `configData` – response to a `selectConfig` request.  Payload:
  ```ts
  { config: LogFilePathConfig | null }
  ```

## Messages sent from webview to host

- `selectConfig` – user clicked a name in the left list.  Payload:
  ```ts
  { name: string }
  ```

- `updateConfig` – user saved edits to the right panel.  Payload:
  ```ts
  { config: LogFilePathConfig }
  ```

- `createConfig` – user saved a brand‑new configuration.  Payload:
  ```ts
  { config: LogFilePathConfig }
  ```

- `deleteConfig` – user requested deletion (optionally exposed by the UI).
  Payload:
  ```ts
  { name: string }
  ```

Applications should treat these message shapes as part of the public API;
changes must be coordinated with webview code.  All messages are JSON
serializable.
