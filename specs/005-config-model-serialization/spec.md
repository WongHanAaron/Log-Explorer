# Feature Specification: Config model serialization

**Feature Branch**: `005-config-model-serialization`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "Update all domain models in this project related to the configs that can be serialized and deserialized to use the typestack examples as follows here for serialization and validation:

import { Expose, plainToClass } from 'class-transformer';
import { IsString, IsInt, validateOrReject } from 'class-validator';

class User {
  @Expose()               // needed by class‑transformer
  @IsString()             // validator decorator
  name!: string;

  @Expose()
  @IsInt()
  age!: number;
}

const json = JSON.parse('{\"name\":\"Lee\",\"age\":28}');

const user = plainToClass(User, json);      // -> User instance
await validateOrReject(user);              // throws if invalid

Each configurable domain object should inherit from a base 'IsSerializable' class that has a ToJson and FromJson. ToJson outputs a json string . FromJson takes in a Json string and loads the object. When loading the object, use the type checks for schema above to ensure that the object matches the required schema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Serialize/deserialize config model (Priority: P1)

A developer working on configuration handling needs to convert a plain JSON string into the corresponding domain object and back again while ensuring the data is valid.  The system should automatically instantiate the correct class, validate field types and required values, and throw a descriptive error when the input is invalid.

**Why this priority**: Ensures that configuration objects are always in a known-good state when loaded or saved, preventing runtime errors and simplifying code that consumes them.

**Independent Test**: Write a unit test that supplies a JSON string for an existing config type, calls `FromJson`, checks the returned instance type and property values, then calls `ToJson` and verifies the output matches the original string (modulo formatting). Invalid JSON should cause `FromJson` to throw an error with validation details.

**Acceptance Scenarios**:

1. **Given** a valid JSON string for a known config class, **When** `FromJson` is called, **Then** the returned object is an instance of that class and all fields have the correct types.
2. **Given** an invalid JSON string missing a required field or with the wrong type, **When** `FromJson` is called, **Then** the method rejects with a validation error and does not return an instance.
3. **Given** a properly constructed config instance, **When** `ToJson` is invoked, **Then** the output is a JSON string representing the same data that passes round‑trip through `FromJson`.

---

### User Story 2 - Base class enforcement (Priority: P2)

A new configuration domain object added in the future should automatically gain serialization and validation behaviour by extending a shared `IsSerializable` base class, reducing boilerplate.

**Why this priority**: Encourages consistency across the codebase and saves developer time when creating new config types.

**Independent Test**: Create a simple subclass of `IsSerializable` with a couple of properties and confirm that `ToJson`/`FromJson` work without additional wiring.

**Acceptance Scenarios**:

1. **Given** a class extending `IsSerializable` with decorated fields, **When** an instance is created and `ToJson`/`FromJson` are used, **Then** serialization works and validation is applied automatically.

---

### User Story 3 - Existing config migration (Priority: P3)

The repository contains several existing configuration model classes; they must be updated to inherit from the base and include type/validation decorators, but consuming code should not see behavioural changes except for improved validation.

**Why this priority**: Prevents regressions when migrating models and ensures backward compatibility for persisted config files.

**Independent Test**: Refactor one existing model (e.g. `LogFileSource`), run the test suite, and verify no regressions occur; manually load existing sample config files to ensure they still parse.

**Acceptance Scenarios**:

1. **Given** any current config file used by the product, **When** the application loads it after the refactor, **Then** it behaves identically to before and any invalid data is now caught early.

---

### Edge Cases

- What happens when the JSON string contains extra fields not defined on the class? (should be ignored or flagged depending on policy)
- How are versioned configs handled if schema evolves? Allow only backward-compatible changes; extra or missing fields are ignored when reading older data, and migration logic is handled outside the serialization layer.
- How does `FromJson` behave if the payload is syntactically invalid JSON? (should propagate parse error vs validation error)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: There MUST be a base class `IsSerializable` with methods `ToJson(): string` and static `FromJson<T>(json: string): T` that handle serialization/deserialization.
- **FR-002**: `IsSerializable` must leverage a decorator-based runtime mapping and validation mechanism to translate between plain JSON and class instances and to enforce field constraints defined on subclasses.
- **FR-003**: All existing domain models representing configuration data MUST extend `IsSerializable` and annotate their properties with appropriate `@Expose()` and validation decorators (`@IsString()`, `@IsInt()`, etc.).
- **FR-004**: When `FromJson` is called with a JSON string that fails validation, it MUST reject (return a rejected promise or throw) with details about which fields failed.
- **FR-005**: `ToJson` MUST produce a compact JSON string that, when fed back into `FromJson`, returns an equivalent object (round‑trip guarantee).
- **FR-006**: New configuration model classes must work with the same base class and require minimal setup beyond declaring properties and decorators.
- **FR-007**: The serialization/validation system MUST reject any JSON that contains properties not defined on the class, returning a validation error listing the unexpected fields.
- **FR-008**: Documentation or README updates MUST explain how to create and validate serializable config objects.

### Key Entities *(include if feature involves data)*

- **IsSerializable**: Abstract base representing an object that can be converted to/from JSON with validation rules; provides `ToJson` and static `FromJson`.
- **Config domain models**: Various classes (e.g. `LogFileSourceConfig`, `SessionPanelConfig`, etc.) that currently hold user-editable configuration data and will now extend `IsSerializable`.
- **Validation metadata**: The set of decorators attached to class properties that drive runtime checks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing config-related domain model classes implement the new serialization base and pass the updated unit tests.
- **SC-002**: Unit tests cover round-trip serialization for each config type with both valid and invalid inputs; failure cases produce clear validation errors.
- **SC-003**: Developers can add a new config model and have working serialization/validation with no more than three lines of setup (extend `IsSerializable` plus property decorators).
- **SC-004**: No backwards-incompatible changes occur; loading legacy config files shows zero regressions in acceptance testing.
- **SC-005**: Developers report in retrospective that serialization validations reduce runtime errors by at least 50% compared to prior releases (qualitative target).

*Assumptions and clarifications will be recorded separately.*
