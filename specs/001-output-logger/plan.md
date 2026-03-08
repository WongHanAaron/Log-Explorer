# Implementation Plan: Output logger and WebView logging abstraction

This plan outlines the development tasks required to build the `OutputLogger` service and
`WebViewLogger` helper described in the specification.

## Tasks

1. **Create OutputLogger class**
   - Add file `src/utils/logger.ts` with the class and methods (`info`, `warn`,
     `error`, `show`, `dispose`). Constructor accepts optional `scope` string.
   - Implement message formatting to include timestamp, level, and scope prefix
     (`[level][scope] message`). Methods should accept parameters in the order
     `(level, message, scope?)`, where `level` is one of the defined enumeration values (`info`, `warn`, `error`, `debug`). Add support for an optional `Error`/`unknown` argument which will have its `message` and `stack` appended. Support optional overrides of the instance's own `scope`.
   - Implement log level filtering and support for scope-based filtering.
   - Ensure channel is created lazily and disposed on deactivation.
   - Add unit tests for each method, including level handling, scope formatting,
     filtering, and disposal.

2. **Integrate logger into extension activation**
   - Instantiate the singleton logger and add to `context.subscriptions`.
   - Replace any ad-hoc `createOutputChannel` calls in existing code with logger calls.
   - Add a sample command or activation log to verify output appears.

3. **Develop WebViewLogger helper**
   - Add a small script usable inside webviews, with API
     `WebViewLogger.log(text: string, level?: string, scope?: string)`.
   - Wrapper around `acquireVsCodeApi().postMessage` sending `{ type: 'log', level, text, scope }`.
   - Document usage in webview components (e.g. `App.tsx`).

4. **Handle webview messages in host**
   - Modify panel creation code to register `onDidReceiveMessage` listener.
   - Validate incoming message structure and forward to `OutputLogger`.
   - Ignore malformed messages gracefully.
   - Add unit/e2e tests simulating messages and verifying output channel contents.

5. **Configuration support (optional P3)**
   - Add a setting `logExplorer.logLevel` or similar to control minimum level.
   - Modify `OutputLogger` to read setting on creation and react to changes.
   - Add a command to show/hide the output channel.
   - Tests for configuration behavior.

6. **Documentation & examples**
   - Update README or internal docs with instructions on using `OutputLogger` and
     `WebViewLogger`.
   - Add comments in `plan.md` linking to spec and tests.

7. **Validation and cleanup**
   - Run all tests, ensure no regressions in existing features.
   - Review and tidy code; ensure no stray console.logs remain.

Each task can be developed and reviewed independently; tasks 1–4 are P1/P2 and provide the
minimum viable logging functionality. Configuration support is P3 and may be deferred
until core logging is stable.

## Estimates

| Task | Estimates |
|------|-----------|
| OutputLogger class | 1 day |
| Extension integration | 0.5 day |
| WebViewLogger helper | 0.5 day |
| Host message handling | 0.5 day |
| Configuration support | 1 day |
| Documentation & tests | 1 day |

Total ~4–5 days depending on testing depth.
