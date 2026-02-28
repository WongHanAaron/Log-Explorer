# Research Notes: Docker Kibana Integration

**Date**: 2026-02-28
**Feature**: Docker Kibana Integration for Tests

This document captures findings and decisions needed to move from spec to design.

## Unknowns / Clarifications

1. **Script implementation language** – shell script vs Node.js cross‑platform.
2. **Testing framework** – where to place integration test and which library to use.
3. **Version configuration storage** – file vs environment variable vs hardcoded.
4. **Docker error handling** – how to detect and report missing Docker.
5. **Port selection strategy** – fixed default vs ephemeral vs user-specified.

## Research Tasks and Outcomes

### Script Language

**Decision**: Use a POSIX-compatible shell script (`scripts/kibana.sh`) with
small wrappers to support PowerShell on Windows when invoked from a powershell
session. The existing repository already relies on shell for build scripts, and
Windows users routinely run `bash` via Git for Windows or WSL. Keeping the
script simple avoids adding a new Node dependency just for CLI parsing.

**Rationale**: minimal friction, cross-platform with existing infrastructure.

**Alternatives considered**: A pure Node/TypeScript CLI using `commander` or
`yargs` – more work and heavier dependency for what is a small helper.

### Testing Framework

**Decision**: Extend the current Mocha-based test suite (used by
`test/suite/extension.test.ts`) with a new integration file. Use existing
`runTest.ts` setup to execute under Node.

**Rationale**: keeps tooling consistent; avoids introducing Jest or another
framework.

### Version Configuration

**Decision**: Maintain a simple text file `kibana-versions.txt` in root, with
one version per line; tests will read this file. Environment variable
`KIBANA_VERSIONS` can override for CI.

**Rationale**: Easy to edit in repo, visible to developers, and simple to
parse. Using env var allows CI to customize without touching code.

### Docker Availability Detection

**Decision**: The startup script will run `docker version` or `docker ps` and
check return code. If Docker is missing or not running, print an error and
exit nonzero. Integration tests will catch and treat this as skip/failure.

**Rationale**: standard technique; Docker CLI is required anyway.

### Port Selection

**Decision**: Default to port `5601` (Kibana's default). If the port is busy,
use `docker run -P` to map to a random host port and then inspect the mapping
(`docker port`). Allow users to override via `--port` flag.

**Rationale**: simplest for developers; avoids manual port scanning. Random
mapping ensures no collision.

## Summary of Decisions

- Use shell script with optional PowerShell fallback.
- Integration tests written in TypeScript/Mocha and run via existing npm test
  infrastructure.
- Version list stored in `kibana-versions.txt` with env var override.
- Script checks Docker availability and handles errors explicitly.
- Default port 5601, random mapping if unavailable, user override available.

All clarification points resolved; research phase complete.
