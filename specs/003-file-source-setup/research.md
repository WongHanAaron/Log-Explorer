# Research: File Source Setup (003)

**Generated**: 2026-02-28
**Resolves unknowns from**: plan.md Technical Context

---

## R-001 – VSCode WebviewPanel vs WebviewViewProvider for config editors

**Decision**: Use `vscode.WebviewPanel` (full-panel tab editor) for both Log Filepath Config Editor and File Log Line Config Editor.

**Rationale**: Config editing is a deliberate, full-attention task – the user navigates to the editor, makes changes, and saves. A side-bar `WebviewViewProvider` (sidebar widget) would be too cramped. `WebviewPanel` opens a tab that can be sized freely, matches VS Code's native editor UX, and is the pattern already established in `LogExplorerPanel.ts`.

**Alternatives considered**:
- `WebviewViewProvider` (sidebar): too small for form-heavy config editing.
- Custom tree-view + quick-pick: insufficient for nested extraction rules.

---

## R-002 – Filesystem API: `vscode.workspace.fs` vs Node `fs`

**Decision**: Use `vscode.workspace.fs` for all reads and writes of `.logex/**` config files.

**Rationale**: `vscode.workspace.fs` abstracts over local, remote (SSH), and virtual filesystems. It accepts `vscode.Uri` objects, is the officially recommended API for cross-platform extension file I/O, and avoids the need for `require('fs')` inside the webview sandbox. All paths are constructed with `vscode.Uri.joinPath` to guarantee OS-correctness.

**Alternatives considered**:
- `import * as fs from 'fs'`: works locally but breaks in remote/virtual workspaces; not recommended by VS Code docs.
- `fs/promises` polyfill: same problem plus extra complexity.

---

## R-003 – JSON schema validation strategy

**Decision**: Implement lightweight manual validation functions inside each domain object module (`filepath-config.ts`, `filelog-config.ts`). No third-party schema library is added.

**Rationale**: The config schemas are small (< 15 fields each), fully controlled, and versioned inside the codebase. Adding Ajv or Zod for this use-case would introduce npm dependencies that the constitution discourages (§I – no excess libraries). A hand-written `isValidFilepathConfig(obj: unknown): obj is FilepathConfig` using TypeScript type predicates provides the same safety with zero overhead.

**Alternatives considered**:
- `ajv`: powerful but heavyweight for this use case; schema JSON would need to be bundled.
- `zod`: excellent DX but adds ~12 KB to the bundle; disproportionate for small config structs.
- JSON Schema `$schema` in stored files: useful for user tooling but does not replace runtime validation.

**Adopted pattern**:
```ts
export function isFilepathConfig(obj: unknown): obj is FilepathConfig {
    const c = obj as any;
    return typeof c?.shortName === 'string' && typeof c?.pathPattern === 'string';
}
```

---

## R-004 – Kebab-case short name sanitisation

**Decision**: Validate and normalise short names using the pattern `/^[a-z0-9]+(-[a-z0-9]+)*$/`.

**Rationale**: This matches conventional kebab-case (no leading/trailing hyphens, no double hyphens, lowercase alphanumeric segments). It maps 1-to-1 to a safe filename on Windows, macOS, and Linux with no encoding required.

**Helper function**:
```ts
export function isKebabName(name: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}
export function toKebabName(raw: string): string {
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
```

---

## R-005 – Text extraction: Prefix/Suffix Index-of approach

**Decision**: Implement as a runtime helper that takes a raw log line string, a `prefix` string, and an optional `suffix` string, and returns the substring between them (or from prefix to end-of-line if no suffix).

**Rationale**: This is a well-understood, zero-dependency algorithm. No library needed.

```ts
export function extractByPrefixSuffix(line: string, prefix: string, suffix?: string): string | null {
    const start = line.indexOf(prefix);
    if (start === -1) return null;
    const from = start + prefix.length;
    if (!suffix) return line.slice(from);
    const end = line.indexOf(suffix, from);
    return end === -1 ? null : line.slice(from, end);
}
```

---

## R-006 – Text extraction: Regex capture groups

**Decision**: Use native JavaScript `RegExp` named capture groups (`(?<name>…)`).

**Rationale**: Named groups have been available since Node.js 10 / V8 6.0; Node 18 is the minimum. They map cleanly to `fieldName` in `RegexExtraction`. No library needed.

**Pattern**: Config stores the regex pattern string; runtime compiles with `new RegExp(pattern)` and reads `match.groups`.

**Error handling**: Compilation errors surfaced during config save validation; a user-facing error message is shown in the webview without crashing.

---

## R-007 – Datetime extraction and parsing

**Decision**: Store a `DateTimeFormat` object with `formatString` (e.g. `yyyy-MM-dd HH:mm:ss`) and/or `autoDetect: true`. Runtime parsing uses the existing `formatDate()` helper already implemented in `tools/loggen.ts` (tokens: `yyyy`, `MM`, `dd`, `HH`, `mm`, `ss`, `SSS`). For the config editor UI the format string is a free-text field with a pattern token reference guide shown inline.

**Rationale**: Keeps the datetime token vocabulary consistent with the loggen tool already in the repo. No external date library (luxon, dayjs) needed for the domain model; parsing is only needed at log-reading time (future feature), not during config editing.

---

## R-008 – XML line type: library choice

**Decision**: Defer full XML parsing to a later feature phase. In this feature the `XmlLineConfig` domain object and schema are defined and persisted, but the runtime XPath extraction engine is **not implemented**. If/when needed, use `@xmldom/xmldom` + `xpath` (both MIT-licensed, lightweight, no native dependencies).

**Rationale**: Adding two npm packages for a not-yet-exercised code path violates constitution §I. The domain model is complete; the runtime engine can be added when a user story requires it.

---

## R-009 – JSON line type: field mapping

**Decision**: Store `jsonPath` as a dot-notation string (e.g. `metadata.timestamp`). Runtime extraction uses a simple recursive property accessor with no third-party library.

**Rationale**: Standard JSONPath libraries (jsonpath-plus, @jsonpath-like packages) offer complex features (filters, recursive descent) not needed for the common case of extracting named fields from structured log objects. A `getByPath(obj, 'a.b.c')` helper covers 95% of practical use-cases.

---

## R-010 – Initialize Workspace command placement

**Decision**: Register the command `logexplorer.initializeWorkspace` in the existing `src/commands/index.ts`. The command creates `.logex/filepath-configs/` and `.logex/filelog-configs/` using `vscode.workspace.fs.createDirectory` (idempotent, no error when already exists). It also adds `.logex/` to `.gitignore` if the workspace root contains one, unless the user opts out via a quick-pick confirmation.

**Rationale**: Following the existing command registration pattern avoids a new entry point. `.gitignore` modification is a convenience that prevents accidental commits of private log paths; it is opt-in via confirmation dialog.

---

## R-011 – Webview message protocol

**Decision**: All messages between the extension host and the webview MUST include a `type` field (string discriminator). A shared `src/webview/messages.ts` file defines the union types for both editors.

**Rationale**: Constitution §II mandates explicit type fields and validation on all webview messages. Using a shared module prevents drift between host and webview implementations. Messages validated with a type-guard before dispatch.

---

## Summary of Decisions

| ID | Topic | Decision |
|----|-------|---------|
| R-001 | Webview type | `WebviewPanel` (full editor tab) |
| R-002 | Filesystem API | `vscode.workspace.fs` + `vscode.Uri` |
| R-003 | Validation | Manual type-predicate functions in domain modules |
| R-004 | Kebab names | `/^[a-z0-9]+(-[a-z0-9]+)*$/` regex; `toKebabName()` helper |
| R-005 | Prefix/Suffix extraction | Inline `extractByPrefixSuffix()` helper |
| R-006 | Regex extraction | Native `RegExp` named capture groups |
| R-007 | Datetime | Reuse `formatDate()` tokens; `DateTimeFormat` domain object |
| R-008 | XML parsing | Domain model defined; runtime engine deferred |
| R-009 | JSON path | Dot-notation accessor; no third-party library |
| R-010 | Initialize Workspace | `logexplorer.initializeWorkspace` cmd in `src/commands/index.ts` |
| R-011 | Webview messages | Shared `messages.ts` with `type` discriminator; validated on receipt |
