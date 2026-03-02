# Feature Specification: New Session Panel

**Feature Branch**: `001-new-session-panel`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "New session panel requirements from diagram (us1-new-session.excalidraw)"

## Overview

The New Session panel is the primary entry point for starting a log analysis session. It is a full-width webview editor panel split into two areas:

- **Left — Discovery panel**: four quadrant boxes that help the user find and choose what to base their session on (templates, recent sessions, local logs, and getting-started guidance).
- **Right — Creation form**: a structured form that is populated once the user selects a template or starts from scratch, culminating in a "Create Session" action.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Session from a Template (Priority: P1)

A user opens the New Session panel, browses the list of templates loaded from `.logex/session-templates/`, selects one, fills in the required fields (session name, description, template parameters, time start, sources), and creates the session.

**Why this priority**: This is the primary workflow the entire panel was designed for. Delivering it alone constitutes a fully functional MVP.

**Independent Test**: Open the panel in a workspace that has at least one template in `.logex/session-templates/`. Select a template, fill all fields, click "Create Session". Verify the session folder and `session.json` appear in the expected location.

**Acceptance Scenarios**:

1. **Given** the panel is open and at least one template exists in `.logex/session-templates/`, **When** the user clicks a template in the top-left list, **Then** the right-side form populates with the template's name, description, parameter fields, and pre-configured sources.
2. **Given** the form is populated, **When** the user enters a session name and clicks "Create Session", **Then** a new session folder is created in the workspace with a `session.json` file containing the submitted metadata.
3. **Given** the template list contains many templates, **When** the user types in the search box above the template list, **Then** the list filters in real time to show only matching templates.
4. **Given** the user has selected a template and partially filled the form, **When** they clear the session name field and click "Create Session", **Then** the action is blocked and the session name field is highlighted as required.

---

### User Story 2 — Resume a Recent Session (Priority: P2)

A user opens the New Session panel and sees their previously created sessions listed in the bottom-left "Recent Sessions" box, sourced by scanning session folders in the workspace. They click one to open it.

**Why this priority**: Resuming work is as important as starting new sessions, but requires the create-session flow to exist first.

**Independent Test**: Open the panel in a workspace containing one or more session folders with `session.json` files. Verify those sessions appear in the Recent Sessions list.

**Acceptance Scenarios**:

1. **Given** the workspace contains session folders with `session.json` files, **When** the panel opens, **Then** each session is listed in the Recent Sessions box showing its name and description from `session.json`.
2. **Given** a recent session is listed, **When** the user clicks it, **Then** the session is opened (its details are loaded into the form or a dedicated session view).
3. **Given** no session folders exist in the workspace, **When** the panel opens, **Then** the Recent Sessions box shows an empty state message such as "No recent sessions."

---

### User Story 3 — Browse Templates Without Selecting (Priority: P2)

A user hovers over or previews a template without fully selecting it, to see its description and understand what it configures before committing.

**Why this priority**: Discoverability is important when a workspace has many templates.

**Independent Test**: Open the panel with multiple templates present. Click a template. Verify name and description appear in the right panel header without triggering session creation.

**Acceptance Scenarios**:

1. **Given** multiple templates exist, **When** the user clicks a template entry in the list, **Then** the right panel header updates to show the template name and description.
2. **Given** no template is selected, **When** the panel first opens, **Then** the right panel form is in a blank/unselected state with all fields empty.

---

### User Story 4 — Create a Session with No Template (Priority: P3)

A user opens the New Session panel in a workspace where no templates exist yet. They are still able to create a session by filling in all fields manually without selecting a template.

**Why this priority**: The panel must be usable in a fresh workspace before any templates have been created.

**Independent Test**: Open the panel in a workspace with no templates. Confirm the panel does not break. Fill in session name, time start, and at least one source entry manually. Click "Create Session" and confirm it succeeds.

**Acceptance Scenarios**:

1. **Given** no templates exist, **When** the panel opens, **Then** the template list shows an empty-state message such as "No templates found" and the right panel is editable with all fields blank.
2. **Given** the template list is empty, **When** the user fills in session name, time start, and a source row manually, **Then** they can click "Create Session" and a session is created successfully.

---

### Edge Cases

- What happens when `.logex/session-templates/` folder does not exist? The template list shows an empty state — no error or crash.
- What happens if a template folder is malformed (missing required metadata)? The template is skipped or shown with a warning indicator; it does not prevent other templates from loading.
- What happens if a session folder in the workspace contains no `session.json`? That folder is ignored in the Recent Sessions list.
- What if the user types a session name that would produce a duplicate folder name in the target location? The user is warned before creation; the session is not created until a unique name is provided.
- What if "Create Session" is clicked while the Sources section is completely empty? Sources are **optional** at creation time — a session can be created with no sources and they can be added later.

---

## Requirements *(mandatory)*

### Functional Requirements

**Discovery Panel (left side)**

- **FR-001**: The panel MUST display a "New Session Templates" section (top-left quadrant) listing all templates found in `.logex/session-templates/`. Each entry MUST show the template name and its description.
- **FR-002**: The templates list MUST include a search/filter input that narrows displayed templates in real time by matching against template name or description.
- **FR-003**: The panel MUST display a "Recent Sessions" section (bottom-left quadrant) listing sessions discovered in the workspace. A session is recognised by a folder containing a `session.json` file. Each entry MUST show the session name and description as stored in `session.json`.
- **FR-004**: The "Local Logs" section (bottom-right quadrant) MUST be rendered as an empty stub placeholder for future use.
- **FR-005**: The "Getting Started" section (top-right quadrant) MUST be rendered as an empty stub placeholder for future use.
- **FR-006**: When no templates are found, the New Session Templates section MUST display a non-error empty-state message.
- **FR-007**: When no recent sessions are found, the Recent Sessions section MUST display a non-error empty-state message.

**Creation Form (right side)**

- **FR-008**: When the user selects a template, the right panel MUST display the selected template's name and description as a header.
- **FR-009**: The form MUST contain a required "Session Name" text field.
- **FR-010**: The form MUST contain an optional "Description" text field.
- **FR-011**: The form MUST dynamically render one labelled input field per parameter defined in the selected template, using the parameter name as the label. When no template is selected, no parameter fields are shown.
- **FR-012**: The form MUST contain a "Time Start" field for entering a date and time value.
- **FR-013**: The form MUST contain a "Sources" section displaying a list of `SourceLogConfigReference` entries. Each entry references a named source config and log config pair by `type` (`file` or `kibana`), `sourceConfig` name, and `logConfig` name.
- **FR-014**: The user MUST be able to add and remove individual source entries in the Sources section.
- **FR-015**: The form MUST include a "Create Session" button. Clicking it MUST validate that Session Name is non-empty before proceeding; if validation fails the field MUST be highlighted.
- **FR-016**: On successful session creation, the system MUST create a new folder named with the kebab-case version of the session name and write a `session.json` file inside it containing: name, description, template reference (or null), parameter values (key-value), time start, and sources list.
- **FR-017**: After successful session creation, the new session MUST appear in the Recent Sessions list without requiring a manual panel refresh.
- **FR-018**: Session folders MUST be created inside `.logex/sessions/` within the workspace root. The system MUST create the `.logex/sessions/` directory if it does not yet exist.

**Template Format**

- **FR-019**: A session template MUST be a file or folder under `.logex/session-templates/` that defines: name, description, an ordered list of parameters (each with a `name`), and a default list of source entries (machine, location, filename format, line format).
- **FR-020**: The panel MUST re-read templates from disk each time the panel is opened, so that newly created templates appear without restarting the extension.

### Key Entities

- **SessionTemplate**: A reusable configuration stored under `.logex/session-templates/`. Attributes: `name` (string), `description` (string), `parameters` (ordered list of `{ name: string }`), `sources` (list of SourceEntry).
- **Session**: A workspace artefact represented as a named folder. Contains a `session.json` with: `name`, `description`, `templateName` (nullable string), `parameters` (key-value map of string to string), `timeStart` (date-time string), `sources` (list of SourceEntry).
- **SourceLogConfigReference**: A reference to a named source/log config pair. Discriminated by `type: 'file'` (referencing `FileSourceConfig` + `FileLogConfig`) or `type: 'kibana'` (referencing `KibanaSourceConfig` + `KibanaLogConfig`). Stored as `{ type, sourceConfig: string, logConfig: string }`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the New Session panel, select a template, fill required fields, and click "Create Session" in under 60 seconds on first use.
- **SC-002**: The template list populates within 500 ms of the panel opening, even when `.logex/session-templates/` contains 50 or more templates.
- **SC-003**: Every session folder with a valid `session.json` present in the workspace at panel-open time is listed in Recent Sessions — no sessions are missed.
- **SC-004**: The `session.json` produced by session creation accurately reflects all values the user entered in the form, as verified by reading the file back.
- **SC-005**: The panel handles all defined edge cases (missing template folder, malformed templates, empty workspace, no sources) without displaying an unhandled error or crashing — only informative empty states or inline validation messages.

---

## Assumptions

- Template files are stored as individual JSON files directly under `.logex/session-templates/` (e.g., `my-template.json`). The exact schema is defined during planning.
- Template parameters are simple named string fields; complex types (dropdowns, booleans, numbers) are out of scope for this feature.
- "Time Start" is stored as an ISO 8601 string; the UI presents a standard date-time input control.
- Session folder names are derived from the session name by converting to lowercase, replacing spaces with hyphens, and stripping non-alphanumeric characters.
- The "Getting Started" and "Local Logs" quadrants are deliberately out of scope for this feature and will remain as stubs.
