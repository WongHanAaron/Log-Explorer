# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a set of file access adapters exposing a common read-only API for enumerating
and reading files from multiple back-ends. The initial delivery will include local disk,
SFTP servers, and SMB shares; a factory function will map configuration objects to the
correct adapter class. This feature lays the groundwork for future back-ends by using a
discriminated union for configuration and an abstract base class that handles shared
signature semantics and optional helpers.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x targeting ES2020/ES2022, Node.js 18+ (per project constraints)  
**Primary Dependencies**: built‑in Node modules (`fs`, `path`), `ssh2-sftp-client` for SFTP, `smb2` for SMB, occasionally `chai`/`mocha` for tests.  
**Storage**: file system accesses only; no database.  
**Testing**: Mocha/Chai test framework; integration tests run via `@vscode/test-cli`/`@vscode/test-electron`.  
**Target Platform**: VSCode Extension Host on cross‑platform OS (Windows, macOS, Linux).  
**Project Type**: VSCode extension with shared library code under `src/`; the adapters are part of the extension's backend logic.  
**Performance Goals**: adequate for interactive file listing, ~10k entries per second; not a bottleneck in log exploration.  
**Constraints**: cross‑platform compatibility, no native modules beyond NPM packages with prebuilt binaries. Network operations should time out gracefully.  
**Scale/Scope**: small code addition (~few hundred lines), affecting utility functions used across the extension; affects both unit and e2e test suites.

## Constitution Check

The constitution establishes core principles and workflow rules (including branch-per-cycle and
squash-merges). During planning, verify that your proposed design and tooling respect these
guidelines. Any deviation must be justified below.

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature is developed on its own branch (`008-file-adapters`) as required.  Testing will
follow the test-first directive (unit tests for each adapter and the factory before
implementation).  All code will comply with cross-platform constraints and the security
principles (no webviews introduced). No violations are anticipated.

## Project Structure

The adapters will reside under the existing `src/utils/fileAdapters/` folder, with
types and concrete classes in that directory.  Unit tests will be placed in
`test/unit/utils/fileAdapters/` alongside any helper mocks. The factory may
live in `src/utils/fileAdapters/factory.ts` or similar.

```text
services/fileaccess/
├── FileAccessAdapter.ts          # abstract base class & types
├── LocalFileAdapter.ts           # local implementation
├── SftpFileAdapter.ts            # sftp implementation
├── SmbFileAdapter.ts             # smb implementation
├── factory.ts                    # createFileAdapter
└── types.ts                      # config union and ListDirOptions

# tests for adapters
test/unit/services/fileaccess/
├── LocalFileAdapter.test.ts
├── SftpFileAdapter.test.ts
├── SmbFileAdapter.test.ts
└── factory.test.ts
```

**Structure Decision**: single project with code under `src/` and tests under
`test/`. Existing repository layout already matches this pattern; no new top-level
projects are required.

```text
specs/008-file-adapters/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```
### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
