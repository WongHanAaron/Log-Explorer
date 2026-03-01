# Feature Specification: Extension UI Commands & Panels

**Feature Branch**: `001-extension-ui-commands`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "Update the VS Code extension with UI commands and panel components including New Session, Log File Source Config, File Log Line Config, Session Templates editors, an activity rail sidebar, a log details side panel, and a Search Results bottom panel (all stub UIs)."

## Clarifications

### Session 2026-02-28

- Q: What should happen when "Log Explorer: Setup New Workspace" is invoked but no workspace folder is open? → A: Disable the command in the Command Palette via a `when` clause (`workspaceFolderCount > 0`) so it never appears without a workspace.
- Q: What should happen when `.logex` already exists in the current workspace? → A: Hide the command entirely (not just disable it) so the user cannot see or click it once the workspace is already initialised.
- Q: What feedback should the user receive after `.logex` is successfully created? → A: Show a VS Code info notification: `"Log Explorer workspace initialised."`
- Q: What should happen if `.logex` folder creation fails (e.g., permissions error)? → A: Show a plain VS Code error notification: `"Log Explorer: Failed to initialise workspace."` with no technical detail exposed to the user.
- Q: Should the command automatically add `.logex` to `.gitignore`? → A: No — leave `.gitignore` management entirely to the user.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open New Session Panel (Priority: P1)

A user invokes the "Log Explorer: New Session" command from the Command Palette. The extension opens a new editor panel in the main window area with the title "New Session". The panel displays a stub UI — a clearly labelled placeholder area indicating future session-creation controls will appear here.

**Why this priority**: Starting a new log exploration session is the primary entry point to the extension's core workflow. All other features depend on a session existing.

**Independent Test**: Can be tested by triggering the command from the Command Palette and confirming an editor panel with the title "New Session" opens in the main editor area, delivering visible confirmation that the feature entry point is wired up.

**Acceptance Scenarios**:

1. **Given** the extension is active, **When** the user runs "Log Explorer: New Session" from the Command Palette, **Then** an editor panel titled "New Session" opens in the main window area.
2. **Given** the "New Session" panel is open, **When** the user inspects the panel, **Then** a stub UI placeholder is visible (e.g., a message indicating the area is reserved for future content).
3. **Given** the panel is already open, **When** the user triggers the command again, **Then** the existing panel is brought into focus rather than opening a duplicate.

---

### User Story 2 - Log Explorer Activity Rail Sidebar (Priority: P2)

A user opens VS Code with the Log Explorer extension installed. An icon appears in the Activity Bar (side rail). Clicking it opens a sidebar panel scoped to Log Explorer session tools. The sidebar shows a stub UI for now with placeholder content indicating where session-related tools will appear.

**Why this priority**: The activity rail is the persistent navigation hub for the extension and provides the primary discoverability surface for all Log Explorer features.

**Independent Test**: Can be tested by clicking the Log Explorer icon in the Activity Bar and verifying a sidebar panel opens with a stub UI, demonstrating the extension has a persistent presence in the editor shell.

**Acceptance Scenarios**:

1. **Given** VS Code is open with the extension active, **When** the user looks at the Activity Bar, **Then** a Log Explorer icon is visible.
2. **Given** the user clicks the Activity Bar icon, **When** the sidebar opens, **Then** it shows a stub UI with placeholder content for session tools.

---

### User Story 3 - Configure Log File Sources (Priority: P2)

A user invokes "Log Explorer: Edit Log File Source Config" from the Command Palette. An editor panel titled "Log File Sources" opens in the main editor area with a stub UI indicating where source configuration controls will appear.

**Why this priority**: Defining where log files come from is a prerequisite for any meaningful log exploration session.

**Independent Test**: Can be tested by triggering the command and confirming the "Log File Sources" panel opens with a stub UI.

**Acceptance Scenarios**:

1. **Given** the extension is active, **When** the user runs "Log Explorer: Edit Log File Source Config", **Then** an editor panel titled "Log File Sources" opens.
2. **Given** the panel is open, **When** the user inspects it, **Then** a stub UI placeholder is visible.

---

### User Story 4 - Configure Log Line Parsing Rules (Priority: P2)

A user invokes "Log Explorer: Edit File Log Line Config" from the Command Palette. An editor panel titled "Log File Lines" opens in the main editor area with a stub UI indicating where log-line parsing configuration controls will appear.

**Why this priority**: Defining how individual log lines are parsed is essential to making raw log files meaningful within a session.

**Independent Test**: Can be tested by triggering the command and confirming the "Log File Lines" panel opens with a stub UI.

**Acceptance Scenarios**:

1. **Given** the extension is active, **When** the user runs "Log Explorer: Edit File Log Line Config", **Then** an editor panel titled "Log File Lines" opens.
2. **Given** the panel is open, **When** the user inspects it, **Then** a stub UI placeholder is visible.

---

### User Story 5 - Edit Session Templates (Priority: P3)

A user invokes "Log Explorer: Edit Session Templates" from the Command Palette. An editor panel opens in the main editor area with a stub UI indicating where session template management controls will appear.

**Why this priority**: Session templates are a convenience feature enabling reuse of common session configurations; useful but not blocking initial usability.

**Independent Test**: Can be tested by triggering the command and confirming an editor panel for session template editing opens with a stub UI.

**Acceptance Scenarios**:

1. **Given** the extension is active, **When** the user runs "Log Explorer: Edit Session Templates", **Then** an editor panel opens for session template editing.
2. **Given** the panel is open, **When** the user inspects it, **Then** a stub UI placeholder is visible.

---

### User Story 6 - Log Details Side Panel (Priority: P3)

A user opens the Log Explorer sidebar. In addition to the session tools section, there is a left-side secondary panel area showing log details for the selected log entry. For now it shows a stub UI with placeholder content.

**Why this priority**: Displaying detail for a selected log entry enhances investigation workflows, but depends on session and search functionality existing first.

**Independent Test**: Can be tested by verifying the log details panel area is visible and shows a stub UI, independently of any working data flow.

**Acceptance Scenarios**:

1. **Given** the Log Explorer sidebar is open, **When** the user views the log details section, **Then** a stub UI is displayed in the left-side panel area.

---

### User Story 8 - Setup New Workspace (Priority: P2)

A user with a workspace folder open invokes "Log Explorer: Setup New Workspace" from the Command Palette. The extension creates a `.logex` folder at the workspace root and shows an info notification confirming success. After creation the command disappears from the Command Palette. If the workspace was already initialised the command is not visible at all.

**Why this priority**: Workspace initialisation is a prerequisite for any future local Log Explorer data storage; establishing the folder early avoids friction in later workflows.

**Independent Test**: Can be fully tested by opening a workspace without a `.logex` folder, running the command, and verifying the folder exists on disk and the command no longer appears in the palette.

**Acceptance Scenarios**:

1. **Given** a workspace folder is open and `.logex` does not exist, **When** the user runs "Log Explorer: Setup New Workspace", **Then** a `.logex` folder is created at the workspace root.
2. **Given** the folder was created successfully, **When** the user inspects the notification area, **Then** an info notification `"Log Explorer workspace initialised."` is shown.
3. **Given** the folder was created successfully, **When** the user opens the Command Palette, **Then** `"Log Explorer: Setup New Workspace"` is no longer listed.
4. **Given** `.logex` already exists in the workspace, **When** the user opens the Command Palette, **Then** `"Log Explorer: Setup New Workspace"` is not visible.
5. **Given** no workspace folder is open, **When** the user opens the Command Palette, **Then** `"Log Explorer: Setup New Workspace"` is not visible.
6. **Given** folder creation fails (e.g., permissions), **When** the command is invoked, **Then** an error notification `"Log Explorer: Failed to initialise workspace."` is shown and the command remains visible for retry.

---

### User Story 7 - Search Results Bottom Panel (Priority: P3)

A user opens the VS Code panel area (bottom). A "Search Results" panel option is available under Log Explorer. Opening it shows a stub UI indicating where search results from log queries within a session will appear.

**Why this priority**: Displaying search results is a secondary feature that depends on search functionality not yet built; stub establishes the surface for future work.

**Independent Test**: Can be tested by opening the bottom panel and verifying the Search Results tab is present and displays a stub UI.

**Acceptance Scenarios**:

1. **Given** the extension is active and the bottom panel is open, **When** the user navigates to the Log Explorer Search Results panel, **Then** a stub UI is displayed.

---

### Edge Cases

- What happens when a command panel is invoked while VS Code has no workspace folder open? The panel should still open normally since these are session/configuration editors, not file-system dependent.
- What happens when a user triggers a command that opens a panel already visible in a different editor group? The panel should be focused rather than duplicated.
- What happens when the extension fails to register one or more commands? Affected commands should not appear in the Command Palette and no crash should occur in the extension host.
- `Log Explorer: Setup New Workspace` MUST only appear in the Command Palette when at least one workspace folder is open (`workspaceFolderCount > 0`). The command is hidden — not merely disabled — when no workspace is open.
- `Log Explorer: Setup New Workspace` MUST be hidden from the Command Palette once `.logex` already exists in the workspace root. The extension sets a context key (`logexplorer.workspaceInitialized`) on activation and after successful folder creation; the command’s `when` clause gates on `!logexplorer.workspaceInitialized`.- If `.logex` folder creation fails, the `logexplorer.workspaceInitialized` context key remains `false` and the command stays visible so the user can retry.
## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST register the command `Log Explorer: New Session` in the Command Palette.
- **FR-002**: Invoking `Log Explorer: New Session` MUST open an editor panel in the main window area with the title "New Session" displaying a stub UI.
- **FR-003**: The extension MUST register the command `Log Explorer: Edit Log File Source Config` in the Command Palette.
- **FR-004**: Invoking `Log Explorer: Edit Log File Source Config` MUST open an editor panel titled "Log File Sources" displaying a stub UI.
- **FR-005**: The extension MUST register the command `Log Explorer: Edit File Log Line Config` in the Command Palette.
- **FR-006**: Invoking `Log Explorer: Edit File Log Line Config` MUST open an editor panel titled "Log File Lines" displaying a stub UI.
- **FR-007**: The extension MUST register the command `Log Explorer: Edit Session Templates` in the Command Palette.
- **FR-008**: Invoking `Log Explorer: Edit Session Templates` MUST open an editor panel titled "Session Templates", displaying a stub UI.
- **FR-009**: The extension MUST expose an icon in the VS Code Activity Bar (side rail) for the Log Explorer container.
- **FR-010**: Clicking the Activity Bar icon MUST open a sidebar View Container scoped to Log Explorer, showing a stub UI view with placeholder content for session tools.
- **FR-011**: A secondary panel in the left-side area MUST be available within the Log Explorer sidebar showing a stub UI for log detail display.
- **FR-012**: A bottom panel tab titled "Search Results" MUST be available within the Log Explorer panel group, showing a stub UI for log search results.
- **FR-013**: All stub UI panels MUST display visible placeholder content (e.g., a descriptive label) so users can confirm the panel is active.
- **FR-014**: Re-invoking a command for a panel that is already open MUST bring that panel into focus rather than opening a duplicate instance.
- **FR-015**: The extension MUST register the command `Log Explorer: Setup New Workspace` in the Command Palette.
- **FR-016**: The command `Log Explorer: Setup New Workspace` MUST only be visible in the Command Palette when `workspaceFolderCount > 0` AND the custom context key `logexplorer.workspaceInitialized` is `false` (implemented via a `when` clause: `workspaceFolderCount > 0 && !logexplorer.workspaceInitialized`).
- **FR-017**: Invoking `Log Explorer: Setup New Workspace` MUST create a folder named `.logex` at the root of the current workspace.
- **FR-018**: On extension activation, the extension MUST check whether `.logex` exists at the workspace root and set the context key `logexplorer.workspaceInitialized` to `true` if it does, or `false` if it does not.
- **FR-019**: After successfully creating `.logex`, the extension MUST set `logexplorer.workspaceInitialized` to `true` (hiding the command) and display a VS Code information notification with the message `"Log Explorer workspace initialised."`.
- **FR-020**: If `.logex` folder creation fails for any reason, the extension MUST display a VS Code error notification with the message `"Log Explorer: Failed to initialise workspace."` and MUST NOT expose internal error details or stack traces to the user. The `logexplorer.workspaceInitialized` context key MUST remain `false`.

### Key Entities

- **Session**: A named workspace context scoped to a particular log exploration effort; the top-level unit users create and configure.
- **Log File Source**: A reference to a log file or source of log data associated with a session; defines the origin of raw log content.
- **Log Line Config**: A set of rules defining how individual lines from a log file are parsed into structured fields.
- **Session Template**: A reusable configuration blueprint that can be applied when creating new sessions.

## Assumptions

- All editor panels (commands 1–4) are implemented as webview-based editor panels inside the main editor area, consistent with the existing `LogExplorerPanel` pattern in the codebase.
- "Stub UI" means a rendered panel with at minimum a heading/title label and a placeholder message — not a blank white page.
- The "left-side panel" for log details is a View in the Log Explorer Activity Bar sidebar container (not a separate editor column).
- The bottom "Search Results" panel is registered as a VS Code Panel View (bottom panel area).
- No data persistence or backend logic is required for any component in this feature — all panels are purely presentational stubs.
- The extension checks for `.logex` on every activation and sets a VS Code context key (`logexplorer.workspaceInitialized`) accordingly; this is the mechanism that hides the Setup command once the workspace is initialised.
- The command does NOT modify `.gitignore`; managing git tracking of `.logex` is the user's responsibility.
- All commands will be accessible via the Command Palette (`Ctrl+Shift+P`) upon extension activation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 commands (4 editor panels + Setup New Workspace) are discoverable and invokable via the Command Palette within 1 second of typing the command name. `Setup New Workspace` is only visible when a workspace is open and `.logex` does not yet exist.
- **SC-002**: Each invoked command opens its corresponding panel within 2 seconds with visible stub UI content.
- **SC-003**: The Log Explorer Activity Bar icon is visible immediately upon VS Code startup with the extension installed, requiring zero additional user configuration.
- **SC-004**: All 7 UI surfaces (4 editor panels, 1 sidebar section, 1 side panel, 1 bottom panel) are independently openable and display clearly labelled stub content.
- **SC-005**: Re-invoking any panel command when the panel is already open takes focus to the existing panel in under 1 second rather than creating a duplicate.
- **SC-006**: 100% of registered commands appear in the Command Palette when the extension is active, with no extension host errors on startup.
