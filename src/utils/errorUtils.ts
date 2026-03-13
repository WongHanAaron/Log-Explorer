// Utility functions for manipulating error messages across the extension.

/**
 * Convert a low-level internal error message into a more user-friendly string.
 * Currently used to hide cryptic iterator/spread errors produced by malformed
 * configuration JSON.
 */
export function sanitizeConfigError(raw: string): string {
    if (raw.includes('not iterable') || raw.includes('intermediate value')) {
        return 'Malformed configuration file.';
    }
    return raw;
}

/**
 * Given a raw exception message from the extension's config loader, decide
 * what should be sent to the webview.
 *
 * - if the message indicates the file was not found, return `null` (no
 *   error is shown, just an empty form).
 * - otherwise return a sanitized message ready for display.
 */
export function formatConfigLoadError(raw: string): string | null {
    const lower = raw.toLowerCase();
    if (lower.includes('not found') || lower.includes('enoent')) {
        return null;
    }
    return sanitizeConfigError(raw);
}
