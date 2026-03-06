import { expect } from 'chai';

/**
 * Assert that `clazz.fromJson` round-trips for `obj`.
 *
 * The helper serializes the object with `toJson`, then calls `fromJson`
 * on the supplied class and compares the result with the original using
 * deep equality.  It also ensures that `fromJson` accepts a JSON string we
 * manually craft, returning an instance of the class.
 */
export async function assertRoundTrip<T>(
    clazz: { new(): T; fromJson(json: string): Promise<[T | null, any | null]> },
    obj: T
) {
    const json = (obj as any).toJson ? (obj as any).toJson() : JSON.stringify(obj);
    const [inst, err] = await clazz.fromJson(json);
    expect(err).to.be.null;
    expect(inst).to.be.instanceOf(clazz as any);
    expect(inst).to.deep.equal(obj);
}
