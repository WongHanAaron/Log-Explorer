# Feature Specification: File Access Adapters

**Feature Branch**: `008-file-adapters`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "I would like to implement the file access adapters and file access configs. I want to implement the local file system adapter, sftp adapter and smb adapters only."

## User Scenarios & Testing *(mandatory)*

This feature delivers a unified, extensible API that developers can use to enumerate and read files from a variety of back‑ends. The initial scope covers local disk, SFTP servers, and SMB shares.  
The included design document (`DESIGN.md`) describes the data model and class hierarchy; it will be moved from `src/utils/fileAdapters` into this spec directory as part of the implementation.

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

### User Story 1 - Use adapter to read a local file (Priority: P1)

A developer needs to fetch the contents of a file on disk using the new adapter API.  

**Why this priority**: Accessing local files is the simplest and most common scenario; it ensures the base class and local implementation work correctly.  

**Independent Test**: Instantiate a `LocalFileAdapter` via the factory, call `readFile` on a known path, and verify the returned buffer matches the file contents.  

**Acceptance Scenarios**:

1. **Given** a valid local configuration pointing at a test directory, **When** a developer calls `readFile("/path/to/file.txt")`, **Then** the adapter returns a buffer containing the file's bytes.
2. **Given** a non‑existent path, **When** `readFile` is called, **Then** the promise rejects with an error indicating the file was not found.

---

### User Story 2 - Enumerate remote directory (Priority: P2)

A developer wants to list files on an SFTP server or SMB share with recursion and depth control.  

**Why this priority**: Directory listing is the other core capability; remote back‑ends are more complex but necessary for future features.  

**Independent Test**: Configure an in‑memory or stubbed SFTP/SMB backend in tests, call `listDir` with various options, and assert the returned list matches expectations.  

**Acceptance Scenarios**:

1. **Given** an SFTP configuration and a directory with nested files, **When** `listDir("/logs", { recursive: true, maxDepth: 2 })` is invoked, **Then** the result includes entries up to two levels deep but not further.
2. **Given** an SMB configuration, **When** `listDir("/share", { recursive: false })` is invoked, **Then** only the immediate children are returned.

---

### User Story 3 - Add new backend via factory (Priority: P3)

As a maintainer, I want the system to be extensible so that future adapters (HTTP, S3, etc.) can be added with minimal changes.  

**Why this priority**: Future proofing the architecture ensures new requirements won't require large rewrites.  

**Independent Test**: Add a dummy adapter in test code, register it with the factory via the configuration union, and verify instantiation succeeds.  

**Acceptance Scenarios**:

1. **Given** a configuration object with a `type` not currently implemented, **When** `createFileAdapter` is called, **Then** it throws an error indicating unsupported type.
2. **Given** a new adapter class and a corresponding config type is added, **When** `createFileAdapter` is executed with that config, **Then** an instance of the new class is returned.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when network credentials are invalid for an SFTP or SMB connection? The adapter should propagate a clear authentication error.  
- How does the system behave if `listDir` is called on a file path rather than a directory? The promise should reject with a meaningful error.  
- Recursive listings must respect `maxDepth` even if cycles or symlinks occur.  
- Config objects with missing required fields should be rejected early, preferably at compile time; runtime checks may still throw if malformed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a `FileSourceConfig` discriminated union containing configuration variants for each supported adapter type (local, sftp, smb).  
- **FR-002**: System MUST provide an abstract base class `FileAccessAdapter` exposing `readFile(path: string): Promise<Buffer>` and `listDir(path: string, options?: ListDirOptions): Promise<string[]>` with an associated `ListDirOptions` interface supporting `recursive` and `maxDepth`.  
- **FR-003**: The `LocalFileAdapter`, `SftpFileAdapter`, and `SmbFileAdapter` classes MUST extend `FileAccessAdapter` and implement the required methods; optional helpers (`stat`, `delete`) should be included where feasible.  
- **FR-004**: A factory function `createFileAdapter(config: FileSourceConfig): FileAccessAdapter` MUST instantiate the appropriate adapter or throw an error for unsupported types.  
- **FR-005**: Adapters MUST handle error conditions gracefully, rejecting promises on missing files, authentication failures, or network errors.  
- **FR-006**: The codebase MUST include unit tests covering each adapter's basic operations and the factory logic.  
- **FR-007**: The design document currently at `src/utils/fileAdapters/DESIGN.md` MUST be relocated into the new spec directory and referenced from documentation.  
- **FR-008**: Implementation code for file adapters MUST live under `services/fileaccess` and configuration types MUST be placed in `domain/config/fileaccess`; all existing domain config objects should be consolidated into `domain/config`.

### Key Entities *(include if feature involves data)*

- **FileSourceConfig**: Union type representing configuration for each backend (e.g., `LocalConfig`, `SftpConfig`, `SmbConfig`).  
- **FileAccessAdapter**: Abstract class defining the adapter interface and shared behavior.  
- **ListDirOptions**: Parameter object controlling recursive directory listing.  
- **LocalFileAdapter**, **SftpFileAdapter**, **SmbFileAdapter**: Concrete subclasses implementing `FileAccessAdapter`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can instantiate an adapter with valid configuration and perform `readFile` and `listDir` operations for local, SFTP, and SMB sources with correct results in 100% of tested cases.  
- **SC-002**: Unit test suite provides at least 90% coverage of new adapter classes and factory code, and all tests pass on CI.  
- **SC-003**: The feature directory contains the relocated `DESIGN.md` file and documentation references it in at least one README or comment.  
- **SC-004**: The system gracefully returns errors for unsupported config types, missing files, authentication failures, and respects `maxDepth` during recursive listings in all edge cases.

