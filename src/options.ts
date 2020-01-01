import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
import { createGetInitialArgs } from './maxArgs';
import { getIsSerializedKeyEqual, getSerializerFunction } from './serialize';
import {
  Cache,
  IsEqual,
  IsMatchingKey,
  MicroMemoizeOptions,
  Moized,
  OnCacheOperation,
  Options,
  TransformKey,
} from './types';
import { compose, getArrayKey } from './utils';

export function createOnCacheOperation(fn?: OnCacheOperation): OnCacheOperation {
  if (typeof fn === 'function') {
    return (
      cacheIgnored: Cache,
      microMemoizeOptionsIgnored: MicroMemoizeOptions,
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
export function getIsEqual(options: Options): IsEqual {
  return (
    options.equals ||
    (options.isDeepEqual && deepEqual) ||
    (options.isReact && shallowEqual) ||
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
export function getIsMatchingKey(options: Options): IsMatchingKey | undefined {
  return options.matchesKey || (options.isSerialized && getIsSerializedKeyEqual) || undefined;
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
export function getTransformKey(options: Options): TransformKey | undefined {
  return compose(
    options.isSerialized && getSerializerFunction(options),
    typeof options.transformArgs === 'function' && compose(getArrayKey, options.transformArgs),
    options.isReact && createGetInitialArgs(2),
    typeof options.maxArgs === 'number' && createGetInitialArgs(options.maxArgs)
  ) as TransformKey;
}
