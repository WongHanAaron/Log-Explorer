# Data Model: Config Serialization

This feature introduces a new object model for configuration data that supports
runtime serialization, deserialization, and validation.  The core entities and
their relationships are described below.

## Entities

### IsSerializable (abstract class)

Represents any object that can be converted to and from JSON with schema
validation.

- **Fields:** none
- **Methods:**
  - `toJson(): string` — returns a compact JSON string representing the current
    state.
  - `static fromJson<T>(this: new () => T, json: string): Promise<T>` — parses
    the JSON, transforms it into an instance of the calling class, validates
    all constraints, and returns the instance or rejects with validation
    errors.
- **Relationships:** All configuration model classes extend this base.  The
  generics and `this` typing ensure correct return types.

### FilepathConfig (class)

Previously an interface with a standalone `isFilepathConfig` validator.
Now becomes a class extending `IsSerializable` with decorated properties.

- **Fields:** `shortName`, `label`, `pathPattern`, `description?`, `tags?`.
- **Decorators:** `@Expose()` on each field plus `@IsString()`,
  `@IsOptional()`, `@IsArray()`, `@ValidateNested()` and custom validators
  such as kebab-case check (via `@Matches` or custom constraint).

### FileLogLineConfig hierarchy

This union of three variants is replaced with a class hierarchy:

- **FileLogLineConfig** (abstract, extends `IsSerializable`)
  - property `type: 'text' | 'xml' | 'json'` with `@IsIn([...])` and used as a
    discriminator.
- **TextLineConfig** (extends `FileLogLineConfig`)
  - `fields: TextField[]`
- **XmlLineConfig** (extends `FileLogLineConfig`)
  - `rootXpath: string`
  - `fields: XmlFieldMapping[]`
- **JsonLineConfig** (extends `FileLogLineConfig`)
  - `fields: JsonFieldMapping[]`

Each of the `*Field` and mapping types becomes its own class with appropriate
nested validation (using `@ValidateNested()` and `@Type()` to hint the
transformer).

### Other config classes

Any additional config types currently defined elsewhere (session templates,
etc.) will follow the same pattern: convert interface → class, extend
`IsSerializable`, decorate fields, add tests.

## Validation metadata

Decorators attached to model properties express the schema.  Examples:

```ts
class FilepathConfig extends IsSerializable {
  @Expose()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  shortName!: string;

  @Expose()
  @IsString()
  label!: string;

  @Expose()
  @IsString()
  pathPattern!: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

The base class and global validator configuration enforce that no
non‑exposed properties may appear in input JSON.

## Notes on unions

`class-transformer` can discriminate using `@Type(() => ... , { discriminator: … })`.
When deserializing a `FileLogLineConfig`, the base class's `fromJson`
implementation will inspect `type` and choose the appropriate subclass.  This
logic is part of the serialization utility rather than the model definitions
(see quickstart or utilities docs).

This model ensures that objects are structurally accurate, type-safe within
TypeScript, and carry validation logic alongside their definitions.
