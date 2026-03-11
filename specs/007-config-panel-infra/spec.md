# Feature Specification: Shareable two‑column config editor infrastructure

**Feature Branch**: `007-config-panel-infra`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Implement a shareable infrastructure for the 2 column config list and editing panel that can be re-used for many different config editing use cases."

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

### User Story 1 - Configure any settings type (Priority: P1)

A developer working on the extension needs to add a new configuration editor
(for example, log file paths, alert rules, or export formats).  They open a
pre-existing panel class, specify the config category and schema, and the
framework provides the two‑column list/search UI on the left and a wired
editing form on the right.  The panel automatically listens for store updates
and refreshes the list.

**Why this priority**: Reusability is the primary goal; once the infrastructure
exists, all other config editors can be built with minimal boilerplate.

**Independent Test**: Use the generic panel class with a dummy config category
in a test workspace.  Verify that the left list renders names, search filters,
and clicking a name loads the form without additional wiring.

**Acceptance Scenarios**:

1. **Given** the generic panel is instantiated with a category `foo`, **When**
   the underlying store contains three entries `a`, `b`, `c`, **Then** the left
   list shows `a`, `b`, `c` and typing `b` filters to that item.
2. **Given** an external process adds a new config `d`, **When** the file is
   created in the store, **Then** the panel list inserts `d` automatically.

---

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - Persist edits through shared API (Priority: P2)

After selecting an item from the list, the developer can modify its fields in
the right‑hand form.  The framework handles saving via the common
`ConfigStore` API; the host panel need only implement a schema-specific
renderer and validators if required.

**Why this priority**: No reuse value is gained unless editing and persistence
also work uniformly across config types.

**Independent Test**: In a unit test, send `configData` messages to the webview
and verify that form changes result in `updateConfig` messages posted.

**Acceptance Scenarios**:

1. **Given** config `x` is selected, **When** the user edits a field and clicks
   Save, **Then** the panel posts an `updateConfig` message to the host with the
   modified object.
2. **Given** the user has modified the currently loaded configuration but not
   saved those changes, **When** they click a different name in the left list,
   **Then** the panel displays a confirmation dialog warning that unsaved
   changes will be lost and only navigates to the new config if the user
   confirms.

---

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - Support multiple panels concurrently (Priority: P3)

Extension code may open more than one instance of the generic panel
(simultaneously editing different categories or workspaces).  Each instance
must maintain independent state and correctly receive store events for its own
category.

**Why this priority**: Future use cases might require side‑by‑side editors.

**Independent Test**: Instantiate two panels in integration harness with
different mock categories and verify that updates to one do not affect the
other.

**Acceptance Scenarios**:

1. **Given** two open panels for categories `foo` and `bar`, **When** a new
   `foo` config is added, **Then** only the `foo` panel list updates.

---

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- If the store fails to list names (e.g. filesystem error), the left pane
  shows an error banner and provides a retry button.
- When the currently selected configuration is deleted externally, the form
  clears and an informational message is shown.
- Very large name lists (hundreds or thousands) should be filterable without
  freezing the UI; the component should virtualize or debounce as needed.
- If the schema for the right‑hand editor changes while the user is editing,
  decide whether to preserve existing values or discard them.  (Implementation
  may simply reload the new schema and reset the form.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The framework MUST provide a generic panel class or helper that
  encapsulates the two‑column layout and message protocol described below.
- **FR-002**: The left column MUST display a searchable, scrollable list of
  configuration names provided by a `ConfigStore` category; filtering must be
  case‑insensitive and update within 200 ms of typing.
- **FR-003**: Panels MUST subscribe to changes from `ConfigStore.onDidChange`
  and refresh their name lists when entries are added or removed.
- **FR-004**: Selecting a name MUST send a `selectConfig` message to the host.
- **FR-005**: The host MUST be able to respond with `configData` containing a
  plain object; the webview MUST render it in the right‑hand form.
- **FR-006**: Saving edits MUST post `updateConfig` (or `createConfig` for new
  items) messages; the host handles persistence.
- **FR-007**: If the user selects a different configuration name while the
  current form contains unsaved changes, the webview MUST prompt for
  confirmation before switching; the warning should make clear that
  unsaved work will be discarded.
- **FR-008**: The infrastructure MUST support multiple independent panel
  instances simultaneously without cross‑pollution of data.
- **FR-009**: The UI components provided by the framework MUST be sufficiently
  abstract to allow custom form content on the right (via child components or
  render props).
- **FR-010**: The infrastructure MUST expose convenience helpers for
  registering the panel and wiring the message handlers in host code.
- **FR-011**: Accessibility requirements from the earlier feature (keyboard
  navigation, focus order) apply to all panels built on this infrastructure.

### Key Entities

- **ConfigCategory**: string identifier for a group of configurations (e.g.
  `filepath`, `alert-rule`) used by `ConfigStore` to partition data.
- **ConfigStore**: existing service that lists, reads, writes, and deletes
  configuration objects on disk and emits change events.
- **PanelOptions**: a new type defined by the infrastructure containing the
  category name, optional initial selection, and callbacks for message handling.
- **SharedMessages**: the common message protocol (`init`, `configListChanged`,
  `selectConfig`, `configData`, `updateConfig`, `createConfig`, `deleteConfig`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can create a new config editor panel by writing no
  more than 50 lines of boilerplate and without modifying the core
  infrastructure code in at least three independent repo locations.
- **SC-002**: 100% of panels built with the infrastructure automatically
  receive external add/delete events within 2 seconds (verified by automated
  tests).
- **SC-003**: Search filtering performance holds under lists of 1,000 entries,
  with visible update lag <200 ms measured in a UI benchmark.
- **SC-004**: At least two panel instances can remain open concurrently without
  interfering with each other in 100% of automated cross-panel tests.
- **SC-005**: Keyboard‑only operation (tab, arrow, enter) enables full use of
  the list and form with no more than three key presses per column in 95% of
  accessibility test runs.


## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
