// @ts-nocheck
import { Expose, Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { IsSerializable } from './serializable';

// shared extraction types ----------------------------------------------------
export abstract class FieldExtraction {
    @Expose()
    @IsString()
    kind!: string;
}

export class PrefixSuffixExtraction extends FieldExtraction {
    @Expose()
    @IsIn(['prefix-suffix'])
    kind: 'prefix-suffix' = 'prefix-suffix';

    @Expose()
    @IsOptional()
    @IsString()
    prefix?: string;

    @Expose()
    @IsOptional()
    @IsString()
    suffix?: string;
}

export class RegexExtraction extends FieldExtraction {
    @Expose()
    @IsIn(['regex'])
    kind: 'regex' = 'regex';

    @Expose()
    @IsString()
    pattern!: string;
}

export type FieldExtractionType = PrefixSuffixExtraction | RegexExtraction;

export class DateTimeFormat {
    @Expose()
    @IsOptional()
    @IsString()
    formatString?: string;

    @Expose()
    @IsOptional()
    readonly autoDetect?: boolean;
}

export class TextField {
    @Expose()
    @IsString()
    name!: string;

    @Expose()
    @ValidateNested()
    @Type(() => FieldExtraction, {
        discriminator: {
            property: 'kind',
            subTypes: [
                { value: PrefixSuffixExtraction, name: 'prefix-suffix' },
                { value: RegexExtraction, name: 'regex' }
            ]
        }
    })
    extraction!: FieldExtractionType;

    @Expose()
    @IsOptional()
    @ValidateNested()
    @Type(() => DateTimeFormat)
    datetime?: DateTimeFormat;
}

export class XmlFieldMapping {
    @Expose()
    @IsString()
    name!: string;

    @Expose()
    @IsString()
    xpath!: string;

    @Expose()
    @IsOptional()
    @ValidateNested()
    @Type(() => DateTimeFormat)
    datetime?: DateTimeFormat;
}

export class JsonFieldMapping {
    @Expose()
    @IsString()
    name!: string;

    @Expose()
    @IsString()
    jsonPath!: string;

    @Expose()
    @IsOptional()
    @ValidateNested()
    @Type(() => DateTimeFormat)
    datetime?: DateTimeFormat;
}

// config classes ----------------------------------------------------------------
export abstract class FileLogLineConfig extends IsSerializable {
    @Expose()
    @IsIn(['text', 'xml', 'json'])
    type!: 'text' | 'xml' | 'json';

    @Expose()
    @IsString()
    shortName!: string;

    @Expose()
    @IsString()
    label!: string;

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

export class TextLineConfig extends FileLogLineConfig {
    @Expose()
    @IsIn(['text'])
    type: 'text' = 'text';

    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TextField)
    fields!: TextField[];
}

export class XmlLineConfig extends FileLogLineConfig {
    @Expose()
    @IsIn(['xml'])
    type: 'xml' = 'xml';

    @Expose()
    @IsString()
    rootXpath!: string;

    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => XmlFieldMapping)
    fields!: XmlFieldMapping[];
}

export class JsonLineConfig extends FileLogLineConfig {
    @Expose()
    @IsIn(['json'])
    type: 'json' = 'json';

    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JsonFieldMapping)
    fields!: JsonFieldMapping[];
}
