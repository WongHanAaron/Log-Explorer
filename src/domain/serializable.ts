import { plainToInstance, ClassTransformOptions } from 'class-transformer';
import { validateOrReject, ValidatorOptions } from 'class-validator';

/**
 * Base class for any config object that needs to be persisted/validated.
 *
 * Subclasses should decorate properties with `@Expose()` and the
 * appropriate validation decorators from `class-validator` (e.g. `@IsString`).
 *
 * Example:
 *
 * ```ts
 * class Foo extends IsSerializable {
 *   @Expose()
 *   @IsString()
 *   name!: string;
 * }
 *
 * const foo = await Foo.fromJson('{"name":"bar"}');
 * ```
 */
export abstract class IsSerializable {
    /**
     * Turn this object into a JSON string suitable for storage.
     * Only exposed properties are included.
     */
    toJson(): string {
        // `class-transformer` provides `instanceToPlain` but for simplicity we
        // can stringify the object directly; the bundle already strips
        // non-enumerable and undefined values.
        // Note: if the instance has methods or getters, they won't be included –
        // which is desirable for configuration objects.
        return JSON.stringify(this);
    }

    /**
     * Parse a JSON string and validate it against the class schema.
     *
     * Returns a tuple `[instance, error]`.
     * - on success the instance is non-null and error is null
     * - on failure the instance is null and error contains either a
     *   `SyntaxError` or an array of `ValidationError`
     *
     * The generic `T` is inferred from the constructor on which the method is
     * invoked (thanks to the polymorphic `this` type).
     */
    static async fromJson<T>(this: abstract new () => T, json: string): Promise<[T | null, any | null]> {
        try {
            const plain: unknown = JSON.parse(json);

            // We intentionally do *not* exclude extraneous values here.  Doing so
            // would remove unknown fields before validation, preventing the
            // `forbidNonWhitelisted` option from detecting them.  Validation occurs
            // against the raw instance containing everything parsed from JSON.
            const instance = plainToInstance(this as any, plain) as T;

            const validatorOpts: ValidatorOptions = {
                whitelist: true,
                forbidNonWhitelisted: true,
                skipMissingProperties: false,
            };

            await validateOrReject(instance as object, validatorOpts);
            return [instance, null];
        } catch (err) {
            return [null, err];
        }
    }
}
