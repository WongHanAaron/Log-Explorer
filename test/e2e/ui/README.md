# UI E2E Test Harness

For complete development guidance, see `docs/testing/ui-e2e.md`.

## Automated Run

- Run all scenarios:

```bash
npm run test:e2e:ui
```

- Filter scenarios:

```bash
npm run test:e2e:ui:grep -- --grep "filepath config"
```

## Debug Run

- Run a scenario in visible step mode:

```bash
npm run test:e2e:ui:debug -- --scenario "filepath-config-smoke" --step
```

This opens a visible Chromium session and pauses at each step when `--step` is set.

## Artifacts

Run output is written to:

- `test/e2e/ui/artifacts/<scenario>/<runId>/result.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/events.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/replay-manifest.json`
