# Feature Specification: Local VSIX Packaging & Install Scripts

**Feature Branch**: `002-local-vsix-install`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "Setup scripts to build this extension into a package that can be installed on any VSCode instance for local usage but not to be published on the marketplace yet"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Package the Extension into a Distributable File (Priority: P1)

A developer has made changes to the extension and wants to share it with a colleague or install it
on another machine. They run a single command from the project root that compiles the source,
bundles all assets, and produces a versioned `.vsix` file in a designated output folder. The
command runs without requiring a marketplace publisher account or internet access to a registry.

**Why this priority**: Producing a distributable file is the foundational step — without a `.vsix`
the extension cannot be installed anywhere. It delivers direct value because the output can be
shared and installed immediately.

**Independent Test**: Run the package command from a clean checkout (after `npm install`), verify
that a `.vsix` file appears in the designated output location whose filename includes the current
version number from `package.json`.

**Acceptance Scenarios**:

1. **Given** the project has been checked out and dependencies installed, **When** the developer
   runs the package command, **Then** a `.vsix` file is produced in the output folder with a
   filename of the form `logexplorer-<version>.vsix`.
2. **Given** the package command is run, **When** it completes successfully, **Then** no publisher
   account, internet connection, or marketplace credentials are required.
3. **Given** there are uncommitted build artefacts in the output folder, **When** the package
   command is run again, **Then** the previous `.vsix` is overwritten or replaced by the new one.
4. **Given** the TypeScript source fails to compile, **When** the package command is run, **Then**
   it exits with a non-zero code and a clear error message — no partial `.vsix` is produced.

---

### User Story 2 - Install the Packaged Extension into the Local VSCode (Priority: P2)

A developer wants to test the packaged extension in their own VSCode without navigating the UI.
They run a single install command that locates the latest `.vsix` in the output folder and
installs it into the currently active VSCode instance, then prompts them to reload the window.

**Why this priority**: Packaging is only useful if the installed result can be verified quickly.
An automated install command removes friction and reduces the chance of installing the wrong file.

**Independent Test**: After running the package command (US1), run the install command and confirm
that the extension appears in VSCode's installed extensions list at the correct version.

**Acceptance Scenarios**:

1. **Given** a `.vsix` file has been produced by the package command, **When** the developer runs
   the install command, **Then** the extension is installed into VSCode and the version shown in
   the Extensions panel matches `package.json`.
2. **Given** the install command is run, **When** a previous version of the extension is already
   installed, **Then** it is replaced by the new version without manual uninstallation.
3. **Given** no `.vsix` file exists in the output folder, **When** the install command is run,
   **Then** it exits with a clear message explaining that the package must be built first.

---

### User Story 3 - Build, Package, and Install in One Step (Priority: P3)

A developer starting a fresh testing session wants to rebuild from source, package, and install
with a single command so they do not have to remember the correct sequence of individual commands.

**Why this priority**: Reduces cognitive overhead and mistake risk when iterating rapidly. Useful
for contributors who are less familiar with the toolchain.

**Independent Test**: From a state where no `dist/` output exists, run the combined command and
verify that: source is compiled, a `.vsix` is produced, and the extension is installed in VSCode
— all without any intermediate manual steps.

**Acceptance Scenarios**:

1. **Given** no prior build output exists, **When** the combined command is run, **Then** the
   source is compiled, a `.vsix` is produced, and the extension is installed, all in sequence.
2. **Given** the combined command is run, **When** an intermediate step fails (e.g., compile
   error), **Then** subsequent steps are skipped and a clear error message identifies which step
   failed.

---

### Edge Cases

- What happens when `package.json` version has not been bumped since the last package? The
  packaging still succeeds; the new `.vsix` overwrites the old one with the same filename.
- What happens when VSCode is not installed or the `code` CLI is not on the PATH? The install
  step fails with a message asking the user to install VSCode and ensure the CLI is available.
- What happens when the output folder does not exist yet? The packaging script creates it
  automatically.
- What happens when disk space is insufficient to write the `.vsix`? The script exits with a
  clear error; no partial file is left on disk.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST expose a dedicated `package:local` (or equivalent) npm script that
  compiles the extension and produces a `.vsix` file without requiring marketplace credentials.
- **FR-002**: The produced `.vsix` filename MUST include the version from `package.json`
  (e.g., `logexplorer-0.1.0.vsix`).
- **FR-003**: The `.vsix` output MUST land in a clearly named folder (e.g., `releases/`) that is
  excluded from version control and from the packaged extension itself.
- **FR-004**: The project MUST expose an `install:local` (or equivalent) npm script that installs
  the most recently built `.vsix` into the local VSCode instance using the `code` CLI.
- **FR-005**: The `install:local` script MUST fail with a descriptive message when no `.vsix` is
  found in the output folder.
- **FR-006**: The project MUST expose a `release:local` (or equivalent) npm script that chains
  package and install in the correct order, stopping on the first failure.
- **FR-007**: All scripts MUST work on Windows, macOS, and Linux without modification.
- **FR-008**: The packaging scripts MUST NOT include steps that upload, publish, or transmit the
  package to any external registry or marketplace.
- **FR-009**: The `releases/` output folder MUST be listed in `.gitignore` and `.vscodeignore`.
- **FR-010**: A short usage reference MUST be added to the project README describing the three
  scripts and the expected output.

### Assumptions

- The `code` CLI command is available on the developer's PATH (standard VSCode installation
  on all platforms).
- The project already has `@vscode/vsce` installed as a dev dependency (confirmed in feature 001).
- Versioning of the extension (bumping `package.json` version) is handled manually by the
  developer before running the package script; automatic version bumping is out of scope.
- The `releases/` folder name is a reasonable default; no preference for a different name was
  stated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from a clean checkout to a fully installed local extension in
  under 2 minutes by running at most two commands (`npm install` then `npm run release:local`).
- **SC-002**: The package command completes without errors on Windows, macOS, and Linux in a
  standard Node.js 18+ / VSCode 1.85+ environment.
- **SC-003**: The install command requires zero manual UI interaction — no file picker, no
  drag-and-drop.
- **SC-004**: When any script step fails, the developer receives a message that identifies the
  failed step and the corrective action within the terminal output, with no need to inspect
  intermediate files.
- **SC-005**: The `.vsix` produced by the packaging script installs and activates in VSCode
  with zero errors in the Extensions panel.
