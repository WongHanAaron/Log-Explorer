# Research: Output logger and WebView logging abstraction

**Feature**: `001-output-logger`  
**Date**: March 7, 2026  
**Status**: Complete — all NEEDS CLARIFICATION resolved

## Research Questions

1. What is the recommended API for writing text to the VS Code "Output" panel?
2. How should an extension structure a logging abstraction for testability and reuse?
3. What is the best way for a webview to send log messages to the host?
4. Where in the project should the logger code live to keep things organised?
5. How can the logging abstraction support multiple independent instances and a concept of "scope" for filtering?

---

## Finding 1: Use `vscode.window.createOutputChannel`

**Decision**: All output should be routed through a `vscode.OutputChannel` created via
`vscode.window.createOutputChannel('Log Explorer')`. Messages are appended using
`appendLine`/`append` and the channel is shown with `show()` when desired.

**Rationale**: This is the official VS Code API for writing to the Output pane. It
appears in the dropdown at the top of the Output view and requires no special
contributions in `package.json`. Using a channel rather than console logging ensures
users can view logs even when the developer tools are closed.

**Code pattern**:
```ts
const channel = vscode.window.createOutputChannel('Log Explorer');
channel.appendLine('hello world');
channel.show(true);
```

**Alternatives considered**:
* Terminal API (`createTerminal`) – too heavyweight for plain text logging and
  requires managing terminal instances.
* `console.log` – only visible in the developer tools, not the Output panel.

---

## Finding 2: Wrap channel in a reusable `OutputLogger`

**Decision**: Implement a small class named `OutputLogger` exposing methods such as
`info`, `warn`, `error`, `show`, and `dispose`. The class handles lazy channel creation,
level filtering, formatting (timestamps/levels), and reads a configuration setting if
available.

**Rationale**: Encapsulation keeps the rest of the codebase free of VS Code API
calls, making it easier to unit test and allowing future redirection of output (e.g.
to a file) by changing only one module. A class also provides a natural place to
implement log levels.

**Alternatives considered**:
* Free functions (`logInfo(...)`) – less amenable to mocking and cannot hold
  internal state like the channel reference or configured level.
* Third-party logging library – overkill for the small amount of data and would add
  dependencies.

---

## Finding 3: Webview-to-host messaging pattern

**Decision**: Provide a simple `WebViewLogger` script that calls
`acquireVsCodeApi().postMessage({ type: 'log', level, text, scope })`. The helper
allows an optional `scope` argument matching the host API. The extension host
registers `panel.webview.onDidReceiveMessage` listeners to intercept these messages and
forward them to the `OutputLogger`, preserving the scope.

**Rationale**: Webviews cannot access `vscode` directly. `postMessage` is the only
supported way to communicate with the extension host. Keeping the message format
minimal (type/level/text) and validating it on receipt avoids accidental crashes.

**Alternatives considered**:
* Using `console.log` inside the webview – only visible in devtools, not to users.
* Sending arbitrary messages and doing string parsing on the host – more fragile and
  harder to test.

---

## Finding 4: Code placement under `src/utils`

**Decision**: The `OutputLogger` and any related helpers should live in the
`src/utils` directory, as this module is a general-purpose utility used across the
extension.

**Rationale**: Existing conventions in the repo place cross‑cutting helpers in
`utils`. Keeping the logger there makes it easy for other code to import and keeps
feature-specific folders free of miscellaneous helpers.

**Alternatives considered**:
* Putting the class next to the activation code – would clutter the root and make
  reuse by webview handlers less obvious.
* Creating a new top‑level `logger` folder – unnecessary given the small size of the
  module.

---
**Finding 5: Scoped logger instances and filtering**

**Decision**: `OutputLogger` will be a class whose constructor accepts an
optional `scope` string. Each instance retains its own scope and prefixes it when
formatting messages. Filtering logic should inspect this scope against a
configuration allow‑ or deny‑list. A singleton default logger (no scope) will also
be exported for convenience.

**Rationale**: This pattern mirrors many server‑side logging libraries and keeps
all formatting/filtering logic in one place. Having instances means components can
obtain a logger tailored to them without passing additional context on each call.

**Alternatives considered**:
* Global logger with a `withScope()` method returning a temporary context – more
  awkward to implement and test.
* Separate channels per scope – cluttered the Output dropdown and difficult to
  filter programmatically.

---
All uncertainties have been addressed; no additional research is required at this stage.
