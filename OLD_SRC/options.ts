// external dependencies
import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
// eslint-disable-next-line no-unused-vars
import { MicroMemoize } from 'micro-memoize';

// constants
import { DEFAULT_OPTIONS_KEYS } from './constants';

// maxArgs
import { createGetInitialArgs } from './maxArgs';

// serialize
import { getIsSerializedKeyEqual, getSerializerFunction } from './serialize';

// utils
import { compose, getArrayKey } from './utils';

interface MemoizedFunction extends Function {
  cache: MicroMemoize.Cache;
  options: MicroMemoize.Options;
}

export function createOnCacheOperation(fn: Function | void): Function | void {
  if (typeof fn === 'function') {
    /**
     * @private
     *
     * @function onCacheOperation
     *
     * @description
     * when the cache is modified in some way, call the method with the memoized
     * cache, options, and function
     *
     * @param _cache the micro-memoize cache (ignored)
     * @param _microMemoizeOptions the micro-memoize options (ignored)
     * @param memoized the memoized method
     * @returns the result of the cache modified operation
     */
    return function onCacheOperation(
      _cache: Cache,
      _microMemoizeOptions: MicroMemoize.Options,
      memoized: MemoizedFunction,
    ) {
      return fn(memoized.cache, memoized.options, memoized);
    };
  }
}

/**
 * @private
 *
 * @function getCustomOptions
 *
 * @description
 * get the custom options passed with the rest of the options
 *
 * @param options the options to get the custom values from
 * @returns the custom options passed
 */
export function getCustomOptions(options: Moize.Options) {
  const customOptions: { [key: string]: any } = {};

  for (const key in options) {
    if (!DEFAULT_OPTIONS_KEYS[key]) {
      // @ts-ignore
      customOptions[key] = options[key];
    }
  }

  return customOptions;
}

/**
 * @private
 *
 * @function getIsEqual
 *
 * @description
 * get the method to use for the isEqual option passed to micro-memoize
 *
 * @param equals the key item equality validator
 * @param isDeepEqual is deep equality used for key comparison
 * @param isReact is the function a React component
 * @returns the isEqual method
 */
export function getIsEqual({ equals, isDeepEqual, isReact }: Moize.Options) {
  if (equals) {
    return equals;
  }

  if (isDeepEqual) {
    return deepEqual;
  }

  if (isReact) {
    return shallowEqual;
  }

  return sameValueZeroEqual;
}

/**
 * @private
 *
 * @function getIsMatchingKey
 *
 * @description
 * get the method to use for the isMatchingKey option passed to micro-memoize
 *
 * @param isSerialized is serialization used for the key
 * @param matchesKey the key equality validator
 * @returns the isMatchingKey method
 */
export function getIsMatchingKey({ isSerialized, matchesKey }: Moize.Options) {
  if (matchesKey) {
    return matchesKey;
  }

  if (isSerialized) {
    return getIsSerializedKeyEqual;
  }
}

/**
 * @private
 *
 * @function getTransformKey
 *
 * @description
 * get the transformKey method passed to micro-memoize
 *
 * @param options the moize options passed
 * @returns the transformKey method
 */
export function getTransformKey(options: Moize.Options) {
  return compose(
    options.isSerialized && getSerializerFunction(options),
    typeof options.transformArgs === 'function' &&
      compose(
        getArrayKey,
        options.transformArgs,
      ),
    options.isReact && createGetInitialArgs(2),
    typeof options.maxArgs === 'number' &&
      createGetInitialArgs(options.maxArgs),
  );
}
