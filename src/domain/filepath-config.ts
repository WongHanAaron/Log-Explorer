/**
 * FilepathConfig domain object and validators.
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
     */
    pathPattern: string;
    /** Optional description / note for the user */
    description?: string;
    /** Optional tag list for categorizing the source */
    tags?: string[];
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Returns true if `name` satisfies the kebab-case contract:
 * lower-alpha / digit segments separated by single hyphens, no leading/trailing hyphens.
 */
export function isKebabName(name: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/**
 * Converts an arbitrary string to the nearest valid kebab-case name.
 * - Lowercases all characters
 * - Replaces runs of non-alphanumeric characters with a single hyphen
 * - Strips leading and trailing hyphens
 */
export function toKebabName(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Type guard — returns true only when `obj` is a structurally valid `FilepathConfig`.
 */
export function isFilepathConfig(obj: unknown): obj is FilepathConfig {
    const c = obj as Record<string, unknown>;
    if (!c || typeof c !== 'object') {
        return false;
    }
    if (typeof c.shortName !== 'string' || !isKebabName(c.shortName)) {
        return false;
    }
    if (typeof c.label !== 'string' || c.label.trim().length === 0) {
        return false;
    }
    if (typeof c.pathPattern !== 'string' || c.pathPattern.trim().length === 0) {
        return false;
    }
    if (c.description !== undefined && typeof c.description !== 'string') {
        return false;
    }
    if (c.tags !== undefined) {
        if (!Array.isArray(c.tags)) { return false; }
        for (const t of c.tags) {
            if (typeof t !== 'string' || t.trim().length === 0) {
                return false;
            }
        }
    }
    return true;
}
