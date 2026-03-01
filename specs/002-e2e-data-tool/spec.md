# Feature Specification: E2E Test Data Tool

**Feature Branch**: `002-e2e-data-tool`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "I am looking to create a tool in the 'tool' folder that can be used to create test data for e2e testing. I would like this tool to be able to create log files in a file format that is configurable through json configurations and be able to push these log files to a WSL container instance. After which, the tool will also be able to remove those files if needed. Additionally, I would like to be able to in the future use this same tool to create log files to be uploaded to elastisearch and kibana."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Generate log files locally (Priority: P1)

As a test engineer I want to run a CLI tool that creates one or more log files
on my workstation (i.e. in any specified local folder) using a schema defined
in a JSON configuration, so I can populate a directory with realistic test
data quickly.  The configuration should allow fixed lines, randomization of
line order, random or incrementing timestamps, and randomized values for
specified fields (e.g. log level or user ID). The generation step is
independent of any container operations.

**Why this priority**: Creating sample log files is the foundational step;
without it e2e tests cannot run. Tools that automate file generation save time
and ensure consistency.

**Independent Test**: Execute `node tools/loggen.js --config configs/sample.json
--output /tmp/logs` and verify that output directory contains files matching the
schema (e.g. correct lines, timestamps, fields). This can be done without any
containers running.

**Acceptance Scenarios**:

1. **Given** a valid JSON configuration describing a log format and count, **When**
   I run the tool with that config and an output path, **Then** the specified
   number of log files appear in the path and each file adheres to the format.
2. **Given** an invalid configuration file, **When** I invoke the tool, **Then**
   it prints a helpful error and exits with nonzero status.

---

### User Story 2 - Deploy logs to WSL container (Priority: P2)

Once log files exist, I need a command that copies them into a designated
path inside a running WSL container so downstream e2e tests can access them.

**Why this priority**: Placing logs inside the target environment simulates the
real application context; manual copying is error-prone and slow.

**Independent Test**: Start any simple WSL container (e.g., `ubuntu`), run
`node tools/loggen.js` to create logs, then run
`node tools/loggen.js --deploy containerId:/var/logs`. Afterwards verify that
files exist inside the container and can be read.

**Acceptance Scenarios**:

1. **Given** a set of generated log files and a running container ID, **When** I
   run the deploy command, **Then** each file is copied into the container
   path and the tool reports success.
2. **Given** the container is not running or path is invalid, **When** the
   deploy command executes, **Then** it returns an error message and nonzero
   exit code.

---

### User Story 3 - Cleanup and future elastic upload (Priority: P3)

After tests complete I want to remove deployed log files from the container and
optionally generate logs formatted for Elasticsearch ingestion.

**Why this priority**: Clean teardown prevents state bleed between test runs
and sets the stage for later enhancements that push data to search platforms.

**Independent Test**: Use the cleanup command to remove files from a test
container and verify they are gone. Run the generator with an Elasticsearch
schema and inspect output.

**Acceptance Scenarios**:

1. **Given** log files previously deployed to a container, **When** I run the
   cleanup command, **Then** the files are deleted and the tool reports which
   files were removed.
2. **Given** a request to generate Elasticsearch‑formatted logs, **When** I
   supply the appropriate config, **Then** output files contain JSON suitable
   for bulk upload (future requirement can be a stub).

---

### Edge Cases

- What if output directory already contains files? Tool should either overwrite
  or error depending on a flag.
- Network interruptions when copying into container should be handled gracefully
  with retries.
- Config JSON may specify unsupported formats; tool should validate schema.

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A CLI tool located under `tools/` that can generate log files based
  on a JSON configuration, writing to a user‑supplied local directory (any host
  folder path). The configuration must support fixed lines, random line order,
  random or sequential timestamps, and randomized values for specified fields.
  Generation must not require a container to be running.
- **FR-002**: The configuration format must allow specification of fields,
  timestamp formats, number of entries, and file naming patterns.
- **FR-003**: The tool MUST accept a `--deploy <container:path>` option which
  copies generated files into the given path inside a running WSL/Docker
  container, creating directories as needed.
- **FR-004**: A `--cleanup <container:path>` flag MUST remove previously
  deployed files from the container and report results.
- **FR-005**: The tool MUST validate input configurations and exit with
  nonzero status when invalid, printing descriptive errors.
- **FR-006**: The tool must run cross-platform (Windows, macOS, Linux) using
  Node.js so tests can be executed from any developer machine or CI agent.
- **FR-007**: Design interfaces such that future extensions can generate
  Elasticsearch/Kibana‑ready logs or push directly to those systems.

### Key Entities *(include if feature involves data)*

- **Log Configuration**: JSON document defining schema, counts, and formatting
  rules for generated log files.
- **Generated Log File**: Text or JSON file containing synthetic log entries that
  mimic real application output.
- **Container Target**: Pair of container ID/name and filesystem path used for
  deployment and cleanup operations.

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can generate a directory of at least 10 log files
  conforming to a supplied JSON schema in under 30 seconds.
- **SC-002**: The deploy command successfully copies files into a running
  container and those files are readable from within the container 100% of the
  time when the container is reachable.
- **SC-003**: Cleanup removes deployed files and returns a list of removed
  paths; performing cleanup twice in a row results in no errors.
- **SC-004**: Invalid configurations lead to tool exit within 5 seconds with a
  descriptive error message, preventing silent failures.
- **SC-005**: The tool can run on Windows, macOS, and Linux without additional
  dependencies beyond Node.js; test coverage demonstrates at least one run on
  each platform.
