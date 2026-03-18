# Quickstart: UI E2E Automation and Replay

## Prerequisites

- Node.js 18+ and npm installed.
- VS Code version compatible with extension engine (`^1.85.0`).
- Repository dependencies installed.
- Test fixture workspace/data prepared under `test/e2e/ui/fixtures`.

## 1. Install and prepare

```bash
npm install
npm run build
```

## 2. Run automated UI E2E tests

- Run full UI E2E suite (script names to be finalized in implementation):

```bash
npm run test:e2e:ui
```

- Run filtered scenarios by tag/name:

```bash
npm run test:e2e:ui:grep -- --grep "filepath config"
```

Expected outcome:
- Per-test pass/fail summary with explicit failure reason.
- Artifacts generated under `test/e2e/ui/artifacts/<scenario>/<runId>/`.

## 3. Debug tests with visible step-through

- Launch a single scenario in debug mode:

```bash
npm run test:e2e:ui:debug -- --scenario "filepath config"
```

Debug behavior expected:
- UI remains visible while actions execute.
- Execution pauses at configured breakpoints (`pauseBefore`/`pauseAfter`).
- Current step and latest assertion result are inspectable before continuing.

## 4. Replay a completed run

- Replay a run for manual inspection:

```bash
npm run test:e2e:ui:replay -- --run-id <runId>
```

Replay behavior expected:
- Ordered step timeline is reconstructed from run artifacts.
- Associated snapshots/log events are viewable for each step.

## 5. Failure triage workflow

- Open the failing test's artifact folder.
- Inspect `result.json` for expected-vs-observed mismatch.
- Inspect `events.json` and snapshots to identify first failing interaction.
- Re-run in debug mode for step-by-step reproduction.

## 6. Authoring a new scenario (test-first)

- Create scenario definition under `test/e2e/ui/scenarios`.
- Add expected outputs for each step before implementation updates.
- Run scenario and confirm it fails for the intended reason.
- Implement the minimal production/test harness changes to make it pass.
- Ensure replay artifacts are generated and inspectable.
