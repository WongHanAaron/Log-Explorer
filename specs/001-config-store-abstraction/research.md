# Phase 0 Research: Config Store Abstraction

## Unknowns & Decisions

### Subscription Mechanism
**Decision**: implement a lightweight in-memory pub/sub using simple callback lists and
`vscode.Disposable` handles rather than introducing `EventEmitter` from Node.js. The
existing codebase already uses basic callback patterns (see `workspace/sessionTemplates.ts`),
and keeping the dependency minimal aligns with principle I (simplicity).

**Rationale**: `EventEmitter` is available but would add little benefit over a short custom
helper. Using disposables mirrors the VS Code API and simplifies unsubscription logic.

**Alternatives Considered**:
* Using `EventEmitter` from `'events'` - rejected due to extra boilerplate and reduced
  type safety when emitting category-specific events.
* Observables/RxJS - overkill for this small feature.

### Category Enumeration
**Decision**: add a `ConfigCategory` TypeScript enum to model the two categories ("filepath"
and "filelog"). This keeps APIs type-safe and centralizes the directory mappings.

**Rationale**: Avoids magic strings throughout code, makes tests easier, and anticipates
possible future categories.

**Alternatives Considered**:
* Use string literal union types (`'filepath' | 'filelog'`) without enum - nearly as good but
  the enum provides self-documenting names and compile-time exhaustiveness checking.

### Error Handling for Missing/Invalid Configs
**Decision**: reuse existing parse helpers (`parseFilepathConfig` /
`parseFileLogLineConfig`) to validate payloads, and let them throw on failure. For missing
names, throw a descriptive `Error` with message `Config not found: <category>/<name>`.

**Rationale**: Aligns with existing behavior of the low-level APIs; avoids introducing
custom error classes.

### Testing Approach
**Decision**: Add unit tests for all new methods to `test/unit/services/config-store.test.ts`.
Also extend the integration test `extension.test.ts` with scenarios verifying subscriber
notifications via workspace.createWorkspaceFolder I/O.

**Rationale**: The existing project already splits tests this way. The config store is
mostly filesystem operations plus in-memory callbacks, so unit tests suffice for logic.
Integration tests ensure the extension host environment handles fs operations as expected.

## Dependencies & Integration
* Will build on `src/services/config-store.ts`; add new exports and helper types there.
* No external libraries required; Node's standard `path` may be used for constructing paths.
* Domain types already defined in `src/domain/filepath-config.ts` and
  `src/domain/filelog-config.ts`.

## Research Summary
The feature is straightforward. No external libraries or complex patterns are required.
Primary design choices involve a simple enum for categories and a small pub/sub mechanism
using callback collections and disposables. Implementation can proceed immediately.

