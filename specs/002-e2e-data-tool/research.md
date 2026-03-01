# Research Notes: E2E Test Data Tool

**Date**: 2026-02-28
**Feature**: E2E Test Data Tool

## Unknowns / Clarifications

1. Which configuration schema format will be easiest for users? JSON only or
   support YAML/TOML later?
2. Should file generation be synchronous JS, or would a streaming approach be
   beneficial for large logs?
3. What container API is the simplest: `docker cp` via CLI or use
   `dockerode` Node library?
4. How to handle Windows paths when deploying into WSL containers?
5. Will logs eventually need to be pushed to Elasticsearch directly, and if so
   what format will they require?

## Research Tasks and Outcomes

### Schema format

**Decision**: Start with JSON only. It is already mentioned in the spec and is
native to Node.js. Adding YAML/TOML later is trivial if needed.

### Generation implementation

**Decision**: Use plain Node.js filesystem APIs to write files. Streaming
(entry-wise) can be added later; initially generate small-to-medium logs
synchronously in memory. If performance becomes an issue we can rework.

### Container interaction

**Decision**: Execute `docker cp` via child_process rather than introduce
`dockerode`. The CLI dependency keeps the tool lightweight and avoids binary
install issues. Testing will occur under WSL; `docker cp` operates from the
host so handles paths transparently.

### Path handling

**Decision**: Accept POSIX-style paths for container destinations; translate
Windows paths to WSL style when necessary (basic `wslpath` call if available).
For generation target directories on host, use cross-platform `path` module.

### Future Elasticsearch support

**Decision**: Design configs with an optional `outputFormat` field; defaults to
"text" but could be "es-bulk". Implementation for ES will be stubbed in.v

## Summary of Decisions

- Use Node.js CLI with JSON configuration.
- Generation occurs via synchronous file writes; log lines built in JS.
- Deployment uses `docker cp` command.
- Maintain cross-platform path normalization with `path` and `wslpath`.
- Config schema extensible with format field for eventual ES/Kibana output.

All key clarifications resolved; prepared to move into Phase 1 design.