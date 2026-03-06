# Data Model: File Source Setup (003)

**Feature**: 003-file-source-setup
**Status**: Draft

---

## Storage Layout

```
{workspaceRoot}/
  .logex/
    filepath-configs/
      {kebab-name}.json          # one FilepathConfig per file
    filelog-configs/
      {kebab-name}.json          # one FileLogLineConfig per file
```

All config files are stored as UTF-8 JSON. The filename (minus `.json`) is the canonical `shortName` of the config and must satisfy `/^[a-z0-9]+(-[a-z0-9]+)*$/`.

---

## Domain Interfaces

All interfaces are defined in `src/domain/`.

### `src/domain/filepath-config.ts`

```ts
/**
 * Identifies a file or glob pattern that is a log source.
 * Stored at: .logex/filepath-configs/{shortName}.json
 */
export interface FilepathConfig {
    /** Kebab-case identifier; must match the filename (without .json) */
    shortName: string;

    /** Display-friendly label shown in the UI */
    label: string;

    /**
     * Glob pattern or absolute/relative path to the log file(s).
     * Relative paths are resolved from the workspace root.
     * Examples:
     *   "logs/app.log"
     *   "/var/log/nginx/access.log"
     *   "logs/**\/*.log"
     */
    pathPattern: string;

    /** Optional description / note for the user */
    description?: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

export function isFilepathConfig(obj: unknown): obj is FilepathConfig {
    const c = obj as any;
    return (
        typeof c?.shortName === 'string' &&
        isKebabName(c.shortName) &&
        typeof c?.label === 'string' &&
        c.label.trim().length > 0 &&
        typeof c?.pathPattern === 'string' &&
        c.pathPattern.trim().length > 0 &&
        (c.description === undefined || typeof c.description === 'string')
    );
}

export function isKebabName(name: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

export function toKebabName(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
```

**Stored JSON example**:
```json
{
    "shortName": "nginx-access",
    "label": "Nginx Access Log",
    "pathPattern": "/var/log/nginx/access.log",
    "description": "Production Nginx access log"
}
```

---

### `src/domain/filelog-config.ts`

The base plus three concrete line-type variants. Each variant extends the base with a `type` discriminant.

```ts
// ── Shared Extraction Types ───────────────────────────────────────────────────

/** Extract a field value using fixed prefix and optional suffix markers */
export interface PrefixSuffixExtraction {
    kind: 'prefix-suffix';
    prefix: string;
    suffix?: string;
}

/** Extract a field value using a named regex capture group */
export interface RegexExtraction {
    kind: 'regex';
    /** JavaScript RegExp pattern string; MUST contain a named group (?<value>…) */
    pattern: string;
}

export type FieldExtraction = PrefixSuffixExtraction | RegexExtraction;

// ── Datetime Format ───────────────────────────────────────────────────────────

/**
 * Describes how to parse or format a datetime string.
 * Uses the same token vocabulary as tools/loggen.ts:
 *   yyyy  – 4-digit year
 *   MM    – 2-digit month (01-12)
 *   dd    – 2-digit day (01-31)
 *   HH    – 2-digit hour (00-23)
 *   mm    – 2-digit minute (00-59)
 *   ss    – 2-digit second (00-59)
 *   SSS   – 3-digit milliseconds
 */
export interface DateTimeFormat {
    /** Token-based format string, e.g. "yyyy-MM-dd HH:mm:ss" */
    formatString?: string;
    /** When true, attempt to detect the format automatically */
    autoDetect?: boolean;
}

// ── Text Line Config ──────────────────────────────────────────────────────────

export interface TextField {
    /** Field identifier (camelCase or kebab) */
    name: string;
    extraction: FieldExtraction;
    /** If the field is a datetime, describe its format */
    datetime?: DateTimeFormat;
}

export interface TextLineConfig {
    type: 'text';
    shortName: string;
    label: string;
    description?: string;
    fields: TextField[];
}

// ── XML Line Config ───────────────────────────────────────────────────────────

export interface XmlFieldMapping {
    name: string;
    /** XPath expression evaluated against the parsed XML element */
    xpath: string;
    datetime?: DateTimeFormat;
}

export interface XmlLineConfig {
    type: 'xml';
    shortName: string;
    label: string;
    description?: string;
    /** XPath to the repeating element that represents one log entry */
    fields: XmlFieldMapping[];
}

// ── JSON Line Config ──────────────────────────────────────────────────────────

export interface JsonFieldMapping {
    name: string;
    /**
     * Dot-notation path into the parsed JSON object.
     * Example: "metadata.timestamp"
     */
    jsonPath: string;
    datetime?: DateTimeFormat;
}

export interface JsonLineConfig {
    type: 'json';
    shortName: string;
    label: string;
    description?: string;
    fields: JsonFieldMapping[];
}

// ── Union ─────────────────────────────────────────────────────────────────────

export type FileLogLineConfig = TextLineConfig | XmlLineConfig | JsonLineConfig;

// ── Validation ────────────────────────────────────────────────────────────────

export function isFileLogLineConfig(obj: unknown): obj is FileLogLineConfig {
    const c = obj as any;
    if (typeof c?.shortName !== 'string' || typeof c?.label !== 'string') {
        return false;
    }
    switch (c.type) {
        case 'text': return isTextLineConfig(c);
        case 'xml':  return isXmlLineConfig(c);
        case 'json': return isJsonLineConfig(c);
        default: return false;
    }
}

function isTextLineConfig(c: any): c is TextLineConfig {
    return Array.isArray(c.fields) && c.fields.every(isTextField);
}

function isTextField(f: any): f is TextField {
    return typeof f?.name === 'string' && isFieldExtraction(f.extraction);
}

function isFieldExtraction(e: any): e is FieldExtraction {
    if (e?.kind === 'prefix-suffix') {
        return typeof e.prefix === 'string';
    }
    if (e?.kind === 'regex') {
        return typeof e.pattern === 'string';
    }
    return false;
}

function isXmlLineConfig(c: any): c is XmlLineConfig {
    return Array.isArray(c.fields);
}

function isJsonLineConfig(c: any): c is JsonLineConfig {
    return Array.isArray(c.fields) && c.fields.every(
        (f: any) => typeof f?.name === 'string' && typeof f?.jsonPath === 'string'
    );
}
```

**Stored JSON example (text)**:
```json
{
    "type": "text",
    "shortName": "nginx-combined",
    "label": "Nginx Combined Format",
    "fields": [
        {
            "name": "timestamp",
            "extraction": { "kind": "prefix-suffix", "prefix": "[", "suffix": "]" },
            "datetime": { "formatString": "dd/MMM/yyyy:HH:mm:ss" }
        },
        {
            "name": "statusCode",
            "extraction": { "kind": "prefix-suffix", "prefix": "\" " }
        },
        {
            "name": "requestId",
            "extraction": {
                "kind": "regex",
                "pattern": "request_id=(?<value>[a-f0-9-]+)"
            }
        }
    ]
}
```

**Stored JSON example (json)**:
```json
{
    "type": "json",
    "shortName": "structured-app",
    "label": "Structured App Log",
    "fields": [
        { "name": "level",   "jsonPath": "level" },
        { "name": "message", "jsonPath": "msg" },
        { "name": "time",    "jsonPath": "time",
          "datetime": { "formatString": "yyyy-MM-ddTHH:mm:ss.SSS" } }
    ]
}
```

---

## State Transitions

```
[No .logex folder]
       │
       ▼  logexplorer.initializeWorkspace
[.logex created with both subdirectories]
       │
       ▼  User opens Filepath Config Editor
[New FilepathConfig draft in webview]
       │
       ▼  User fills required fields and clicks Save
[FilepathConfig persisted to .logex/filepath-configs/{name}.json]
       │
       ▼  User opens File Log Line Config Editor
[New FileLogLineConfig draft in webview]
       │
       ▼  User configures fields and clicks Save
[FileLogLineConfig persisted to .logex/filelog-configs/{name}.json]
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `shortName` | Required; `/^[a-z0-9]+(-[a-z0-9]+)*$/`; must match filename |
| `label` | Required; non-empty string |
| `pathPattern` | Required; non-empty string |
| `FilepathConfig.description` | Optional string |
| `FileLogLineConfig.type` | Required; one of `"text"`, `"xml"`, `"json"` |
| `TextField.name` | Required; non-empty string |
| `PrefixSuffixExtraction.prefix` | Required; non-empty string |
| `RegexExtraction.pattern` | Required; must compile via `new RegExp(pattern)` without error |
| `XmlFieldMapping.xpath` | Required; non-empty string |
| `JsonFieldMapping.jsonPath` | Required; non-empty string; dot-notation |
