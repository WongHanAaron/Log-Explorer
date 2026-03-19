# Phase 0 Research: Panel-Webview E2E Rewrite

## Decision 1: Framework Strategy

- Decision: Perform a clean-slate rewrite of the UI e2e framework with one canonical integrated scenario schema and artifact model.
- Rationale: Required panel+webview lifecycle coverage is clearer and lower-risk in a purpose-built model than in layered legacy contracts.
- Alternatives considered:
  - Incremental extension of legacy framework: rejected because legacy abstractions underfit integrated host/webview behavior.
  - Long-term dual framework support: rejected due to maintenance and behavioral drift risk.

## Decision 2: Integrated Runtime Model

- Decision: Use a high-fidelity in-process host runtime abstraction for integrated execution.
- Rationale: Produces deterministic ordering and unified assertions across host outcomes and webview-visible state.
- Alternatives considered:
  - Full editor-host dependency in all runs: rejected due to instability and slower automation.
  - Browser-only webview harness: rejected because host behavior is not exercised.

## Decision 3: Interface Naming Policy

- Decision: Use a single canonical non-versioned runtime interface name (`HostRuntime`) and avoid version-suffixed interface identifiers.
- Rationale: This feature is a full rewrite and has limited prior surface area; non-versioned naming reduces churn and avoids parallel interface families.
- Alternatives considered:
  - `HostRuntimeV2`: rejected per clarification because version suffixing is unnecessary for this rewrite.
  - Keeping both old and new interfaces simultaneously: rejected due to ambiguity and migration overhead.

## Decision 4: Migration Strategy

- Decision: Provide a one-time automated migration tool with strict fail-fast validation and actionable diagnostics.
- Rationale: Preserves regression intent while preventing silent data loss.
- Alternatives considered:
  - Manual migration only: rejected due to scale and consistency risk.
  - Permissive migration defaults for unknown fields: rejected because it hides semantic loss.
  - Permanent support for both legacy and canonical formats: rejected due to long-term complexity.

## Decision 5: Canonical Schema Shape

- Decision: Model scenarios around integrated primitives: panel session lifecycle actions, typed message exchange checkpoints, host outcomes, and webview state assertions.
- Rationale: Directly maps to feature success criteria for end-to-end diagnosability.
- Alternatives considered:
  - Retrofitting many optional fields into legacy schema: rejected due to ambiguity and weak validation.

## Decision 6: Artifact Strategy

- Decision: Emit canonical artifacts that explicitly include ordered events, message traces, and outcome classification.
- Rationale: Supports repeatability checks and fast failure-origin triage.
- Alternatives considered:
  - Extending legacy artifact files in place: rejected because mixed semantics complicate diagnosis.

## Decision 7: Determinism and Isolation

- Decision: Require fixture-scoped isolated scenario execution with per-session IDs and stable trace ordering.
- Rationale: Needed to satisfy non-flakiness and deterministic replay expectations.
- Alternatives considered:
  - Shared mutable runtime state across scenarios: rejected due to contamination and flake risk.

## Best Practices Applied

- Validate scenario and contract shape before execution starts.
- Keep host runtime surface narrow: panel lifecycle, command hooks, message I/O, trace retrieval.
- Enforce explicit typed message envelopes and deterministic error reporting.
- Produce diagnostics with scenario path, field path, error code, and suggested fix.

## Resolved Clarifications

All planning clarifications are resolved, including strategy, runtime model, migration mode, and canonical non-versioned runtime interface naming.
