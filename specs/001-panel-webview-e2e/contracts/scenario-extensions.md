# Contract: One-Time Migration to Canonical Scenario

## Purpose

Define strict migration behavior from legacy scenario and artifact expectations into the canonical schema for the rewritten framework.

## 1. Migration Inputs

Accepted sources:
- legacy scenario JSON files under `test/e2e/ui/scenarios/`
- legacy expected artifact assumptions referenced by existing test workflows

Input requirements:
- legacy files must parse as valid JSON
- each legacy scenario must have a unique legacy id

## 2. Migration Outputs

Primary output:
- canonical scenarios written to `test/e2e/ui/scenarios/`

Reporting outputs:
- `migration-report.json` containing per-scenario status and issue list

Required report fields:
- source path
- destination path when migrated
- status
- list of validation issues

## 3. Strict Validation Rules

Fail-fast conditions:
- unsupported legacy action or assertion without deterministic mapping
- ambiguous field semantics requiring human choice
- duplicate scenario identifiers after normalization
- unresolvable selector or target structure

Rule:
- any fail-fast error exits migration with non-zero status.

## 4. Field Mapping Rules

Mandatory mappings:
- legacy scenario identity -> `scenarioId`
- legacy steps -> `steps[index, action, assertions]`
- legacy expectations -> canonical assertion families

Constraints:
- zero silent field drops
- dropped field requires explicit error or documented deterministic replacement

## 5. Cutover Conditions

The rewrite is considered migrated only when:
- all in-scope legacy smoke scenarios are converted
- converted scenarios execute under the canonical integrated runner successfully
- migration report contains no unresolved errors

## 6. Post-Migration Policy

- legacy scenario format is read-only historical input
- new scenario authoring occurs only in canonical format
- canonical CI profile (`panel-webview-integrated`) is the default integrated suite target
