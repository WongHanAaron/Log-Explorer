import { Expose } from 'class-transformer';
import {
    IsString,
    IsOptional,
    IsIn,
    IsNumber,
    IsObject,
} from 'class-validator';
import { IsSerializable } from '../serializable';

/**
 * Configuration for a file access adapter. Stored at
 * `.logex/fileaccess-configs/{shortName}.json`
 */
export class FileAccessConfig extends IsSerializable {
    /** Identifier; must match filename without extension */
    @Expose()
    // @ts-ignore decorator signature
    @IsString()
    shortName!: string;


    /** Type of adapter being configured */
    @Expose()
    // @ts-ignore
    @IsIn(['local', 'sftp', 'smb'])
    adapterType!: 'local' | 'sftp' | 'smb';

    /** Adapter-specific settings object.  Validation performed dynamically.
     *  Stored as a plain object but cast to one of the helper classes below.
     */
    @Expose()
    // @ts-ignore
    @IsObject()
    settings!: Record<string, any>;
}

// adapter-specific helpers used by parser/validation logic

export class LocalSettings {
    @Expose()
    // @ts-ignore
    @IsString()
    basePath!: string;
}

export class SftpSettings {
    @Expose()
    // @ts-ignore
    @IsString()
    host!: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsNumber()
    port?: number;

    @Expose()
    // @ts-ignore
    // @ts-ignore
    @IsString()
    username!: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    password?: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    privateKey?: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    root?: string;
}

export class SmbSettings {
    @Expose()
    // @ts-ignore
    // @ts-ignore
    @IsString()
    share!: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    username?: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    password?: string;

    @Expose()
    // @ts-ignore
    @IsOptional()
    // @ts-ignore
    @IsString()
    domain?: string;
}
