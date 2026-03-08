# Data Model: Output Logger

The feature does not introduce any persistent storage or domain entities; it
provides an in-memory logging service and a lightweight message structure for
communication between webviews and the extension host.

## LogMessage (transient)

Represents a single message routed through the logging system.

| Field     | Type    | Description |
|-----------|---------|-------------|
| `level`   | string  | Severity level, one of `info`, `warn`, or `error`. Defaults to `info` when
|           |         | omitted. |
| `scope`   | string
over| Optional short identifier indicating the component or subsystem that
|           |         | produced the message. Used for prefixing and filtering. |
| `text`    | string  | The textual content of the log entry. |
| `errorMessage` | string\|undefined | If an exception object was logged, its `message` property. |
| `stack`   | string\|undefined | Stack trace from the exception, if available. |
| `time`    | string* | ISO timestamp assigned by the host when the message is formatted. |

\* `time` is not sent from the webview; the host appends it when writing to the
channel.

### Relationships

- `LogMessage` objects are created by the `OutputLogger` or by the host when
  processing webview messages. They are not stored beyond buffering in the
  OutputChannel.

### Validation rules

- `level` must be one of the recognised strings; unknown values fall back to
  `info`.
- `text` is required and must be a non-empty string.
- If `errorMessage` or `stack` are provided, they must be strings; absence is
  allowed. Errors are logged only when an exception object was supplied to the
  logger.

Because the structure is ephemeral and only used within a single process, there
is no persistent schema or database migration associated with this feature.
