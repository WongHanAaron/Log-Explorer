# Feature Specification: Shareable Tag Component

**Feature Branch**: `001-tag-component`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "I would like to implement a new shareable 'tag' component. 

The tag component should be used in place of the existing 'log-file-sources' 'Labels' text box. This is how I want the UI to work: 
- all tags should be shown as a 'pill' button that is colored with the primary color with the tag name in the button text
- when the tag is clicked, the button text will become an editable field that allows the user to rename the tag
- There should be a component called the Tag Set Component where it would contain a set of tags. The tags contained in this component should flow left to right and overflow to the next row.
- At the end of the existing tags, there should be a 'add' button that would allow the user to add new tags. "

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

### User Story 1 - Manage Tags in Log File Source (Priority: P1)

A user is editing a log-file-source configuration and needs to attach descriptive tags. They can add, rename, or remove tags using a familiar pill-based UI.

**Why this priority**: Tags are essential metadata for log sources; replacing the plain textbox with a component improves usability and consistency across the app.

**Independent Test**: Open any log-file-source editor and interact with the tag set control; verify adding, renaming, and removing tags works and the underlying configuration value updates accordingly.

**Acceptance Scenarios**:

1. **Given** an empty tag set, **When** the user clicks the add button and enters "webserver", **Then** a new pill labeled "webserver" appears and the config value includes that tag.
2. **Given** a tag pill "db", **When** the user clicks it, edits the text to "database" and blurs the field, **Then** the pill updates and the config value reflects the new name.
3. **Given** multiple tags that overflow the row width, **When** the window narrows, **Then** tags wrap to the next line gracefully.
4. **Given** a tag pill, **When** the user presses backspace on an empty rename field or clicks a remove icon, **Then** the pill is removed and the config updates.

---

### User Story 2 - Reuse Tag Component Elsewhere (Priority: P2)

A developer adds the tag component to another panel (e.g., session templates) and can supply an array of strings and callback props without copy/pasting UI logic.

**Why this priority**: Establishing the component as reusable prevents duplicated code and ensures a unified look-and-feel across features.

**Independent Test**: Render the Tag Set Component in a simple sandbox panel and verify it behaves identically to the log-file-sources usage.

**Acceptance Scenarios**:

1. **Given** arbitrary initial tags passed as props, **When** the component mounts, **Then** the pills reflect those tags.

---

### User Story 3 - Keyboard Accessibility (Priority: P3)

Users should be able to navigate, add, and rename tags using keyboard only (tab/enter/escape).

**Why this priority**: Accessibility improves usefulness for power users and those who cannot rely on a mouse.

**Independent Test**: Focus the tag component, use keyboard shortcuts to add a tag and rename an existing one.

**Acceptance Scenarios**:

1. **Given** focus on the add button, **When** the user presses Enter,
   **Then** an input appears ready for typing a new tag.

---


### Edge Cases

- If a user tries to create a tag with only whitespace, it should be ignored or trimmed.
- Duplicate tag names are merged in a case‑insensitive manner; the most recently edited casing is preserved.
- Very long tag names should either ellipsize or wrap within the pill without breaking layout.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Provide a `Tag` React component that renders a single pill with editable text.
- **FR-002**: Provide a `TagSet` React component that accepts an array of string tags, callbacks for add/rename/remove, and displays them in a wrapping horizontal layout.
- **FR-003**: Tags should be styled using the primary color and should adapt to light/dark themes via shared CSS variables.
- **FR-004**: When a tag is clicked, it transforms into a focused text input pre-populated with the tag name; blurring or pressing Enter saves the change.
- **FR-005**: Clicking the add button at the end adds a new empty tag and immediately enters edit mode.
- **FR-006**: The `TagSet` component should expose properties for validation (e.g. duplicate detection, max length) with reasonable defaults.
- **FR-007**: Log-file-sources panel MUST replace its existing plain `Labels` textbox with the new `TagSet` component.
- **FR-008**: The tag list from log-file-sources config must serialize as an array of strings saved alongside other config data.

*Example of marking unclear requirements:*

- **FR-009**: Duplicate tag behavior should merge duplicates case‑insensitively; when a new or renamed tag matches an existing tag regardless of case, the existing tag remains but its casing is updated to the most recent value.
- **FR-010**: Maximum number of tags allowed is configurable; no default limit is enforced.

### Key Entities *(include if feature involves data)*

- **Tag**: simple string representing a label applied to a configuration object.
- **TagSet**: collection of `Tag` values stored as part of a log-file-source configuration.

## Assumptions

- Tags are unique per configuration and case-insensitive.
- The styling system (Tailwind + CSS variables) supports a "primary" color used by pills.
- No backend changes are needed; tags serialize as existing array field.
- There is no enforced maximum tag count unless clarified.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of log-file-source configurations that had labels previously are migrated to use tags without loss of information.
- **SC-002**: Adding, renaming, or removing a tag takes less than 1 second and does not require manual form refresh.
- **SC-003**: >90% of users report the new tag UI is easier to use than the textbox (survey or anecdotal feedback).
- **SC-004**: Tag component is reused in at least one additional panel within the first release.

