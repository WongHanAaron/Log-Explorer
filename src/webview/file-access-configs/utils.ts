// helpers for file-access-configs webview

/**
 * Ensure `settings` field is an object suitable for use with object spread.
 * Arrays, null, primitives, etc. will be replaced with an empty object.
 */
export function normalizeSettings(value: unknown): Record<string, any> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, any>;
    }
    return {};
}
