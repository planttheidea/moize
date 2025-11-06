import { deepEqual, shallowEqual } from 'fast-equals';
import type { Options } from './internalTypes';
import { getMaxArgsTransformKey } from './maxArgs';
import { getSerializeTransformKey, isSerializedKeyEqual } from './serialize';
import { compose } from './utils';

/**
 * Get the `isArgEqual` method passed to `micro-memoize`.
 */
export function getIsArgEqual<Fn extends (...args: any[]) => any>({
    isArgEqual,
}: Options<Fn>) {
    if (typeof isArgEqual === 'function') {
        return isArgEqual;
    }

    if (isArgEqual === 'deep') {
        return deepEqual;
    }

    if (isArgEqual === 'shallow') {
        return shallowEqual;
    }
}

/**
 * Get the `isKeyEqual` method passed to `micro-memoize`.
 */
export function getIsKeyEqual<Fn extends (...args: any[]) => any>({
    isKeyEqual,
    serialize,
}: Options<Fn>) {
    if (isKeyEqual) {
        return isKeyEqual;
    }

    if (serialize) {
        return isSerializedKeyEqual;
    }
}

/**
 * Get the `transformKey` method passed to `micro-memoize`.
 */
export function getTransformKey<Fn extends (...args: any[]) => any>(
    options: Options<Fn>,
) {
    return compose(
        getSerializeTransformKey(options),
        options.transformKey,
        getMaxArgsTransformKey(options),
    );
}
