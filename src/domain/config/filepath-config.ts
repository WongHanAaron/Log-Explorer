import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsArray, Matches } from 'class-validator';
import { IsSerializable } from '../serializable';

/**
 * FilepathConfig domain object.
 * Stored at: .logex/filepath-configs/{shortName}.json
 *
 * This class replaces the previous interface and validation helpers.  By
 * extending `IsSerializable` and applying decorators we get automatic
 * serialization and runtime validation.
 */
export class FilepathConfig extends IsSerializable {
    /** Kebab-case identifier; must match the filename (without .json) */
    @Expose()
    // @ts-ignore Property decorator signature mismatch with TS5 types
    @IsString()
    // @ts-ignore
    @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    shortName!: string;


    /**
     * Glob pattern or absolute/relative path to the log file(s).
     * Relative paths are resolved from the workspace root.
     */
    @Expose()
    // @ts-ignore
    @IsString()
    pathPattern!: string;

    /** Optional description / note for the user */
    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    description?: string;

    /** Optional tag list for categorizing the source */
    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsArray()
    // @ts-ignore
    @IsString({ each: true })
    tags?: string[];
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Returns true if `name` satisfies the kebab-case contract:
 * lower-alpha / digit segments separated by single hyphens, no leading/trailing hyphens.
 */
export function isKebabName(name: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/**
 * Converts an arbitrary string to the nearest valid kebab-case name.
 * - Lowercases all characters
 * - Replaces runs of non-alphanumeric characters with a single hyphen
 * - Strips leading and trailing hyphens
 */
export function toKebabName(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
