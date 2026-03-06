import * as vscode from 'vscode';
import { ConfigStore, ConfigCategory } from './config-store';
import { IsSerializable } from '../domain/serializable';

// A helper type describing a class that can be round‑trip validated.
// We need the constructor so we can `new` an empty instance when we receive
// a plain object, and the `fromJson` static method that lives on
// `IsSerializable` subclasses.

export type SerializableClass<T extends IsSerializable> =
    { fromJson(json: string): Promise<[T | null, any | null]> };

/**
 * Utility for handling the common save/validation logic used by the React
 * editors.  Each panel used to replicate the same try/catch boilerplate; the
 * static method below centralises that behaviour so callers simply pass the
 * incoming payload and some contextual values.
 */
export class ConfigSaver {
    /**
     * Validate and persist the provided configuration object.
     *
     * @param config  Either a plain object (deserialized from the webview) or
     *                a JSON string.  The value will be coerced into an
     *                instance of `cls` and re‑validated.
     * @param cls     The domain class (e.g. `FilepathConfig` or
     *                `FileLogLineConfig`) that implements `IsSerializable`.
     * @param store   ConfigStore used to write the file.
     * @param category  Category under which to save (filepath/filelog).
     * @param configDirUri  Base directory where configs live.
     * @param resultType  The message type to post on success/failure, e.g.
     *                    `'filepath-config:save-result'`.
     *
     * @returns a message object suitable for `panel.webview.postMessage`.
     */
    static async save<T extends IsSerializable>(
        config: T | string,
        cls: SerializableClass<T>,
        store: ConfigStore,
        category: ConfigCategory,
        configDirUri: vscode.Uri,
        resultType: string
    ): Promise<{ type: string; success: true } | { type: string; success: false; errorMessage: string }> {
        try {
            let instance: T;

            if (typeof config === 'string') {
                // webview sent us a JSON string
                const [inst, err] = await cls.fromJson(config);
                if (err || !inst) {
                    throw err || new Error('validation failed');
                }
                instance = inst;
            } else {
                // plain object from webview; we avoid `new cls()` because the
                // class may be abstract (see FileLogLineConfig).  Instead we'll
                // serialize and re-parse via the class's own deserializer,
                // which will also apply validation.
                const json = JSON.stringify(config);
                const [inst, err] = await cls.fromJson(json);
                if (err || !inst) {
                    throw err || new Error('validation failed');
                }
                instance = inst;
            }

            // round‑trip through the serializer to catch any invalid data or
            // extraneous properties as defined by the decorators.
            const [valid, err] = await cls.fromJson(instance.toJson());
            if (err || !valid) {
                throw err || new Error('validation failed');
            }

            await vscode.workspace.fs.createDirectory(configDirUri);
            // `valid` is now a concrete, typed instance with validated data
            await store.writeConfig(category, (valid as any).shortName, valid as any);

            return { type: resultType, success: true };
        } catch (err: any) {
            let message: string;
            if (Array.isArray(err)) {
                message = err.map(e => `${e.property}: ${Object.values(e.constraints || {}).join(', ')}`).join('; ');
            } else if (err && typeof err.message === 'string') {
                message = err.message;
            } else {
                message = String(err);
            }
            return { type: resultType, success: false, errorMessage: message };
        }
    }
}
