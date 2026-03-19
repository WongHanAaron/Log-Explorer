# Quickstart: Panel-Webview E2E Rewrite

## Goal

Execute canonical integrated panel+webview scenarios using the rewritten host runtime abstraction.

## Prerequisites

- Install dependencies: `npm install`
- Install browser runtime for UI harness: `npx playwright install chromium`
- Ensure fixture workspace exists: `test/e2e/ui/fixtures/default-workspace`

## 1. Run Integrated Canonical Suite (Automated)

Use the default harness entrypoint:

```bash
npm run test:e2e:ui
```

Expected:
- harness starts through `scripts/run-ui-e2e.js`
- scenarios run from `test/e2e/ui/scenarios/` via integrated profile
- artifacts written under `test/e2e/ui/artifacts/`

## 2. Validate Canonical Integrated Suite Results

Expected checks:
- panel lifecycle actions pass
- host and webview message assertions pass
- `summary.json`, `events.json`, and `trace.json` generated

### MVP Lifecycle Smoke (US1)

Run only the lifecycle scenario:

```bash
npm run test:e2e:ui -- --scenario "panel-webview-lifecycle"
```

Expected:
- panel session is created
- init message is observed
- scenario passes with canonical artifacts

## 3. Run Canonical Integrated Debug Mode

Use existing debug entrypoint with a scenario selector:

```bash
npm run test:e2e:ui:debug -- --scenario "panel-webview-lifecycle"
```

Use debug mode for:
- initialization timeout and sequencing diagnosis
- message ordering inspection
- host runtime outcome verification

## 4. Validate Determinism

Run the same integrated scenario three times with the same fixture:

```bash
npm run test:e2e:ui -- --scenario "panel-webview-lifecycle"
```

Or use the deterministic triple-run helper:

```bash
npm run test:e2e:ui:determinism -- --scenario "panel-webview-lifecycle"
```

Acceptance:
- identical pass/fail outcome classification across runs
- stable ordered trace events for equivalent flow

## 5. Cutover Verification

Before declaring canonical runner default:
- migrated scenarios pass under integrated canonical runner

## Validation Evidence

Validated on 2026-03-19 with:
- `npm run test:e2e:ui`
- `npm run test:e2e:ui:determinism -- --scenario "panel-webview-lifecycle"`
