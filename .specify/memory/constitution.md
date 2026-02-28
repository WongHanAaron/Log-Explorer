<!--
Sync Impact Report
- Version bumped: (template) -> 1.0.0 (initial adoption with detailed principles and git workflow rules)
- Added Principles: I. Simplicity & Focus; II. Secure Webview Practices; III. Test‑First Development; IV. Branch‑per‑Speckit‑Cycle & Linear History; V. Semantic Versioning & Releases
- Added Sections: Technical Constraints, Development Workflow, Governance (populated with amendment process)
- Templates updated:
  - ✅ .specify/templates/plan-template.md (inserted branch/merge guidance in Constitution Check)
  - ✅ .specify/templates/spec-template.md (branch naming already present, no change required)
  - ⚠ .specify/templates/tasks-template.md (no constitution-driven changes needed at this time)
  - ⚠ .specify/templates/commands/*.md (no outdated references)
- Runtime docs updated: README.md and specs/001-vscode-extension-setup/quickstart.md now mention branch and merge rules
- No placeholders remain in constitution
- TODO: none
-->

# LogExplorer Constitution

The LogExplorer project is governed by this constitution. It defines non‑negotiable development principles,
workflow constraints, and governance rules to ensure consistency, security, and quality throughout the
extension’s lifecycle.

## Core Principles

### I. Simplicity & Focus

- The extension delivers a narrowly scoped log exploration experience; feature creep is prohibited.
- Dependencies must provide direct user value. Excess libraries are removed promptly.
- Code is modular, readable, and documented. Refactor before adding complexity (YAGNI).

### II. Secure Webview Practices (NON‑NEGOTIABLE)

- Every webview SHALL enforce a strict Content Security Policy using per‑page nonces.
- Local resources MUST be served via `webview.asWebviewUri` with `localResourceRoots` set.
- Messages between extension and webview MUST include explicit type fields and be validated.

### III. Test‑First Development (NON‑NEGOTIABLE)

- Write failing tests before implementation. No code is committed without corresponding tests.
- New features MUST include unit and/or integration tests. Bug fixes require regression tests.
- The Red‑Green‑Refactor cycle is strictly enforced; CI must run `npm test` on every PR.

### IV. Branch‑per‑Speckit‑Cycle & Linear History

- Each `/speckit` workflow cycle (specify, plan, tasks, implement) SHALL occur on its own feature
  branch named `[###-short-description]`.
- Merges to `master` MUST be performed using squash‑and‑merge to keep history linear and easy to
  revert. Long‑running branches SHOULD rebase regularly on `master`.

### V. Semantic Versioning & Releases

- The extension uses semantic versioning. Initial development uses `0.y.z`; bump MAJOR for breaking
  changes, MINOR for new features, PATCH for fixes.
- Release tags in Git MUST match `package.json` version. Packaged `.vsix` files are produced for
  distribution and retained in release notes.

## Technical Constraints

- Language: TypeScript 5.x targeting ES2020. Bundler: esbuild.
- Runtime: Node.js 18+ within VSCode Extension Host.
- Target API: `vscode` ^1.85.0; ensure compatibility with declared engine version.
- Testing: Mocha with `@vscode/test-cli`/`@vscode/test-electron` for integration tests.
- Cross‑platform code only; no native binaries or OS‑specific assumptions.

## Development Workflow

- Follow the speckit phases strictly. Use templates under `.specify/templates` for spec, plan, tasks.
- PRs must include updated spec, plan, and tasks documents for new features.
- Code reviews are mandatory. Reviewers must verify constitution compliance and test coverage.
- CI pipelines run `npm run build` and `npm test` on pull requests; failures block merging.

## Governance

- The constitution supersedes any ad‑hoc practices. All contributors are bound by its provisions.
- Amendments require a documented proposal, approval by at least one peer, and an explicit version
  bump. Major changes that alter workflow or remove core principles require a MAJOR version bump.
- Compliance is checked during planning and code review. Non‑compliant changes must be remediated
  before a merge is accepted.
- This document is version controlled. The **RATIFIED** date marks the original adoption. The
  **LAST AMENDED** date updates whenever modifications are made.

**Version**: 1.0.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
