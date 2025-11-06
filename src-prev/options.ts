import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
import { createGetInitialArgs } from './maxArgs';
import { getIsSerializedKeyEqual, getSerializerFunction } from './serialize';
import { compose } from './utils';

import type {
    Cache,
    IsEqual,
    IsMatchingKey,
    MicroMemoizeOptions,
    Moizeable,
    Moized,
    OnCacheOperation,
    Options,
    TransformKey,
} from '../index.d';

export function createOnCacheOperation<MoizeableFn extends Moizeable>(
    fn?: OnCacheOperation<MoizeableFn>
): OnCacheOperation<MoizeableFn> {
    if (typeof fn === 'function') {
        return (
            _cacheIgnored: Cache<MoizeableFn>,
            _microMemoizeOptionsIgnored: MicroMemoizeOptions<MoizeableFn>,
            memoized: Moized
        ): void => fn(memoized.cache, memoized.options, memoized);
    }
}

/**
 * @private
 *
 * @description
 * get the isEqual method passed to micro-memoize
 *
 * @param options the options passed to the moizer
 * @returns the isEqual method to apply
 */
export function getIsEqual<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): IsEqual {
    return (
        options.matchesArg ||
        (options.isDeepEqual && deepEqual) ||
        (options.isShallowEqual && shallowEqual) ||
        sameValueZeroEqual
    );
}

/**
 * @private
 *
 * @description
 * get the isEqual method passed to micro-memoize
 *
 * @param options the options passed to the moizer
 * @returns the isEqual method to apply
 */
export function getIsMatchingKey<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): IsMatchingKey | undefined {
    return (
        options.matchesKey ||
        (options.isSerialized && getIsSerializedKeyEqual) ||
        undefined
    );
}

/**
 * @private
 *
 * @description
 * get the function that will transform the key based on the arguments passed
 *
 * @param options the options passed to the moizer
 * @returns the function to transform the key with
 */
export function getTransformKey<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): TransformKey | undefined {
    return compose(
        options.isSerialized && getSerializerFunction(options),
        typeof options.transformArgs === 'function' && options.transformArgs,
        typeof options.maxArgs === 'number' &&
            createGetInitialArgs(options.maxArgs)
    ) as TransformKey;
}
