/**
 * FileLogLineConfig domain object hierarchy and validators.
 * Stored at: .logex/filelog-configs/{shortName}.json
 */

// ── Shared Extraction Types ───────────────────────────────────────────────────

/** Extract a field value using fixed prefix and optional suffix markers. */
export interface PrefixSuffixExtraction {
    kind: 'prefix-suffix';
    prefix?: string;
    suffix?: string;
}

/** Extract a field value using a JavaScript RegExp named capture group `(?<value>…)`. */
export interface RegexExtraction {
    kind: 'regex';
    /** JavaScript RegExp pattern string. Should contain at least one named group. */
    pattern: string;
}

export type FieldExtraction = PrefixSuffixExtraction | RegexExtraction;

// ── Datetime Format ───────────────────────────────────────────────────────────

/**
 * Describes how to parse or format a datetime string.
 * Token vocabulary (shared with tools/loggen.ts):
 *   yyyy MM dd HH mm ss SSS
 */
export interface DateTimeFormat {
    /** Token-based format string, e.g. "yyyy-MM-dd HH:mm:ss" */
    formatString?: string;
    /** When true, attempt to detect the format automatically */
    autoDetect?: boolean;
}

// ── Text Line Config ──────────────────────────────────────────────────────────

export interface TextField {
    name: string;
    extraction: FieldExtraction;
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
    xpath: string;
    datetime?: DateTimeFormat;
}

export interface XmlLineConfig {
    type: 'xml';
    shortName: string;
    label: string;
    description?: string;
    rootXpath: string;
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

// ── Validators ────────────────────────────────────────────────────────────────

export function isFileLogLineConfig(obj: unknown): obj is FileLogLineConfig {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const c = obj as Record<string, unknown>;
    if (typeof c.shortName !== 'string' || c.shortName.trim().length === 0) {
        return false;
    }
    if (typeof c.label !== 'string' || c.label.trim().length === 0) {
        return false;
    }
    switch (c.type) {
        case 'text': return isTextLineConfig(c);
        case 'xml': return isXmlLineConfig(c);
        case 'json': return isJsonLineConfig(c);
        default: return false;
    }
}

function isTextLineConfig(c: unknown): c is TextLineConfig {
    if (!c || typeof c !== 'object') {
        return false;
    }
    return Array.isArray((c as any).fields) && ((c as any).fields as unknown[]).every(isTextField);
}

function isTextField(f: unknown): f is TextField {
    if (!f || typeof f !== 'object') {
        return false;
    }
    const field = f as Record<string, unknown>;
    return typeof field.name === 'string' && isFieldExtraction(field.extraction);
}

function isFieldExtraction(e: unknown): e is FieldExtraction {
    if (!e || typeof e !== 'object') {
        return false;
    }
    const ex = e as Record<string, unknown>;
    if (ex.kind === 'prefix-suffix') {
        return typeof ex.prefix === 'string';
    }
    if (ex.kind === 'regex') {
        return typeof ex.pattern === 'string';
    }
    return false;
}

function isXmlLineConfig(c: unknown): c is XmlLineConfig {
    if (!c || typeof c !== 'object') {
        return false;
    }
    return typeof (c as any).rootXpath === 'string' && Array.isArray((c as any).fields);
}

function isJsonLineConfig(c: unknown): c is JsonLineConfig {
    if (!c || typeof c !== 'object') {
        return false;
    }
    const fields = (c as any).fields;
    return (
        Array.isArray(fields) &&
        (fields as unknown[]).every(
            (f: unknown) =>
                f &&
                typeof f === 'object' &&
                typeof (f as any).name === 'string' &&
                typeof (f as any).jsonPath === 'string'
        )
    );
}
