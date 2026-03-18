# UI E2E Development Guide

This guide explains how to run the new UI E2E harness, debug through each step, and troubleshoot common issues while developing tests.

## Scope

The UI E2E harness currently supports:

- Automated scenario execution
- Scenario filtering by grep
- Visible debug runs with step-through pauses
- Artifact output for result and event inspection

## Prerequisites

- Node.js 18+
- Dependencies installed with `npm install`
- Playwright package installed (already in this repo as a dev dependency)
- Chromium runtime installed with:

```bash
npx playwright install chromium
```

- A valid fixture folder (default: `test/e2e/ui/fixtures/default-workspace`)
- At least one scenario JSON in `test/e2e/ui/scenarios`

## Quick Start

Build and type-check test code:

```bash
npm run typecheck:tests
```

Run all UI E2E scenarios:

```bash
npm run test:e2e:ui
```

Run only matching scenarios:

```bash
npm run test:e2e:ui:grep -- --grep "filepath config"
```

## Debugging and Step-Through

Run a single scenario in visible debug mode with explicit step pauses:

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-smoke" --step
```

What to expect:

- Chromium launches visibly (not headless in debug mode)
- The runner logs current step and assertion output
- The process pauses at each step and waits for Enter before continuing
- You can inspect browser state between steps

Important:

- Step-through prompts require an interactive terminal (TTY)
- If running in non-interactive environments, pause prompts are skipped

## Useful Command Variants

Debug one scenario without forcing pause at every step:

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-smoke"
```

Continue execution after failed assertions (for full timeline capture):

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-smoke" --continue-on-fail
```

Use a non-default fixture workspace:

```bash
npm run test:e2e:ui -- --workspace "default-workspace"
```

## Scenario Authoring Notes

Scenario files live in `test/e2e/ui/scenarios`.
Use `test/e2e/ui/templates/scenario.template.json` as a starting point.

Current high-value examples:

- `filepath-config.smoke.json`
- `output-verification.smoke.json`

Recommended loop when building a new scenario:

1. Add or update the scenario JSON
2. Run only that scenario in debug mode with `--step`
3. Verify assertions and UI behavior
4. Run in automated mode
5. Check artifacts for expected timeline and diagnostics

## Artifacts and How to Read Them

Artifacts are written to:

- `test/e2e/ui/artifacts/<scenario>/<runId>/result.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/events.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/replay-manifest.json`

`result.json`:

- Top-level run metadata (mode, timestamps, environment)
- Per-scenario pass/fail summary
- Diagnostics for failed assertions

`events.json`:

- Ordered timeline of step execution
- Phases such as beforeAction, afterAction, pause, resume, and afterAssert

`replay-manifest.json`:

- References artifact files for replay workflows
- Useful for tooling that needs stable run metadata

## Troubleshooting

### Playwright not installed

Symptom:

- Error code similar to `E2E_PLAYWRIGHT_NOT_INSTALLED`

Fix:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

### Fixture not found

Symptom:

- Error code `E2E_FIXTURE_MISSING`

Fix:

- Ensure fixture folder exists in `test/e2e/ui/fixtures/<name>`
- Pass a valid name via `--workspace <name>`

### No scenarios matched

Symptom:

- Error code `E2E_SCENARIO_NOT_FOUND`

Fix:

- Verify `--scenario` and/or `--grep` values
- Check file names and `id` fields in scenario JSON

### Debug pauses are skipped unexpectedly

Symptom:

- Runner does not wait for Enter

Causes:

- Terminal is non-interactive
- `UI_E2E_NONINTERACTIVE=1` is set

Fix:

- Run from an interactive terminal and unset `UI_E2E_NONINTERACTIVE`

### TypeScript import/module errors in tests

Fixes:

- Use `npm run typecheck:tests`
- Ensure test files are under `test/e2e/ui/**/*.ts`
- Keep imports relative and consistent with test tsconfig settings

## Suggested Daily Development Workflow

1. `npm run typecheck:tests`
2. `npm run test:e2e:ui:debug -- --scenario "filepath-config-smoke" --step`
3. Iterate on scenario/assertions until stable
4. `npm run test:e2e:ui` for broader verification
5. Inspect artifacts for traceability

## Related Files

- Harness README: `test/e2e/ui/README.md`
- Launcher: `scripts/run-ui-e2e.js`
- Runner: `test/e2e/ui/support/runner.ts`
- Debug runner: `test/e2e/ui/support/runner.debug.ts`
- Scenario schema: `test/e2e/ui/support/schema.ts`
