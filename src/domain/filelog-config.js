"use strict";
/**
 * FileLogLineConfig domain object hierarchy and validators.
 * Stored at: .logex/filelog-configs/{shortName}.json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFileLogLineConfig = isFileLogLineConfig;
// ── Validators ────────────────────────────────────────────────────────────────
function isFileLogLineConfig(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const c = obj;
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
function isTextLineConfig(c) {
    if (!c || typeof c !== 'object') {
        return false;
    }
    return Array.isArray(c.fields) && c.fields.every(isTextField);
}
function isTextField(f) {
    if (!f || typeof f !== 'object') {
        return false;
    }
    const field = f;
    return typeof field.name === 'string' && isFieldExtraction(field.extraction);
}
function isFieldExtraction(e) {
    if (!e || typeof e !== 'object') {
        return false;
    }
    const ex = e;
    if (ex.kind === 'prefix-suffix') {
        return typeof ex.prefix === 'string';
    }
    if (ex.kind === 'regex') {
        return typeof ex.pattern === 'string';
    }
    return false;
}
function isXmlLineConfig(c) {
    if (!c || typeof c !== 'object') {
        return false;
    }
    return typeof c.rootXpath === 'string' && Array.isArray(c.fields);
}
function isJsonLineConfig(c) {
    if (!c || typeof c !== 'object') {
        return false;
    }
    const fields = c.fields;
    return (Array.isArray(fields) &&
        fields.every((f) => f &&
            typeof f === 'object' &&
            typeof f.name === 'string' &&
            typeof f.jsonPath === 'string'));
}
//# sourceMappingURL=filelog-config.js.map