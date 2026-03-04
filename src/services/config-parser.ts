import { FilepathConfig, isFilepathConfig } from '../domain/filepath-config';
import { FileLogLineConfig, isFileLogLineConfig } from '../domain/filelog-config';

/**
 * Helper class that provides filename conversion and JSON parsing for both
 * filepath and filelog configurations.  All methods are static so callers may
 * use them without instantiating the class.
 */
export class ConfigParser {
    static configFilename(shortName: string): string {
        return `${shortName}.json`;
    }

    static parseFilepathConfig(json: string): FilepathConfig {
        let obj: unknown;
        try {
            obj = JSON.parse(json);
        } catch {
            throw new Error(`Malformed JSON: could not parse filepath config`);
        }
        if (!isFilepathConfig(obj)) {
            throw new Error(`Invalid FilepathConfig: schema validation failed`);
        }
        return obj;
    }

    static parseFileLogLineConfig(json: string): FileLogLineConfig {
        let obj: unknown;
        try {
            obj = JSON.parse(json);
        } catch {
            throw new Error(`Malformed JSON: could not parse filelog config`);
        }
        if (!isFileLogLineConfig(obj)) {
            throw new Error(`Invalid FileLogLineConfig: schema validation failed`);
        }
        return obj;
    }
}
