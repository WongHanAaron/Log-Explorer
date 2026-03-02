# Contract: Session Template JSON Schema

**Feature**: `001-new-session-panel`  
**Created**: 2026-02-28

---

## Storage Location

Each session template is a single JSON file stored under:

```
{workspaceRoot}/.logex/session-templates/<template-id>.json
```

The filename (without `.json`) is the template's stable identifier used internally. It should be kebab-case and descriptive (e.g., `production-api-logs.json`).

---

## Schema

```typescript
interface SessionTemplateFile {
  /** Human-readable display name shown in the New Session panel template list. */
  name: string;

  /** Short description shown alongside the name. */
  description: string;

  /**
   * Ordered list of named input fields rendered dynamically in the creation form.
   * May be empty if the template requires no additional parameters.
   */
  parameters: Array<{
    name: string;   // Label shown next to the input field
  }>;

  /**
   * Default source/log config references pre-populated in the Sources section of the creation form.
   * May be empty. Each entry references a named source config and log config pair by type.
   */
  sources: Array<{
    type: 'file' | 'kibana';  // Discriminator — selects which config pair flavour is referenced
    sourceConfig: string;     // Name of the FileSourceConfig or KibanaSourceConfig to use
    logConfig: string;        // Name of the FileLogConfig or KibanaLogConfig to use
  }>;
}
```

---

## Example

```json
{
  "name": "Production API Logs",
  "description": "Analyse API request logs from the production cluster",
  "parameters": [
    { "name": "Environment" },
    { "name": "Service Name" }
  ],
  "sources": [
    {
      "type": "file",
      "sourceConfig": "prod-api-01-source",
      "logConfig": "api-request-log-format"
    }
  ]
}
```

---

## Validation Rules

- `name` and `description` must be non-empty strings.
- `parameters` and `sources` must be arrays (may be empty).
- Each parameter object must have a non-empty `name` field.
- Each source object must have `type`, `sourceConfig`, and `logConfig` fields present.
- `type` must be `"file"` or `"kibana"`. `sourceConfig` and `logConfig` must be non-empty strings (the names of the referenced configs).
- Files that do not parse as valid JSON are **silently skipped** — they do not prevent other templates from loading.
- Files that parse as JSON but fail schema validation are **silently skipped** with a console warning.

---

## session.json Schema

Each created session is stored at:

```
{workspaceRoot}/.logex/sessions/<kebab-session-name>/session.json
```

```typescript
interface SessionFile {
  name: string;
  description: string;
  templateName: string | null;   // null if no template was selected
  parameters: Record<string, string>;  // {} if no template
  timeStart: string;             // ISO 8601, e.g., "2026-02-28T09:00:00.000Z"
  sources: Array<{
    type: 'file' | 'kibana';
    sourceConfig: string;        // name of FileSourceConfig or KibanaSourceConfig
    logConfig: string;           // name of FileLogConfig or KibanaLogConfig
  }>;
}
```

**Folder naming rule**: `sessionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`
