# Research Notes: Config model serialization

## Questions & Decisions

### 1. Decorator-based serialization/validation libraries

**Decision:** Use the `typestack` family (`class-transformer` for mapping and `class-validator` for validation).  These are widely used and integrate well with decorators, providing the behaviour described in the spec example.  `class-transformer` supports `plainToInstance` (formerly `plainToClass`) which handles nested objects and arrays.  `class-validator` can validate instances or plain objects.  Both libraries allow global configuration to forbid non-whitelisted properties (helpful for extra-field policy).

**Rationale:** They match the idiom in the user request and are mature (10k+ stars, actively maintained).  Alternatives such as `zod` or `io-ts` provide similar runtime checks but use schema objects rather than class decorators; migrating the existing interface-style code to schemas would be a larger shift and lose the ability to have methods on config classes.  Using typestack keeps the class pattern and allows us to easily reuse decorators for both serialization and validation.

**Alternatives considered:**
- `zod`/`io-ts` – powerful but not class‑based; would require writing separate schema definitions and wrapper conversion functions.  Rejected due to extra boilerplate and divergence from existing design.
- Manual validators (current state) – high maintenance and error-prone; already in place but being replaced.

### 2. Enabling decorators in our build

**Decision:** Add `experimentalDecorators: true` and `emitDecoratorMetadata: true` to `tsconfig.json`.  Import `reflect-metadata` at extension startup (e.g. in `src/extension.ts`) since class-validator requires metadata.  Esbuild bundling will include `reflect-metadata` automatically if imported.

**Rationale:** Decorators are not enabled currently; enabling them is required for the chosen libraries.  `emitDecoratorMetadata` is optional but simplifies certain validations (e.g. automatic type detection for nested classes).  Including reflect-metadata is a standard step in projects using class-transformer/class-validator.

**Alternatives considered:**
- Avoid decorators by using manual transformation or schema library – rejected.
- Use Babel or a different transpiler – unnecessary since TypeScript already supports decorators.

### 3. Base class design (`IsSerializable`)

**Decision:** Implement an abstract generic class with two methods:

```ts
abstract class IsSerializable {
  toJson(): string {
    return JSON.stringify(classToPlain(this));
  }
  static fromJson<T>(this: new () => T, json: string): T {
    const plain = JSON.parse(json);
    const instance = plainToInstance(this, plain, { excludeExtraneousValues: true });
    return validateOrReject(instance).then(() => instance as unknown as T);
  }
}
```

Use `excludeExtraneousValues: true` to drop properties not annotated with `@Expose()`; in addition we can configure `class-validator` with `forbidNonWhitelisted: true` to reject extras when validation runs.  Subclasses must use `@Expose()` on each field and validation decorators (e.g., `@IsString()`).

**Rationale:** A generic `fromJson` using `this` type ensures that calling `MyConfig.fromJson(json)` returns an instance of `MyConfig`.  Placing the logic in a base class avoids duplication.  Using promises allows `validateOrReject` to propagate errors easily.

**Alternatives considered:**
- Standalone utility functions – would require passing class constructors each time; chosen base class pattern is cleaner for inheritance and encourages consistency.
- Putting logic in ConfigStore – mixes persistence with schema; prefer to keep models self-contained.

### 4. Handling unions (FileLogLineConfig)

**Decision:** Model each variant as a subclass of an abstract base (e.g. `FileLogLineConfig` with subclasses `TextLineConfig`, `XmlLineConfig`, `JsonLineConfig`).  Use `@Type(() => TextLineConfig)` and `@ValidateNested()` on arrays or object fields as needed.  Add a `@IsIn(['text','xml','json'])` constraint on `type` and a custom transformer to instantiate the correct subclass in `fromJson`.

**Rationale:** class-transformer can discriminate unions using `@Type` with a discriminator option (available in newer versions).  We can also implement a custom plainToInstance call based on the `type` property.  This will provide type-safe instances and allow nested validation on fields arrays.

**Alternatives considered:**
- Keep union as a TypeScript union of interfaces and validate manually – not acceptable since we want to use class-validator on each variant.
- Use a single class with optional properties for all variants – messy and error-prone.

### 5. Extra-field policy and Json parsing errors

**Decision:** Configure validation to `forbidNonWhitelisted: true`; this causes `validateOrReject` to throw an error listing unknown fields.  Parsing JSON syntax errors will surface naturally when `JSON.parse` is called; we will let those propagate as `SyntaxError` so callers can differentiate parse vs schema errors.

**Rationale:** matches spec requirement to reject extra properties.  Using validator options centralizes the behavior.

**Alternatives considered:**
- Ignore extras silently – rejected by spec.
- Strip extras and log warnings – more work and less strict.

### 6. Impact on bundle size and dependency management

**Decision:** Add two small libraries plus reflect-metadata; total added size ~50 KB min+gzip which is acceptable given extension is >1 MB.  Keep dependencies in devDependencies as appropriate? Actually they are runtime needed, so in dependencies.

**Rationale:** Acceptable tradeoff for increased robustness.

### 7. Testing approach

**Decision:** Write unit tests for each config class verifying `fromJson`/`toJson` round-trip and failure cases.  Keep tests alongside existing tests (e.g., `test/unit/domain`).  No integration tests required beyond existing load/save behaviour since code path remains the same.

**Rationale:** Ensures coverage and adheres to Test‑First principle.

### 8. Migration effort

**Decision:** Migrate one class at a time, starting with `FilepathConfig` (simplest).  Use intermediate steps: create new class, update ConfigStore read/write to use `fromJson` (or call from store), update tests.  Existing callers of type definitions will still accept the new class because it implements the same interface.  During transition we can keep the old `isFilepathConfig` helper temporarily until last refactor.

**Rationale:** Minimizes risk and allows incremental PRs.

## Summary of research

- Typestack (class-transformer/class-validator) chosen for decorator-based validation & serialization.
- tsconfig and bundler will need decorator support (`experimentalDecorators`, `emitDecoratorMetadata`, `reflect-metadata` import).
- A generic `IsSerializable` base class will implement `toJson`/`fromJson` with options to forbid extras and validate nested objects.
- Unions will be broken into class hierarchies with discrimination based on `type` field.
- JSON parsing errors will propagate; extra fields will cause validation errors via configuration.
- Added dependencies have modest size impact and fit constitution guidelines.
- Testing strategy agreed; migration incremental.

These decisions resolve the open design questions and form the basis for Phase 1 design and eventual implementation.
