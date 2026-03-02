# Feature Specification: File Source Setup

**Feature Branch**: `003-file-source-setup`
**Created**: 2026-02-28
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Initialize Workspace (Priority: P1)

A developer opens a new workspace folder and needs the LogExplorer configuration directories to exist before they can create any file source or line config. They run the **Initialize Workspace** command from the Command Palette. LogExplorer creates `.logex/filepath-configs/` and `.logex/filelog-configs/` at the workspace root so that subsequent config editors have somewhere to read and write.

**Why this priority**: All other user stories depend on these directories existing. Without them nothing else can function.

**Independent Test**: Open an empty workspace, run Initialize Workspace, verify both folders are created at the workspace root.

**Acceptance Scenarios**:

1. **Given** a workspace with no `.logex` folder, **When** the user runs "LogExplorer: Initialize Workspace", **Then** `.logex/filepath-configs/` and `.logex/filelog-configs/` are created.
2. **Given** a workspace where `.logex` already exists, **When** the user runs "LogExplorer: Initialize Workspace", **Then** no error is thrown and any existing config files are left untouched.
3. **Given** the workspace has been initialized, **When** the user opens the Log Filepath Config Editor or File Log Line Config Editor, **Then** the editor finds the expected directories without error.

---

### User Story 2 – Manage Log Filepath Configs (Priority: P1)

A developer needs to tell LogExplorer where log files live on disk. They open a **Log Filepath Config Editor** panel. The editor lists all existing filepath configurations loaded from `.logex/filepath-configs/` (each stored as a kebab-named JSON file). The developer can add, edit, or delete a configuration. On save, the editor writes the JSON file back to disk using the kebab-cased short name as the filename.

**Why this priority**: File sources are the entry point of the entire log exploration workflow; without them LogExplorer has no data.

**Independent Test**: After Initialize Workspace, open the Log Filepath Config Editor, create a new config named "my-app-logs", fill in a path pattern, save, and confirm `my-app-logs.json` appears under `.logex/filepath-configs/`.

**Acceptance Scenarios**:

1. **Given** the workspace is initialized, **When** the user opens the Log Filepath Config Editor, **Then** all existing `*.json` files in `.logex/filepath-configs/` are listed by their kebab short name.
2. **Given** the editor is open, **When** the user creates a new config with short name "web-server", **Then** saving produces `.logex/filepath-configs/web-server.json` with the correct schema.
3. **Given** an existing config "web-server", **When** the user edits the path and saves, **Then** the JSON file on disk is updated and no duplicate file is created.
4. **Given** a config exists, **When** the user deletes it, **Then** the corresponding JSON file is removed from disk.
5. **Given** the user enters an invalid short name (spaces, uppercase, special characters), **When** they try to save, **Then** a validation message prevents saving.

---

### User Story 3 – Manage File Log Line Configs (Priority: P2)

A developer needs to define how individual log lines should be parsed. They open a **File Log Line Config Editor** panel. The editor reads from `.logex/filelog-configs/` and supports three line types: **Text**, **XML**, and **JSON**. For Text lines the developer can configure either prefix/suffix index-of extraction or regex capture groups, and for both methods can specify a datetime extraction rule. On save the editor writes a kebab-named JSON file back to `.logex/filelog-configs/`.

**Why this priority**: Line parsing is required to make log data meaningful, but a filepath config alone is still useful for file discovery.

**Independent Test**: After Initialize Workspace, open File Log Line Config Editor, create a Text config named "iis-access" with a regex capture group for the timestamp field, save, and confirm `.logex/filelog-configs/iis-access.json` is written with the correct schema.

**Acceptance Scenarios**:

1. **Given** the workspace is initialized, **When** the user opens the File Log Line Config Editor, **Then** all existing `*.json` files in `.logex/filelog-configs/` are listed.
2. **Given** the user selects line type **Text** and method **Prefix/Suffix Index-of**, **When** they specify a prefix string and a suffix string, **Then** the extracted value between those two markers is captured for the configured field.
3. **Given** the user selects line type **Text** and method **Regex Capture Groups**, **When** they provide a regex pattern with named capture groups, **Then** each named group is mapped to a field in the domain object.
4. **Given** either Text extraction method, **When** the user configures a datetime field, **Then** they can specify a format string (or auto-detect) for interpreting the extracted value as a datetime.
5. **Given** the user selects line type **XML**, **When** they configure XPath-style field mappings, **Then** each mapping extracts the specified node value into a field.
6. **Given** the user selects line type **JSON**, **When** they configure JSON path field mappings, **Then** each mapping extracts the specified key/path into a field.
7. **Given** a config is saved with short name "app-trace", **Then** `.logex/filelog-configs/app-trace.json` exists with the correct schema.

---

### Edge Cases

- What happens when `.logex/filepath-configs/` or `.logex/filelog-configs/` is deleted after initialization but the editor is already open?
- How does the system handle a JSON config file that is malformed or has an unrecognized schema version?
- What happens when two configs share the same kebab short name?
- How does the system handle a regex pattern that fails to compile?
- What happens when a prefix string does not appear in a sample log line?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an "Initialize Workspace" command that creates `.logex/filepath-configs/` and `.logex/filelog-configs/` at the workspace root if they do not already exist.
- **FR-002**: The Log Filepath Config Editor MUST read all `.json` files from `.logex/filepath-configs/` and display each by its kebab-cased short name (filename without extension).
- **FR-003**: The Log Filepath Config Editor MUST write a validated `FilepathConfig` domain object as JSON to `.logex/filepath-configs/<short-name>.json` on save.
- **FR-004**: The system MUST validate that short names are kebab-case (lowercase alpha, digits, hyphens only) before saving any config file.
- **FR-005**: The File Log Line Config Editor MUST support three line types: **Text**, **XML**, and **JSON**.
- **FR-006**: For **Text** line configs, the system MUST support **Prefix/Suffix Index-of** extraction: the user specifies a prefix string (start marker) and an optional suffix string (end marker); the value between them is captured.
- **FR-007**: For **Text** line configs, the system MUST support **Regex Capture Groups** extraction: the user provides a regular expression and each named capture group maps to a `TextFieldExtraction` entry.
- **FR-008**: For both Text extraction methods, the system MUST allow the user to mark any extracted string field as a datetime and supply a parse format or select auto-detect.
- **FR-009**: The File Log Line Config Editor MUST write a validated `FileLogLineConfig` domain object as JSON to `.logex/filelog-configs/<short-name>.json` on save.
- **FR-010**: The Initialize Workspace command MUST be idempotent: running it on an already-initialized workspace must not modify or delete existing config files.
- **FR-011**: Both editors MUST surface a clear, user-readable error when a config file on disk is malformed or cannot be parsed.
- **FR-012**: Both editors MUST support deleting a config, which removes the corresponding JSON file from disk after user confirmation.

### Key Entities

- **FilepathConfig**: Represents a named log file source. Key attributes: `shortName` (kebab string), `pathPattern` (glob or absolute path), `description` (optional string), `schemaVersion`.
- **FileLogLineConfig**: Top-level container for a line parsing rule. Key attributes: `shortName`, `lineType` (`text` | `xml` | `json`), `schemaVersion`, `fields` (array of field extraction configs).
- **TextLineConfig** (extends FileLogLineConfig for `lineType = text`): `extractionMethod` (`prefix-suffix` | `regex`), `prefixSuffixExtractions` (array), `regexExtractions` (array).
- **PrefixSuffixExtraction**: `fieldName`, `prefix` (string), `suffix` (string or null), `dateTimeFormat` (optional).
- **RegexExtraction**: `fieldName`, `pattern` (string), `captureGroupName` (string), `dateTimeFormat` (optional).
- **DateTimeFormat**: `formatString` (e.g. `yyyy-MM-dd HH:mm:ss`), `autoDetect` (boolean).
- **XmlLineConfig** (extends FileLogLineConfig for `lineType = xml`): `fieldMappings` (array of `XmlFieldMapping`).
- **XmlFieldMapping**: `fieldName`, `xpath` (string), `dateTimeFormat` (optional).
- **JsonLineConfig** (extends FileLogLineConfig for `lineType = json`): `fieldMappings` (array of `JsonFieldMapping`).
- **JsonFieldMapping**: `fieldName`, `jsonPath` (string), `dateTimeFormat` (optional).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initialize a workspace and have both config directories ready in under 5 seconds.
- **SC-002**: Users can create, edit, and save a filepath config in under 2 minutes from a blank workspace.
- **SC-003**: Users can create a Text-based line config with at least one extraction rule in under 3 minutes.
- **SC-004**: All saved config files are valid JSON that round-trips through the domain model without data loss.
- **SC-005**: Malformed or missing config files produce a user-facing error message rather than a crash or silent failure.
- **SC-006**: 100% of domain object types are represented in explicit, versioned JSON schemas (no implicit/untyped blobs stored to disk).
