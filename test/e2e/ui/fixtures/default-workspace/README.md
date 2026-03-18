# Default Workspace Fixture

This fixture provides deterministic input data for UI E2E scenarios.

## Contract

- The fixture must contain all files referenced by scenario preconditions.
- Scenarios that reference `fixture:default-workspace` must run without additional setup.
- Any fixture change should keep existing smoke scenarios stable.

## Suggested Contents

- `log-inputs/` sample logs used by extension workflows.
- `workspace.json` baseline workspace metadata.
- `ui/` optional browser harness assets for local debug runs.
