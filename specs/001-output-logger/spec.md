# Feature Specification: Output logger and WebView logging abstraction

**Feature Branch**: `001-output-logger`  
**Created**: March 7, 2026  
**Status**: Draft  
**Input**: User description: "implement an OutputLogger to the outputchannel in vscode. Additionally, implement an abstraction for the WebView as well that would post a message to be handled by the extension host"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Log messages from extension (Priority: P1)

Extension code needs the ability to create independent logger instances for different components (e.g. command handlers, services). Each logger should accept a *scope* string such as `"session"` or `"storage"` which is included in the output to make it easier to identify the source of messages. Users should also be able to filter messages by scope.

**Why this priority**: scoped loggers reduce noise when several subsystems are active and make debugging of specific areas straightforward.

**Independent Test**: create two logger instances with different scopes, log messages from each, and verify both appear with correct prefix; demonstrate filtering by hiding one scope via configuration.

**Acceptance Scenarios**:

1. **Given** two logger instances `logger('A')` and `logger('B')` exist, **When** `logger('A').info('x')` and `logger('B').info('y')` are called, **Then** the output channel contains lines prefixed `[info][A] x` and `[info][B] y` in order.
1a. **Given** a logger instance `logger('A')`, **When** `logger.log('warn', 'z', 'B')` is called to override level and scope, **Then** the output channel contains a line `[warn][B] z` even though the instance scope is `A`.
2. **Given** filtering is set to scope `A` only, **When** both loggers emit messages, **Then** only lines from scope `A` appear.

---

---

### User Story 2 - WebView forwards logs to host (Priority: P2)

When a webview panel needs to output diagnostic information (for example, a click handler or data fetch error), the webview code uses a simple logging abstraction called `WebViewLogger` which accepts an optional `scope` and posts a message to the extension host. The host receives the message and writes it through the same OutputLogger, preserving the scope.

**Why this priority**: many features rely on webviews; being able to debug them via the same log channel unifies troubleshooting.

**Independent Test**: add a call to the webview logger from the webview script and verify that the message appears in the output channel once the host processes it.

**Acceptance Scenarios**:

1. **Given** a webview is open, **When** the script executes `WebViewLogger.log('webview message')`, **Then** the extension host receives a message and the Output Channel contains "webview message".
1a. **Given** the webview logger was constructed with `scope='ui'` and logs a message, **When** the host processes it, **Then** the output line is prefixed with `[ui]`.
2. **Given** the webview sends a malformed log request, **When** the host receives it, **Then** the host ignores the message and does not crash.

---

---

### User Story 3 - Control visibility and levels (Priority: P3)

A power user or developer should be able to configure whether the logger is enabled and what minimum severity is recorded. They may also request that the Output channel be shown automatically when certain messages are logged.

**Why this priority**: provides flexibility but is not required for initial logging functionality.

**Independent Test**: change a setting to a higher log level and confirm lower‑level messages no longer appear; call `logger.show()` to bring output into view.

**Acceptance Scenarios**:

1. **Given** logging level is set to "warn", **When** the code logs an "info" message, **Then** the message does not appear.

---

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when the output channel has been disposed (e.g. after deactivation)? subsequent log calls should be no‑ops and not throw exceptions.
- How does system handle messages from a webview that has been closed? incoming messages should be ignored or logged to a fallback without crashing the host.
- If the webview posts a message with an unexpected structure, the host must validate and discard it rather than assume a string property exists.
- Logging a very large amount of data (e.g. megabytes) should not block the extension; the channel may buffer but host operations remain responsive.
- What if a logger is created with an empty or invalid scope? the constructor should normalise or reject such values and not include an empty prefix.
- Filtering configuration references a scope that has never been used; the system should simply suppress nothing or everything as appropriate but not error.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Extension MUST provide a reusable `OutputLogger` abstraction that allows creation of multiple independent instances. Each instance is constructed with an optional `scope` string. Instances expose simple methods:
  - `log(level, message, scope?)` for generic entries, where `level` is one of `info`/`warn`/`error`/`debug` and `scope` overrides the instance scope if supplied
  - `debug(message, scope?)`, `info(message, scope?)`, `warn(message, scope?)` convenience helpers
  - `error(message, error?)` helper which includes an error's message/stack when provided
  - `show()` to reveal the channel and `dispose()` to close it
  The API is intentionally minimalist to avoid ambiguous overloads.  
  *Implementation note:* the implementation should reside under `src/utils` (e.g. `src/utils/logger.ts`).
- **FR-002**: `OutputLogger` MUST automatically create the channel on first use and dispose of it when the extension deactivates.
- **FR-003**: The logger MUST support configurable log levels so that messages below the current threshold are ignored.
- **FR-009**: Logger instances MUST allow filtering by `scope`; the configuration can specify an allow‑list or deny‑list of scopes whose messages are written to the channel.
- **FR-004**: There MUST be a lightweight webview-side helper (`WebViewLogger`) that wraps `acquireVsCodeApi().postMessage` to send log requests. It should mirror the host API and accept an optional `scope` parameter so messages can be scoped at source.
- **FR-005**: The extension host MUST listen for messages from any webview and route valid log requests to the `OutputLogger` using the same level semantics.
- **FR-006**: The host MUST validate incoming webview messages and safely ignore malformed or unexpected payloads without throwing.
- **FR-007**: Logging calls made after the channel is disposed or the webview is gone MUST not raise exceptions.
- **FR-008**: The logger MUST buffer messages asynchronously to avoid blocking the host.


*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **Log Message**: a simple record containing a timestamp, level (info/warn/error), optional `scope`, and text. Webviews send JSON objects with this structure to the host.
- **Output Channel**: an OS-level UI component managed by VS Code that displays appended text lines; our abstraction encapsulates creation, disposal and visibility.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Developers are able to generate and view at least one log message in the Output panel during routine extension use without manual code changes.
- **SC-001a**: Multiple logger instances with distinct scopes can be created and simultaneously write to the same channel.
- **SC-002**: Webview-originated log messages appear in the same channel within one second of being posted in 95% of trials.
- **SC-003**: No unhandled exceptions occur as a result of logging operations during normal usage.
- **SC-004**: At least 90% of logged messages respect the configured log level, with lower‑level messages suppressed when expected.
- **SC-005**: Scope‑based filtering configuration successfully suppresses or allows messages according to the specified lists in at least 95% of test runs.

