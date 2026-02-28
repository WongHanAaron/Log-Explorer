# Feature Specification: Docker Kibana Integration for Tests

**Feature Branch**: `001-kibana-integration`  
**Created**: 2026-02-28  
**Status**: Completed  
**Input**: User description: "Setup a local docker kibana instance that we can use to test the connection and API querying against. Provide an easy script to spin up and integrated test case for different major versions of Kibana"

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

### User Story 1 - Start a local Kibana instance (Priority: P1)

A developer working on the LogExplorer extension wants to quickly launch a
Kibana server in Docker so they can verify that the extension can successfully
connect and issue API requests. The script should be simple to run and return
port information.

**Why this priority**: Without a local Kibana server there is no way to
validate networking or API interaction; spinning up the instance on demand is
core to testing and development.

**Independent Test**: Run the provided script with a specified Kibana version,
then execute a sample API call (e.g. `GET /api/status`) and confirm a 200
response. The script is the only thing needed – the extension itself is not
required for this test.

**Acceptance Scenarios**:

1. **Given** no Kibana container is running, **When** the developer executes
   `./scripts/kibana.sh start` (or equivalent), **Then** a Docker container
   using the default Kibana image is created, started, and the script prints
   the exposed HTTP port.
2. **Given** the container is running, **When** the developer runs a curl
   command against `localhost:<port>/api/status`, **Then** the response status
   code is 200 and the returned JSON contains version information.

---

### User Story 2 - Support multiple major versions (Priority: P2)

The team needs to validate compatibility with several major versions of Kibana
(eg. 7.x, 8.x). The script should accept a version parameter and the integration
test suite should iterate over a configurable list of versions.

**Why this priority**: Ensuring the extension works across versions reduces
regression risk and supports users on different Kibana releases.

**Independent Test**: Invoke the script with `--version 7.16.3` and verify the
container starts with that tag; repeat with `--version 8.4.0`. In isolation,
one can run the tests defined in the repo to verify the version loop works.

**Acceptance Scenarios**:

1. **Given** the script has a `--version` argument, **When** the developer
   provides a version string, **Then** the Docker image `docker.elastic.co/kibana:<version>`
   is pulled and used for the container.
2. **Given** a list of versions in a config file or environment variable, **When**
   the integration test is executed, **Then** it runs the same connectivity
   checks against each version sequentially and reports success/failure per
   version.

---

### User Story 3 - Automated integrated test case (Priority: P3)

As part of the repository's automated tests, run a lightweight integration test
that starts Kibana, performs a simple API query, and tears down the container.
This should be callable from CI and should not require manual intervention.

**Why this priority**: Continuous verification prevents breaks when API
contracts change or when Docker/Kibana setup drifts.

**Independent Test**: Execute `npm run test:kibana` (or the equivalent command)
locally; the command should spin up Kibana, exercise the API, then exit with 0
if all checks pass.

**Acceptance Scenarios**:

1. **Given** the repository is checked out, **When** the CI job runs the
   Kibana integration script, **Then** the job completes within a reasonable
   time (e.g. <5 min) and returns success unless a connection/API error occurs.

---

### Edge Cases

- What happens when Docker is not installed, not running, or the user lacks
  permissions? The script should detect this and show a clear error message.
- How does the system handle port collisions if the default HTTP port is in use?
  Script should either choose a random free port or allow the user to specify one.
- The supplied Kibana version may be invalid or unavailable; the script should
  report a download failure and exit cleanly.

[Add more user stories as needed, each with an assigned priority]

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide a shell script (or cross‑platform JS script) that can
  start a Kibana Docker container, optionally taking a version parameter and
  returning the hostname and port where the service is reachable.
- **FR-002**: The script MUST check for Docker availability and exit with a
  clear error if Docker is not installed/running or the user lacks permission.
- **FR-003**: The script MUST support stopping and cleaning up the container
  when requested, including on failure or timeout.
- **FR-004**: Allow specifying the HTTP port (either via command‑line flag or
  environment variable) and default to a free ephemeral port if the default is
  already in use.
- **FR-005**: Maintain a configuration mechanism (file or environment variable)
  listing one or more major Kibana versions to be exercised by automated tests.
- **FR-006**: Implement an automated integration test command that iterates
  over configured versions, invokes the script to start Kibana, performs a
  simple HTTP request to `/api/status`, and tears down the container.
- **FR-007**: The integration test MUST run non‑interactively and return a
  nonzero exit code if any version fails the connectivity check.

### Key Entities *(include if feature involves data)*

- **Kibana Instance**: A running Docker container based on
  `docker.elastic.co/kibana:<version>`; key attributes are the version, host,
  and port.
- **Version List**: A list of Kibana major versions (e.g., `7.16`, `8.4`)
  stored in a simple text file or environment variable used by the integration
  test command.
- **Kibana Script**: The helper script itself, which exposes commands such as
  `start`, `stop`, `status`, and accepts parameters for version and port.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can start a local Kibana instance by running a single
  script command, and the service becomes available within 60 seconds.
- **SC-002**: The startup script succeeds on at least three different Kibana
  major versions (e.g. 7.x, 8.x, 9.x if relevant) when those versions are
  listed in the configuration, with the integration test reporting success for
  each.
- **SC-003**: A failure of Docker or an invalid version causes the script to
  exit with a clear error message and nonzero code 100% of the time.
- **SC-004**: The automated integration test can be executed in CI in under
  five minutes and returns a pass/fail result; 95% of CI runs should succeed
  assuming Docker is operational and network access is available.
- **SC-005**: If the default HTTP port is in use, the script automatically
  selects a free port and informs the user, with confirmation that the service
  is reachable at that port.

---

*All acceptance criteria satisfied. Implementation completed; this feature is
ready for merge.*
