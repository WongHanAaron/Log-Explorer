# UI E2E Test Harness

**Note**: All scenarios use the canonical schema (2.0) with in-process host runtime abstraction.

For complete development guidance, see `docs/testing/ui-e2e.md`.

## Folder Layout

- JSON scenario definitions: `test/e2e/ui/scenarios/`
- TypeScript integration specs: `test/e2e/ui/integration/`

## Automated Run

- Run integrated profile (default):

```bash
npm run test:e2e:ui
```

- Filter scenarios:

```bash
npm run test:e2e:ui:grep -- --grep "lifecycle"
```

## Debug Run

- Run a scenario in visible step mode:

```bash
npm run test:e2e:ui:debug -- --scenario "panel-webview-lifecycle" --step
```

This opens a headed (visible) Chromium session and pauses at each step when `--step` is set.

- Run debug mode for integrated profile:

```bash
npm run test:e2e:ui:debug -- --scenario "panel-webview-lifecycle"
```

## Determinism Verification

- Run repeated passes to verify scenario stability:

```bash
npm run test:e2e:ui:determinism -- --scenario "panel-webview-lifecycle"
```

## Artifacts

Run output is written to:

```
test/e2e/ui/artifacts/<scenario>/<runId>/
  ├── result.json           # Detailed test results
  ├── summary.json          # Run summary (canonical only)
  ├── trace.json            # Ordered message trace (canonical only)
  ├── events.json           # Step-by-step events
  └── replay-manifest.json  # Manifest for replay
```

## Troubleshooting

- If debug runs stall, confirm headed browser dependencies are installed and rerun with `--scenario` to narrow scope.
- If assertions fail, check `trace.json` for event ordering and `accepted=false` indicators.
- If lifecycle scenarios time out, inspect `result.json` diagnostics for `E2E_INIT_TIMEOUT` and verify fixture readiness.
- For determinism issues, check `summary.json` totals across multiple runs.


