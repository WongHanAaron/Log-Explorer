# Data Model: New Session Panel

**Feature**: `001-new-session-panel`  
**Created**: 2026-02-28

---

## Entities

### SessionTemplate

A reusable configuration for creating sessions stored as a JSON file under `.logex/session-templates/`.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable display name shown in the template list |
| `description` | string | yes | Short description shown alongside the name |
| `parameters` | TemplateParameter[] | yes | Ordered list of named input fields; may be empty |
| `sources` | SourceLogConfigReference[] | yes | Default source config references pre-populated in the form; may be empty |

**Storage**: `.logex/session-templates/<filename>.json`  
**Identity**: Filename (without `.json`) used as stable ID; `name` field used for display.

---

### TemplateParameter

A single named input field defined by a template, rendered dynamically in the creation form.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Label shown next to the input field in the creation form |

---

### Session

An instance of a log exploration session, created by submitting the New Session form. Persisted on disk.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable session name entered by the user |
| `description` | string | no | Optional freeform description |
| `templateName` | string \| null | yes | Name of the template used; `null` if created without a template |
| `parameters` | Record\<string, string\> | yes | Key-value map of template parameter values; `{}` if no template |
| `timeStart` | string (ISO 8601) | yes | Start time for the log exploration window |
| `sources` | SourceLogConfigReference[] | yes | List of source/log config references; may be empty |

**Storage**: `.logex/sessions/<kebab-session-name>/session.json`  
**Folder naming**: Session name converted to lowercase kebab-case (spaces → hyphens, non-alphanumeric stripped).

---

### SourceLogConfigReference

A reference to a named source/log config pair stored elsewhere in the workspace. Used in both session templates (as defaults) and sessions (as the actual sources list). The `type` discriminator selects which config pair flavour is referenced.

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `'file' \| 'kibana'` | yes | Identifies which config pair flavour is referenced |
| `sourceConfig` | string | yes | Name of the `FileSourceConfig` or `KibanaSourceConfig` to use |
| `logConfig` | string | yes | Name of the `FileLogConfig` or `KibanaLogConfig` to use |

**Discriminated union variants**:

- **`type: 'file'`** — references a `FileSourceConfig` (filesystem path, machine, filename pattern) and a `FileLogConfig` (line-format parsing rules) by name.
- **`type: 'kibana'`** — references a `KibanaSourceConfig` (Kibana endpoint, index) and a `KibanaLogConfig` (field mapping rules) by name.

> Note: The concrete `FileSourceConfig`, `FileLogConfig`, `KibanaSourceConfig`, and `KibanaLogConfig` config objects are managed separately (outside the scope of this feature). This entity only stores the *names* that identify those configs.

---

### SessionSummary

A lightweight read-only projection of a `Session` used to populate the Recent Sessions list without loading the full session data into memory.

| Field | Type | Description |
|---|---|---|
| `name` | string | Session name (from `session.json`) |
| `description` | string | Session description (from `session.json`, may be empty) |
| `folderUri` | vscode.Uri | URI of the session folder on disk |

---

## State Transitions

```
Panel Opens
    │
    ├─► Load Templates (.logex/session-templates/*.json)
    │       └─► [empty] → show empty-state message
    │
    ├─► Load Recent Sessions (.logex/sessions/*/session.json)
    │       └─► [empty] → show empty-state message
    │
    └─► Form is in blank/unselected state

User selects template
    └─► Form populates: name/description header, parameter fields, sources rows pre-filled

User fills Session Name + optional fields + click "Create Session"
    ├─► Validate: sessionName non-empty → highlight if blank
    ├─► Validate: no duplicate folder name in .logex/sessions/
    ├─► Create .logex/sessions/<kebab-name>/session.json
    └─► Recent Sessions list refreshes (new entry appears at top)
```

---

## File Layout (`.logex/`)

```
.logex/
├── session-templates/
│   ├── template-a.json        ← SessionTemplate (one file per template)
│   └── template-b.json
└── sessions/
    ├── my-first-session/
    │   └── session.json       ← Session record
    └── another-session/
        └── session.json
```
