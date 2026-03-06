# Quickstart: Creating and Using Serializable Config Models

This quick guide shows how to define a new configuration class and perform
round‑trip serialization with automatic validation.  The underlying machinery is
provided by `IsSerializable` and the decorated models.

## Step 1 – Enable Decorators

Ensure `tsconfig.json` contains the following options:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    // ...existing options...
  }
}
```

Import `reflect-metadata` once at extension startup (for example in
`src/extension.ts`):

```ts
import 'reflect-metadata';
```

Install the runtime dependencies if they are not already present:

```bash
npm install class-transformer class-validator reflect-metadata
```

## Step 2 – Define a New Config Class

Create a class under `src/domain`.  For example, a simple user profile config:

```ts
import { Expose, Type, plainToInstance } from 'class-transformer';
import { IsString, IsOptional, validateOrReject } from 'class-validator';
import { IsSerializable } from './serializable';

export class UserProfileConfig extends IsSerializable {
  @Expose()
  @IsString()
  username!: string;

  @Expose()
  @IsOptional()
  @IsString()
  bio?: string;
}
```

Notice there is no manual `fromJson` logic – the base class handles it.

## Step 3 – Serialize and Deserialize

```ts
const json = '{"username":"alice","bio":"hello"}';

try {
  const profile = await UserProfileConfig.fromJson(json);
  console.log(profile instanceof UserProfileConfig); // true

  // Use the object normally…
  profile.bio = 'updated';

  const output = profile.toJson();
  // output is '{"username":"alice","bio":"updated"}'
} catch (err) {
  // validation or parse error occurred
  console.error('Invalid config:', err);
}
```

If the JSON contains an extra field (e.g. `"age":30`) the promise rejects with
a validation error listing the unexpected property.  Malformed JSON results in a
standard `SyntaxError` thrown by `JSON.parse`.

## Step 4 – Integrate with ConfigStore

The existing `ConfigStore` can call the static method when reading files:

```ts
import { UserProfileConfig } from '../domain/user-profile-config';

const raw = await fs.readFile(uri, 'utf8');
const config = await UserProfileConfig.fromJson(raw);
```

New models require no additional wiring beyond importing and using the class.
Existing code paths that currently rely on `isSomething` guards can be
updated to use `instanceof` after migration.

## Round-trip Guarantee

Every `IsSerializable` subclass must satisfy the property that
`Subclass.fromJson(subclassInstance.toJson())` returns an equivalent object.  Unit
tests automatically assert this for each config type (see `test/unit/domain`).

By following these steps, developers can create robust, self-validating
configuration objects with minimal boilerplate.