# Contract: Extension ↔ Webview Messaging Protocol

**Feature**: 001-vscode-extension-setup  
**Type**: Internal Message Protocol

This contract defines the message protocol between the extension host process and the webview panel. Both sides communicate via `postMessage` with typed JSON payloads.

## Message Schema

All messages follow this base shape:

```typescript
interface WebviewMessage {
  type: string;   // Discriminator — determines payload shape
  payload?: any;  // Optional data, JSON-serializable
}
```

## Messages: Webview → Extension

### `ready`

Sent when the webview has finished initial rendering and is ready to receive data.

```typescript
{ type: "ready" }
```

**When**: After DOM is loaded and `acquireVsCodeApi()` is called.  
**Extension response**: May send initial data or configuration.

## Messages: Extension → Webview

### `update`

Sent when the extension wants to update the webview content.

```typescript
{ type: "update", payload: { content: string } }
```

**When**: After receiving `ready`, or when data changes.  
**Webview response**: Renders the provided content.

## Protocol Rules

1. Messages MUST be JSON-serializable (no functions, no circular references, no `undefined`)
2. Every message MUST have a `type` field
3. Unknown message types MUST be silently ignored (forward compatibility)
4. The webview MUST send `ready` before the extension sends data
5. The extension MUST NOT assume webview is ready until `ready` is received
6. Messages MUST be idempotent — resending `update` with the same content produces the same result

## Extension-side API

```typescript
// Sending to webview
webviewView.webview.postMessage({ type: "update", payload: { content: "..." } });

// Receiving from webview
webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
  switch (message.type) {
    case "ready":
      // Handle webview ready
      break;
  }
});
```

## Webview-side API

```typescript
const vscode = acquireVsCodeApi();

// Sending to extension
vscode.postMessage({ type: "ready" });

// Receiving from extension
window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "update":
      // Handle content update
      break;
  }
});
```
