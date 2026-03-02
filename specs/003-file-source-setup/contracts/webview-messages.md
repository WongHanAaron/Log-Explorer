# Webview Messages Contract: File Source Setup (003)

**Feature**: 003-file-source-setup
**Shared types file**: `src/webview/messages.ts`

---

## Conventions

- Every message has a `type` string discriminant (constitution §II requirement).
- Messages from the **extension host → webview** are posted with `panel.webview.postMessage(msg)`.
- Messages from the **webview → extension host** are received via `panel.webview.onDidReceiveMessage(msg => …)`.
- The extension host validates every inbound message before acting on it.

---

## Filepath Config Editor Messages

### Host → Webview

#### `filepath-config:load`

Sent once on panel open. Delivers the current config (or a blank template for new).

```ts
interface FilepathConfigLoadMessage {
    type: 'filepath-config:load';
    config: FilepathConfig | null;   // null = new config
    isNew: boolean;
}
```

#### `filepath-config:save-result`

Sent after the host processes a `save` request from the webview.

```ts
interface FilepathConfigSaveResultMessage {
    type: 'filepath-config:save-result';
    success: boolean;
    errorMessage?: string;
}
```

---

### Webview → Host

#### `filepath-config:save`

Sent when the user clicks Save. The host validates the payload, writes the file, and responds with `save-result`.

```ts
interface FilepathConfigSaveMessage {
    type: 'filepath-config:save';
    config: FilepathConfig;
}
```

#### `filepath-config:validate-name`

Sent on short-name field blur to check for conflicts.

```ts
interface FilepathConfigValidateNameMessage {
    type: 'filepath-config:validate-name';
    shortName: string;
}
```

Host responds with either `filepath-config:load` (no-op) or:

```ts
interface FilepathConfigNameAvailableMessage {
    type: 'filepath-config:name-available';
    available: boolean;
}
```

---

## File Log Line Config Editor Messages

### Host → Webview

#### `filelog-config:load`

Sent once on panel open.

```ts
interface FilelogConfigLoadMessage {
    type: 'filelog-config:load';
    config: FileLogLineConfig | null;   // null = new 'text' config
    isNew: boolean;
}
```

#### `filelog-config:save-result`

```ts
interface FilelogConfigSaveResultMessage {
    type: 'filelog-config:save-result';
    success: boolean;
    errorMessage?: string;
}
```

#### `filelog-config:regex-test-result`

Returns a regex test result to the webview after the host safely compiles and tests the pattern.

```ts
interface FilelogConfigRegexTestResultMessage {
    type: 'filelog-config:regex-test-result';
    fieldIndex: number;
    matched: boolean;
    groups?: Record<string, string>;
    errorMessage?: string;    // compile error, if any
}
```

---

### Webview → Host

#### `filelog-config:save`

```ts
interface FilelogConfigSaveMessage {
    type: 'filelog-config:save';
    config: FileLogLineConfig;
}
```

#### `filelog-config:test-regex`

Asks the host to test a regex pattern against a sample string (avoids running `eval`-like code in webview sandbox).

```ts
interface FilelogConfigTestRegexMessage {
    type: 'filelog-config:test-regex';
    fieldIndex: number;
    pattern: string;
    sampleLine: string;
}
```

#### `filelog-config:validate-name`

```ts
interface FilelogConfigValidateNameMessage {
    type: 'filelog-config:validate-name';
    shortName: string;
}
```

Host responds with:

```ts
interface FilelogConfigNameAvailableMessage {
    type: 'filelog-config:name-available';
    available: boolean;
}
```

---

## Union Types (in `src/webview/messages.ts`)

```ts
export type HostToWebviewMessage =
    | FilepathConfigLoadMessage
    | FilepathConfigSaveResultMessage
    | FilepathConfigNameAvailableMessage
    | FilelogConfigLoadMessage
    | FilelogConfigSaveResultMessage
    | FilelogConfigRegexTestResultMessage
    | FilelogConfigNameAvailableMessage;

export type WebviewToHostMessage =
    | FilepathConfigSaveMessage
    | FilepathConfigValidateNameMessage
    | FilelogConfigSaveMessage
    | FilelogConfigTestRegexMessage
    | FilelogConfigValidateNameMessage;
```
