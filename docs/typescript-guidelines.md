# TypeScript Coding Guidelines

This document describes the conventions we apply throughout the LogExplorer
codebase.  They are intended to keep our classes and modules clean,
well‑isolated, and easy to test.

## 1. One concept per file

- Each `.ts` file should export a single *primary* symbol (class, interface or
  enum).  Helper types or closely related utility classes may co‑exist, but if
  a helper grows beyond a few lines it should live in its own file.  Example:
  `ConfigStore` and `ConfigParser` live in separate modules now.
- Avoid large "kitchen sink" files; 200‑300 lines is a good upper bound.

## 2. Named exports only

- Prefer `export class Foo` / `export interface Bar` over `export default`.
  This makes refactors and tooling assistance (rename/import) more reliable.
- Do not export implementation details that callers don’t need. Keep them
  module‑private (`function`/`const` without `export`).

## 3. Minimal public surface area

- Only items that are consumed by other modules should be exported.
- Internal helpers should not leak; they make the public API harder to
  understand and maintain.

## 4. Avoid circular dependencies

- Structure code so that imports flow in a directed acyclic graph.  Break
  cycles by introducing abstract interfaces or extracting shared types into a
  third module.
- Do **not** use index barrels that import and re‑export many symbols; they
  are convenient but often hide dependency cycles.

## 5. Explicit dependency injection

- Pass collaborators (filesystem providers, loggers, etc.) via constructor
  arguments rather than relying on singletons or global state.  This makes
  classes easier to unit‑test and mock.

## 6. Keep implementation details private

- Use `private` / `protected` keywords on class members to document intent and
  prevent accidental usage from outside the class.

## 7. Group related types

- Domain interfaces and validator functions that belong strictly to one class
  may be defined in the same file; export them only if they’re used elsewhere.

## 8. JavaScript sources are generated

- The `src/` tree should contain **only** TypeScript source files for
  application logic.  Any `.js` files under `src/` are considered build
  artifacts and must not be edited directly.
- Source files under `src/` are purely TypeScript.  The compiler (via
  `tsc` or our esbuild-based workflow) emits all JavaScript into a separate
  `dist/` directory specified by `outDir` in `tsconfig.json`.  This keeps the
  tree clean and avoids accidental edits to generated code.  Any `.js` or
  `.js.map` files found inside `src/` are leftovers and should be deleted.
  The `.gitignore` has a catch‑all rule for `src/**/*.js` to prevent them
  from sneaking into the repository.
- Small wrapper scripts (e.g. `tools/loggen.js`) are permitted only when they
  are merely bootstrappers; the actual implementation lives in a `.ts`
  sibling and is executed via `ts-node` or through the build output.

By keeping all business logic in TypeScript we get compile‑time checking,
consistent type inference, and simpler refactoring.  Generated JavaScript
should never be modified by hand.
## Enforcement

- Linters (`eslint` with `import/no-cycle`, `no-restricted-imports`) should be
  configured to flag common violations.
- Code reviews should check for adherence to these guidelines.

By following these conventions we keep the codebase modular, safe to change,
and pleasant to work with.  New contributors should copy them when adding
features or utilities.