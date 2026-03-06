# Contracts: Serializable Config API

The feature exposes the following public contract for other parts of the
extension.  Consumers only need to know about the abstract base class and the
expected behaviour of its methods; implementation details are internal.

## `IsSerializable` (abstract)

```ts
abstract class IsSerializable {
  toJson(): string;
  static fromJson<T>(this: new () => T, json: string): Promise<T>;
}
```

- **Purpose**: any domain model representing persisted configuration should
  extend `IsSerializable` to gain JSON serialization and runtime validation.
- **Behavior guarantees**:
  - `fromJson` returns an instance of the calling subclass (type parameter
    inferred automatically).
  - The returned promise rejects if the supplied JSON is syntactically invalid
    or fails validation against the subclass's decorated constraints.
  - Extra fields in the input cause rejection; missing required fields also
    trigger validation errors.
  - `toJson` returns a string suitable for storage and interoperable with
    `fromJson` (round‑trip guarantee).

## JSON schema expectations

While there is no formal JSON Schema file shipped, each config class is
expected to produce the following characteristics when serialized:

- Only properties decorated with `@Expose()` are included.
- Property types are primitive `string`, `number`, `boolean`, or arrays/objects
  as defined by the class.
- For union hierarchies, a discriminating field (e.g. `type`) indicates the
  variant.

Other systems (e.g., workspace config files) may rely on the fact that saved
config JSON matches the above structure; any departure requires a matching
update to the associated model class.

## Usage by other modules

Modules such as `ConfigStore` and webview message handlers can import specific
config classes and invoke:

```ts
const cfg = await LogFileSourceConfig.fromJson(rawString);
await fs.writeFile(uri, cfg.toJson());
```

Consumers must handle rejection from `fromJson` and may use `instanceof` to
narrow types if needed.

No other direct APIs are exposed; all validation logic lives within the
config classes themselves.