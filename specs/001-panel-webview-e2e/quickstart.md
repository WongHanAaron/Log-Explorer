# Quickstart: Panel-Webview E2E Rewrite

## Goal

Migrate legacy UI scenarios once, then execute canonical integrated panel+webview scenarios using the rewritten host runtime abstraction.

## Prerequisites

- Install dependencies: `npm install`
- Install browser runtime for UI harness: `npx playwright install chromium`
- Ensure fixture workspace exists: `test/e2e/ui/fixtures/default-workspace`

## 1. Run Existing UI E2E Harness Baseline

Use the current harness entrypoint to confirm baseline execution mode:

```bash
npm run test:e2e:ui
```

Expected:
- harness starts through `scripts/run-ui-e2e.js`
- scenarios run from `test/e2e/ui/scenarios/`
- artifacts written under `test/e2e/ui/artifacts/`

## 2. Run One-Time Migration to Canonical Schema

Execute migration tooling for legacy scenario conversion:

```bash
npm run test:e2e:ui -- --migrate
```

Expected:
- canonical scenarios generated in `test/e2e/ui/scenarios-canonical/`
- `migration-report.json` generated
- process exits non-zero on unsupported or ambiguous mappings

## 3. Run Canonical Integrated Suite (Automated)

Run integrated panel+webview scenarios in non-interactive mode:

```bash
npm run test:e2e:ui -- --profile panel-webview-integrated
```

CI convenience command:

```bash
npm run test:e2e:ui:canonical
```

Expected checks:
- panel lifecycle actions pass
- host and webview message assertions pass
- `summary.json`, `events.json`, and `trace.json` generated

### MVP Lifecycle Smoke (US1)

Run only the lifecycle scenario:

```bash
npm run test:e2e:ui:canonical -- --scenario "panel-webview-lifecycle"
```

Expected:
- panel session is created
- init message is observed
- scenario passes with canonical artifacts

## 4. Run Canonical Integrated Debug Mode

Use existing debug entrypoint with a scenario selector:

```bash
npm run test:e2e:ui:debug -- --scenario "panel-webview-fileaccess-smoke"
```

Use debug mode for:
- initialization timeout and sequencing diagnosis
- message ordering inspection
- host runtime outcome verification

## 5. Validate Determinism

Run the same integrated scenario three times with the same fixture:

```bash
npm run test:e2e:ui -- --scenario "panel-webview-fileaccess-smoke"
```

Or use the deterministic triple-run helper:

```bash
npm run test:e2e:ui:determinism -- --scenario "panel-webview-lifecycle"
```

Acceptance:
- identical pass/fail outcome classification across runs
- stable ordered trace events for equivalent flow

## 6. Cutover Verification

Before declaring canonical runner default:
- all in-scope legacy smoke scenarios migrate successfully
- migration report contains no unresolved errors
- migrated scenarios pass under integrated canonical runner

## Validation Evidence

Validated on 2026-03-19 with:
- `npm run test:e2e:ui:migrate`
- `npm run test:e2e:ui:canonical`
- `npm run test:e2e:ui:determinism -- --scenario "panel-webview-lifecycle"`
