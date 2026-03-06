/**
 * Helpers for working with discriminated unions when using class-transformer.
 *
 * class-transformer has support for discriminators, but the API can be a
 * little verbose; this module provides a thin wrapper that the models can
 * reuse.
 *
 * Example usage (in FileLogLineConfig.fromJson, once the class hierarchy exists):
 *
 * ```ts
 * const typeMap = {
 *   text: TextLineConfig,
 *   xml: XmlLineConfig,
 *   json: JsonLineConfig,
 * } as const;
 *
 * export function deserializeFileLogLineConfig(json: string) {
 *   const plain = JSON.parse(json);
 *   const ctor = typeMap[(plain as any).type as keyof typeof typeMap];
 *   if (!ctor) {
 *     throw new Error(`unknown fileLogLine type: ${(plain as any).type}`);
 *   }
 *   return ctor.fromJson(json);
 * }
 * ```
 *
 * The filelog-config migration will make use of this helper.
 */

// For now this file is just a placeholder; more helpers can be added as
// migration proceeds.
