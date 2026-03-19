# UI E2E Test Harness

For complete development guidance, see `docs/testing/ui-e2e.md`.

## Automated Run

- Run all scenarios:

```bash
npm run test:e2e:ui
```

- Run canonical integrated profile:

```bash
npm run test:e2e:ui:canonical
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

This opens a headed (visible) Chromium session and pauses at each step when `--step` is set.

- Run canonical profile in debug mode:

```bash
npm run test:e2e:ui:canonical:debug -- --scenario "panel-webview-lifecycle"
```

## Migration

- Run one-time legacy to canonical scenario migration:

```bash
npm run test:e2e:ui:migrate
```

This emits `migration-report.json` and fails fast on unsupported mappings.

## Artifacts

Run output is written to:

- `test/e2e/ui/artifacts/<scenario>/<runId>/result.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/events.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/replay-manifest.json`

Canonical runs additionally write:

- `test/e2e/ui/artifacts/<scenario>/<runId>/summary.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/trace.json`
- `test/e2e/ui/artifacts/<scenario>/<runId>/migration-report.json` (migration mode)

## Troubleshooting

- If migration fails, inspect `migration-report.json` for `fieldPath` and `suggestedFix` details.
- If debug runs stall, confirm headed browser dependencies are installed and rerun with `--scenario` to narrow scope.
- If messageflow assertions fail, check `trace.json` and look for `accepted=false` events indicating unsupported message types.
- If lifecycle scenarios time out, inspect diagnostics for `E2E_INIT_TIMEOUT` and verify fixture readiness.

