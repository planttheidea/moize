import { deepEqual, shallowEqual } from 'fast-equals';
import type { Moizable, Options } from './internalTypes';
import { getMaxArgsTransformKey } from './maxArgs';
import { getSerializeTransformKey, isSerializedKeyEqual } from './serialize';
import { compose } from './utils';

/**
 * Get the `isArgEqual` method passed to `micro-memoize`.
 */
export function getIsArgEqual<Fn extends Moizable>({
    isArgEqual,
    react,
}: Options<Fn>) {
    if (typeof isArgEqual === 'function') {
        return isArgEqual;
    }

    if (isArgEqual === 'deep') {
        return deepEqual;
    }

    // If `react` and no custom equality comparator is passed, use `shallowEqual` to allow
    // a shallow props comparison.
    if (isArgEqual === 'shallow' || react) {
        return shallowEqual;
    }
}

/**
 * Get the `isKeyEqual` method passed to `micro-memoize`.
 */
export function getIsKeyEqual<Fn extends Moizable>({
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
export function getTransformKey<Fn extends Moizable>(options: Options<Fn>) {
    return compose(
        getSerializeTransformKey(options),
        options.transformKey,
        getMaxArgsTransformKey(options),
    );
}
