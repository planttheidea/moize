import type { Key } from 'micro-memoize';
import stringify from 'fast-stringify';
import type { Moizeable, Options, Serializer } from './internalTypes';

/**
 * Default replacer used when stringifying to ensure values that would normally be
 * ignored are respected.
 */
function defaultReplacer(key: string, value: any) {
    const type = typeof value;

    return type === 'function' || type === 'symbol' ? value.toString() : value;
}

/**
 * Based on the options passed, either use the serializer passed or use the default.
 */
export function getSerializeTransformKey<Fn extends Moizeable>({
    serialize,
}: Options<Fn>): Serializer | undefined {
    if (typeof serialize === 'function') {
        return serialize;
    }

    if (serialize) {
        return (args: Key) => [stringify(args, { replacer: defaultReplacer })];
    }
}

/**
 * Determines whether the serialized keys are equal to one another.
 */
export function isSerializedKeyEqual(prevKey: Key, nextKey: Key) {
    return prevKey[0] === nextKey[0];
}
