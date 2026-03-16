# Phase 0 Research: UI E2E Automation and Replay

## Decision 1: UI automation stack for VS Code extension workflows

- Decision: Use the existing VS Code Extension Test Host flow (`@vscode/test-electron`) with TypeScript/Mocha tests, and add browser automation for webview interactions via Playwright-compatible adapters.
- Rationale: This preserves repository conventions, enables true UI interaction for extension webviews, and supports both headless automation and visible debug sessions.
- Alternatives considered: Use only unit/integration mocks (rejected because it does not validate real UI behavior); switch to an entirely new test framework (rejected due to migration overhead and lower alignment with current scripts).

## Decision 2: Debug-step execution model

- Decision: Implement scenario steps as explicit action/assert phases with optional breakpoints (`pauseBefore`, `pauseAfter`) and a debug runtime that can step through each phase.
- Rationale: Structured steps make failures diagnosable and give developers predictable pause points while watching the UI.
- Alternatives considered: Attach a generic debugger without step contracts (rejected due to inconsistent pause behavior); rely on ad-hoc sleeps and logs (rejected due to flakiness and poor observability).

## Decision 3: Output verification strategy

- Decision: Require each interaction step to declare expected observable outputs (UI text/state/messages/files) and evaluate them using deterministic assertion adapters.
- Rationale: Per-step assertions localize failures, satisfy FR-003/FR-004, and enable clear expected-versus-actual reporting.
- Alternatives considered: Assert only at end of scenario (rejected because root-cause diagnosis is slower); manual-only verification (rejected because it does not provide reliable automation).

## Decision 4: Replay artifact format

- Decision: Persist run artifacts as timestamped JSON traces with optional screenshots and event logs in `test/e2e/ui/artifacts/<scenario>/<runId>/`.
- Rationale: JSON traces are easy to diff, inspect, and replay in tooling; screenshot pointers improve manual verification.
- Alternatives considered: Video-only replay (rejected due to larger storage and weaker structured queryability); logs-only text output (rejected due to poor step reconstruction).

## Decision 5: Stability and flake control

- Decision: Standardize wait conditions (selector readiness, message receipt, and command completion) and prohibit fixed arbitrary delays except as controlled fallback.
- Rationale: Condition-based waits reduce platform variability and improve repeatability in CI and local debug sessions.
- Alternatives considered: Broad timeout increases (rejected because they hide synchronization bugs); retry entire suite on fail (rejected due to masking regressions).

## Decision 6: Integration boundaries and ownership

- Decision: Keep test orchestration under `test/e2e/ui` and only add minimal production hooks in `src/` where required for deterministic observation.
- Rationale: Constrains feature scope and maintains constitution principle of simplicity/focus.
- Alternatives considered: Build a full in-extension test framework (rejected as over-engineered for current scope); add broad instrumentation to all panels (rejected due to maintenance cost).
