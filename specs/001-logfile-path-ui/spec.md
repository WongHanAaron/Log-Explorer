# Feature Specification: Split‑view editor for Log File Path Configs

**Feature Branch**: `001-logfile-path-ui`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "I would like to implement a new feature where for the Log File Path config, the view is split into 2 columns:
The first column on the left has a search bar on the top and a listbox of all the configurations that are available through the config-store class. Whenever a new config has been added or removed, this list box's list of items should be updated to show the most recent list of items from the config-store for this config. 

The right column should contain the current editing panel with all the same options for performing edits as it does have right now. 

When a user clicks on an item config from the listbox, it should be loaded to the editing panel for updates. From this, the user is able to click on a config, make updates and save the updates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and select configurations (Priority: P1)

A user opens the Log File Path configuration panel and sees two columns.  On
the left is a search box and a scrolling list of all saved log‑path
configurations.  Typing in the search box filters the list in real time.  The
list is kept up to date when configs are added or removed elsewhere in the
system.

**Why this priority**: Without the ability to browse available configs the
utility of the editor is limited; customers need a quick way to choose which
file‑path definition they want to view or modify.

**Independent Test**: Populate the underlying `ConfigStore` with several
file‑path entries, open the panel and verify the list shows them.  Add a new
entry programmatically and confirm the list updates automatically.  Use the
search box to filter to a subset.

**Acceptance Scenarios**:

1. **Given** the panel is opened and three configs exist, **When** the panel
   loads, **Then** the left column displays all three names in a listbox beneath
the search field.
2. **Given** the search field contains "foo", **When** the user types "foo",
   **Then** only configurations whose name contains "foo" remain visible.
3. **Given** a new config is created by the ConfigStore API while the panel
   is open, **Then** the left list inserts the new name without requiring a
dialog reload.

---

### User Story 2 - Edit a selected configuration (Priority: P2)

Clicking an item in the left‑hand list loads that configuration into the
existing edit panel on the right.  The user may modify fields and save, which
writes back through the ConfigStore.

**Why this priority**: The core utility of the split view is editing an
existing config; browsing alone is not enough.

**Independent Test**: Select an entry from the list and assert that the right
panel’s fields are populated with the corresponding values.  Change a value
and click Save; verify the ConfigStore contains the updated data.

**Acceptance Scenarios**:

1. **Given** config "A" is selected, **When** the user clicks its name, **Then**
   the right editor shows "A"'s properties.
2. **Given** the user edits the path value and clicks Save, **Then** the
   config store entry for "A" is updated accordingly and the list remains
   selected on "A".

---

### User Story 3 - Add and remove configurations externally (Priority: P3)

Other parts of the extension may create or delete log‑path configs.  The left
list should reflect these changes immediately without manual refresh.

**Why this priority**: Configs are not exclusively created from this panel; the
list must remain accurate when they change elsewhere.

**Independent Test**: Use the ConfigStore API in a test to delete an entry while
the panel is open and ensure the list drops the name.  Add an entry and ensure
it appears.

**Acceptance Scenarios**:

1. **Given** config "B" is selected, **When** a service deletes "B", **Then**
   the configuration is removed from the list and the editor clears or chooses
   a different item.

---

### Edge Cases

- What happens if the ConfigStore returns an error when fetching the list?  The left
  pane should show an error message and allow retry.
- How does the panel behave when there are zero configs?  Show a friendly
  empty‑state message prompting the user to create one.
- What if the user clicks a config while it is being deleted concurrently?
  The editor should handle the missing data gracefully.
- Search input should be debounced to avoid expensive list updates on every
  keystroke (optional improvement).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The configuration panel MUST be split into two resizable
  columns: left for the searchable list, right for the edit form.  This
  applies only to the Log File Path editor.
- **FR-002**: The left column MUST contain a text search box above a listbox of
  configuration names retrieved from `ConfigStore.listConfigNames(ConfigCategory.Filepath)`.
- **FR-003**: Typing in the search box MUST filter the list in real time by
  name (case‑insensitive substring match).
- **FR-004**: When the panel opens it MUST fetch the current list of
  configurations and populate the listbox.  An empty list triggers an
  "empty state" message.
- **FR-005**: The panel MUST listen for changes from `ConfigStore` (e.g.
  via an event or polling mechanism) and refresh the list automatically when
  entries are added or removed.
- **FR-006**: Selecting a name in the listbox MUST load that configuration
  into the right‑hand edit form, replacing any previously loaded config.
- **FR-007**: The edit form on the right MUST retain all existing fields and
  save behaviour; saving writes changes back through `ConfigStore.update()`
  or similar.
- **FR-008**: If the currently loaded configuration is deleted externally,
  the form MUST either clear or switch to another available config, and the
  deleted name MUST be removed from the list.
- **FR-009**: The panel MUST be usable with keyboard only: focusable search
  box, navigable list via arrow keys, and the editor fields reachable via
  tab order.
- **FR-010**: The new UI MUST degrade gracefully on small width panels (e.g.
  collapse into a single column or make list movable) [NEEDS CLARIFICATION?
  may be addressed later].

### Key Entities *(include if feature involves data)*

- **LogFilePathConfig**: existing domain object representing a file path
  configuration; attributes include `name`, `path`, `filters`, etc.
- **ConfigStore**: service providing `listConfigNames`, `getConfig`,
  `updateConfig`, `deleteConfig`, and emitting change events.
- **SearchState**: temporary UI state capturing the current search text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing Log File Path configs appear in the left list
  within 1 second of opening the panel or after a store update.
- **SC-002**: Users can locate a desired config using the search box in under
  10 seconds for lists up to 100 entries (measured in usability test).
- **SC-003**: Configuration updates (save/delete) persist to the store and are
  reflected in the UI on the next load 100% of the time in automated tests.
- **SC-004**: When a configuration is added or removed by another component,
  95% of panel instances update their list within 2 seconds.
- **SC-005**: Keyboard-only navigation allows selecting and editing a config
  with no more than three key presses per column 95% of the time in accessibility tests.


## Clarifications

- Q: Update the config-store to log whenever a change in the config is
  detected → A: Treat as a formal requirement.  The store must log
  change events to the output channel using `OutputLogger` with name and
  action details.

---

✏️ The spec now clearly describes what to build and how to verify it.  One
clarification has been added (see above).  The branch `001-logfile-path-ui` is
ready for planning (`/speckit.plan`) when you're ready to break this down into
implementation tasks.  Let me know if you'd like help with that next!
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

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

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
