# Feature Specification: Config Store Abstraction

**Feature Branch**: `001-config-store-abstraction`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "can you create domain models for the FilepathConfig, FileLogLineConfig. Create a config-store abstraction that contains methods for querying for the existing config names for each of those categories: FilepathConfig, FileLogLineConfig. There should be a method for: - accessing the unique names for the available configs - accessing the data object for a specific unique name for a config - subscribing to when a new config has been added for a category - unsubscribing to when a config has been added"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List Available Config Names (Priority: P1)

A developer building a UI dropdown or selection list needs to retrieve all the unique short names of configs available for a given category (FilepathConfig or FileLogLineConfig). Without this capability, UI components must implement their own directory scanning logic, leading to duplication and inconsistency.

**Why this priority**: This is the most fundamental query operation. All other operations — such as fetching by name or reacting to additions — are meaningless without first being able to discover what configs exist. Implemented alone, it unblocks building populated dropdowns and selection lists immediately.

**Independent Test**: Can be tested by writing one or more configs for a category to the workspace storage area, calling the list-names operation, and confirming the returned collection matches the written names. Delivers value as a standalone read-only directory introspection capability.

**Acceptance Scenarios**:

1. **Given** a category directory that contains three saved configs, **When** the list-names operation is called for that category, **Then** a collection of exactly three unique short names is returned.
2. **Given** a category directory that has never been written to, **When** the list-names operation is called, **Then** an empty collection is returned without error.
3. **Given** a category directory that contains files of mixed types (e.g., config files and non-config files), **When** the list-names operation is called, **Then** only valid config entries are included in the result.
4. **Given** configs exist in one category, **When** the list-names operation is called for a different category, **Then** only configs belonging to the requested category are returned.

---

### User Story 2 - Retrieve Config Data by Name (Priority: P2)

A developer needs to retrieve the complete data object for a specific config, identified by its unique short name within a category (FilepathConfig or FileLogLineConfig). This enables downstream components to read the full config payload — e.g., path pattern, field extraction rules — when applying a config to a session or displaying its details.

**Why this priority**: Listing names alone is insufficient for most workflows; callers also need the underlying data. However, this is secondary to discovery — a user can see available options before needing the full details of any one.

**Independent Test**: Can be tested by writing a complete FilepathConfig or FileLogLineConfig to storage, calling the fetch-by-name operation with that name and category, and verifying the returned object matches the written data exactly.

**Acceptance Scenarios**:

1. **Given** a FilepathConfig named `"app-logs"` exists, **When** the fetch-by-name operation is called for category FilepathConfig with name `"app-logs"`, **Then** the complete FilepathConfig data object is returned.
2. **Given** a FileLogLineConfig named `"json-format"` exists, **When** the fetch-by-name operation is called for category FileLogLineConfig with name `"json-format"`, **Then** the complete FileLogLineConfig data object is returned.
3. **Given** no config named `"missing"` exists in the FilepathConfig category, **When** the fetch-by-name operation is called, **Then** an absent-value indicator or error is returned, clearly distinguishable from a successful empty result.
4. **Given** a config file exists but its stored contents are malformed, **When** the fetch-by-name operation is called, **Then** a clear validation error is returned describing the failure.

---

### User Story 3 - Subscribe to Config-Added Events (Priority: P3)

A developer building a UI component that displays the available set of configs needs to be notified automatically when a new config is added to a category, without reloading the entire list manually. This enables reactive UI updates so that newly saved configs appear in dropdowns or tables without requiring the user to navigate away and back.

**Why this priority**: Subscription and notification are enhancements over polling. P1+P2 provide the core data access; subscriptions add reactivity. Without subscription support, callers must poll or refresh manually, which is functional but suboptimal for a smooth user experience.

**Independent Test**: Can be tested by registering a subscription for a category, then writing a new config to that category's storage, and confirming that the registered callback is invoked with information about the newly added config.

**Acceptance Scenarios**:

1. **Given** a subscriber is registered for the FilepathConfig category, **When** a new FilepathConfig is saved, **Then** the subscriber callback is invoked with the short name (or full object) of the newly added config.
2. **Given** a subscriber is registered for the FileLogLineConfig category, **When** a new FileLogLineConfig is saved, **Then** the subscriber callback is invoked for the FileLogLineConfig category only — not for FilepathConfig.
3. **Given** two subscribers are registered for the same category, **When** a new config is added, **Then** both subscribers receive the notification.
4. **Given** a config is overwritten rather than newly created, **When** the write completes, **Then** the subscription behavior (notify or not notify) is clearly documented and consistently applied.

---

### User Story 4 - Unsubscribe from Config-Added Events (Priority: P4)

A developer needs to cancel a previously registered subscription when the subscribing component is disposed — e.g., a webview panel is closed — to prevent memory leaks and callbacks from being invoked on stale or destroyed component instances.

**Why this priority**: Unsubscription is a correctness and resource-management concern that has no standalone value without P3 being implemented first. It is nonetheless essential to production-quality code.

**Independent Test**: Can be tested by registering a subscriber, unsubscribing it, then writing a new config, and confirming the callback is not invoked after the unsubscription.

**Acceptance Scenarios**:

1. **Given** a subscriber was registered and then unsubscribed, **When** a new config is added to that category, **Then** the unsubscribed callback is NOT invoked.
2. **Given** two subscribers are registered and one is unsubscribed, **When** a new config is added, **Then** only the still-active subscriber receives the notification.
3. **Given** an unsubscribe call is made for a handle that was already unsubscribed, **When** the call is made, **Then** no error is thrown (idempotent unsubscription).

---

### Edge Cases

- What happens when the workspace storage area is inaccessible (e.g., no open workspace folder)?
- What happens if two configs with the same short name are written concurrently?
- How does the system behave if a config file is deleted externally while a subscription is active?
- What happens when the same callback function is registered as a subscriber twice for the same category?
- How are short names that violate the kebab-case convention handled by the store?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The config store MUST expose an operation to retrieve all unique short names for a given config category (FilepathConfig or FileLogLineConfig).
- **FR-002**: The config store MUST expose an operation to retrieve the complete data object for a config identified by its category and unique short name.
- **FR-003**: The config store MUST expose an operation to subscribe to new-config-added events for a specific category; the subscription MUST invoke the provided callback whenever a new config is saved to that category.
- **FR-004**: The config store MUST expose an operation to unsubscribe a previously registered callback; after unsubscription, the callback MUST NOT be invoked for subsequent add events.
- **FR-005**: The config store MUST treat FilepathConfig and FileLogLineConfig as distinct, isolated categories; queries and subscriptions for one category MUST NOT return or trigger results from the other.
- **FR-006**: The list-names operation MUST return an empty result (not an error) when no configs exist for the requested category.
- **FR-007**: The fetch-by-name operation MUST return a clear absent-value indicator or structured error when the requested short name does not exist in the category.
- **FR-008**: Unsubscription MUST be idempotent: calling it more than once with the same subscription handle MUST NOT throw or produce observable side effects.
- **FR-009**: The FilepathConfig domain model MUST capture: a unique short name (kebab-case identifier), a human-readable label, a path pattern (glob or absolute/relative path), and an optional description.
- **FR-010**: The FileLogLineConfig domain model MUST capture: a unique short name, a human-readable label, an optional description, a line format type (text, XML, or JSON), and the field extraction rules appropriate for that format type.
- **FR-011**: Field extraction rules for text-format line configs MUST support both prefix/suffix boundary matching and regular-expression named-capture-group matching as alternative strategies.
- **FR-012**: Field definitions in any format type MUST support an optional datetime format descriptor (token-based format string or auto-detection flag) to enable timestamp parsing for date/time fields.

### Key Entities

- **FilepathConfig**: Represents a saved pattern that locates log files on disk. Key attributes: unique short name (kebab-case), human-readable label, path pattern (glob or path string), optional description. A single FilepathConfig can match zero or more physical files depending on the pattern.
- **FileLogLineConfig**: Represents a saved ruleset for parsing individual lines of a log file into structured fields. Key attributes: unique short name, human-readable label, optional description, format type (text / XML / JSON), and an ordered list of field definitions. Each field definition maps a named output field to an extraction rule.
- **FieldExtraction**: A descriptor attached to a field definition that specifies how to isolate the field's value within a raw log line. Two variants: prefix/suffix boundary markers, and regular-expression named capture groups.
- **DateTimeFormat**: An optional descriptor attached to a field definition specifying how to parse the extracted string value as a date/time. Supports an explicit token-based format string (e.g., `yyyy-MM-dd HH:mm:ss`) or an automatic-detection flag.
- **ConfigCategory**: An enumeration of the two first-class config kinds — FilepathConfig and FileLogLineConfig — used to scope list-names, fetch-by-name, and subscription operations.
- **ConfigSubscription**: A handle returned when a new-config-added subscriber is registered. The handle is passed back to the unsubscribe operation to cancel the subscription.

## Assumptions

- The authoritative storage location for configs is the `.logex/` hidden directory within the open VS Code workspace folder. Configs are persisted as individual JSON files, one per config, using the short name as the filename stem.
- Short names follow a kebab-case convention (`[a-z0-9]+(-[a-z0-9]+)*`). The config store may reject saves for names that violate this convention but is not required to enforce this at the abstraction layer.
- The extension operates within a single VS Code workspace at a time; multi-root workspace support is out of scope for this feature.
- Subscriptions are in-process only and are not persisted across extension host restarts. Subscribers must re-register after the extension host restarts.
- Whether overwriting an existing config triggers new-config-added subscribers is an implementation decision; the spec requires only that the chosen behavior be consistent and tested.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four operations (list names, fetch by name, subscribe, unsubscribe) are available and exercised in automated tests, with 100% of defined acceptance scenarios passing.
- **SC-002**: Calling list-names immediately after adding a new config returns a collection that includes the newly added config, with no observable delay attributable to the store layer.
- **SC-003**: A subscriber registered before a config is added receives exactly one notification per new config addition — no duplicate events, no missed events — as confirmed by automated tests.
- **SC-004**: After unsubscribing, zero invocations of the removed callback are recorded for any subsequent config additions, as confirmed by automated tests.
- **SC-005**: FilepathConfig and FileLogLineConfig category isolation is verified by an automated test that adds configs to both categories and confirms that each query and subscription returns only its own category's data.
- **SC-006**: All existing consumers of the low-level config I/O functions continue to operate correctly after the abstraction layer is introduced, with no regressions in the existing test suite.
