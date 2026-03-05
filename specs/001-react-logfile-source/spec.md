# Feature Specification: React-based LogFileSourcesPanel

**Feature Branch**: `001-react-logfile-source`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Update the LogFileSourcePanel to use React for defining the UI. Follow the pattern from #file:NewSessionPanel.ts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open editor with React UI (Priority: P1)

When a user requests to create a new filepath configuration or edit an existing one, the extension opens the Log Filepath Config panel and renders its contents using a React‑based webview instead of the current hand‑rolled HTML/JS.

**Why this priority**: Migrating the panel to React is the core of the feature and unlocks easier maintenance and UI consistency across the product.

**Independent Test**: Invoke the command that opens the filepath editor and verify that the panel content is produced by React (look for the React root element, or the presence of the new `log-file-sources.js` script) and that basic UI chrome (title, form placeholders) appears.

**Acceptance Scenarios**:

1. **Given** the user has a workspace open, **When** they execute "New filepath config" or open an existing config, **Then** a webview panel titled "Log Filepath Config" opens and displays the React UI.
2. **Given** the workspace has no folder open, **When** the user triggers the command, **Then** an error message is shown and no panel is opened.

---

### User Story 2 - Persist configuration (Priority: P2)

A user can fill out the fields in the React form and submit; the extension persists the data exactly as before.

**Why this priority**: Saving is the primary action users take in the panel; it must continue to work seamlessly after migration.

**Independent Test**: Populate form fields, click save and confirm that a filepath config file is created/updated under `.logex/filepath-configs` and that the panel reports success.

**Acceptance Scenarios**:

1. **Given** the React UI is loaded, **When** the user submits valid configuration data, **Then** the extension writes the config file and the webview receives a `filepath-config:save-result` message with `success: true`.
2. **Given** the submission fails (e.g. store write error), **When** the extension encounters an error, **Then** the webview receives a failure message with an errorReason and the UI shows it.

---

### User Story 3 - Validate short name (Priority: P3)

As the user types a short name, the React UI requests availability checks from the extension and displays whether the name is free.

**Why this priority**: Name validation improves user experience and prevents accidental overwrites.

**Independent Test**: Change the short name field and observe that the panel requests `filepath-config:validate-name` and that results are shown.

**Acceptance Scenarios**:

1. **Given** the user enters a new short name, **When** the field loses focus or on debounce, **Then** the webview sends a validation message and shows "available" or "taken" based on the response.

---

### Edge Cases

- What happens when the workspace root cannot be determined? (error message shown)
- How does the React UI behave if the extension sends an unexpected message type? (should ignore silently)
- What if the config store write fails due to filesystem permissions? (error is propagated to UI)
- How does the panel respond if the user cancels while a save is in progress? (close without side effects)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The LogFileSourcesPanel MUST build its webview HTML using `getReactWebviewHtml` instead of manually inlining `index.html` and script content.
- **FR-002**: The log file sources UI MUST be defined in React (`src/webview/log-file-sources/main.tsx`) with the same fields and behaviors as the existing hand‑rolled version.
- **FR-003**: The extension MUST continue to handle the same message types (`filepath-config:load`, `filepath-config:save`, `filepath-config:validate-name`, `filepath-config:cancel`) and map them to React component props/events.
- **FR-004**: The React bundle (`log-file-sources.js`) MUST be produced by the build system and referenced by `getReactWebviewHtml`.
- **FR-005**: The new panel MUST support editing an existing configuration by loading it when `shortName` is passed, as before.
- **FR-006**: On panel creation, the extension MUST send an initial load message after the webview is ready (similar to current setTimeout logic) but may rely on a `ready` message from React if preferred.
- **FR-007**: Saving a configuration from React MUST result in the same file operations and success/failure messages as the legacy UI.
- **FR-008**: Name validation requests from React MUST be forwarded to `ConfigStore.configExists` and results returned via message.
- **FR-009**: If the workspace folder is missing, the panel MUST show an error and not open.
- **FR-010**: The implementation MUST clean up disposables on dispose and allow re-opening the panel.

### Key Entities

- **FilepathConfig**: represents a log file path configuration with attributes such as `shortName`, `label`, `pathPattern`, and `description`. It is the domain object exchanged between webview and extension.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When opening the panel, the React-based UI renders within 1 second after panel creation for 95% of attempts.
- **SC-002**: Saving a valid configuration succeeds at least 99% of the time with no regression compared to legacy behavior.
- **SC-003**: The number of support issues related to editing filepath configs does not increase after deployment.
- **SC-004**: Developers can add new form fields or change layout without modifying the panel class (i.e., UI is decoupled from panel code).
