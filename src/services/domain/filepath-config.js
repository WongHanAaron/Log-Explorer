"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKebabName = isKebabName;
exports.toKebabName = toKebabName;
exports.isFilepathConfig = isFilepathConfig;
// ── Public helpers ────────────────────────────────────────────────────────────
/**
 * Returns true if `name` satisfies the kebab-case contract:
 * lower-alpha / digit segments separated by single hyphens, no leading/trailing hyphens.
 */
function isKebabName(name) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}
/**
 * Converts an arbitrary string to the nearest valid kebab-case name.
 * - Lowercases all characters
 * - Replaces runs of non-alphanumeric characters with a single hyphen
 * - Strips leading and trailing hyphens
 */
function toKebabName(raw) {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Type guard — returns true only when `obj` is a structurally valid `FilepathConfig`.
 */
function isFilepathConfig(obj) {
    const c = obj;
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
    return true;
}
