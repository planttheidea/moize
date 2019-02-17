// external dependencies
// eslint-disable-next-line no-unused-vars
import { MicroMemoize } from 'micro-memoize';

// constants
import { DEFAULT_OPTIONS } from './constants';

const { isArray } = Array;
const { hasOwnProperty } = Object.prototype;

const DEV = !!(process && process.env && process.env.NODE_ENV !== 'production');

/**
 * @private
 *
 * @function assignFallback
 *
 * @description
 * fallback to the built-in Object.assign when not available
 *
 * @param target the target object
 * @param sources the sources to assign to the target
 * @returns the assigned target
 */
export function assignFallback(target: any, ...sources: any[]) {
  return sources.length
    ? sources.reduce((assigned, source) => {
      if (source && typeof source === 'object') {
        for (const key in source) {
          if (hasOwnProperty.call(source, key)) {
            // eslint-disable-next-line no-param-reassign
            assigned[key] = source[key];
          }
        }
      }

      return assigned;
    }, target)
    : target;
}

/**
 * @private
 *
 * @constant assign the method to assign sources into a target
 */
export const assign =
  typeof Object.assign === 'function' ? Object.assign : assignFallback;

/**
 * @private
 *
 * @function combine
 *
 * @description
 * combine all functions that are functions into a single function that calls
 * all functions in the order passed
 *
 * @param functions the functions to combine
 * @returns the combined function
 */
export function combine(...functions: (Function | void)[]): Function | void {
  if (functions.length) {
    return functions.reduce((f: Function | void, g: Function | void) => {
      if (typeof f === 'function') {
        return typeof g === 'function'
          ? function combined(): void {
            /* eslint-disable prefer-rest-params */
            g.apply(this, arguments);
            f.apply(this, arguments);
            /* eslint-enable */
          }
          : f;
      }

      if (typeof g === 'function') {
        return g;
      }
    });
  }
}

/**
 * @private
 *
 * @function compose
 *
 * @description
 * combine all functions that are functions into a single function pipeline
 *
 * @param functions the functions to compose
 * @returns the composed function
 */
export function compose(...functions: (Function | void)[]): Function | void {
  if (functions.length) {
    return functions.reduce((f: Function | void, g: Function | void) => {
      if (typeof f === 'function') {
        return typeof g === 'function'
          ? function composed() {
            // eslint-disable-next-line prefer-rest-params
            return f(g.apply(this, arguments));
          }
          : f;
      }

      if (typeof g === 'function') {
        return g;
      }
    });
  }
}

/**
 * @private
 *
 * @function findExpirationIndex
 *
 * @description
 * find the index of the expiration based on the key
 *
 * @param expirations the list of expirations
 * @param key the key to match
 * @returns the index of the expiration
 */
export function findExpirationIndex(
  expirations: Moize.Expiration[],
  key: any[],
): number {
  const { length } = expirations;

  for (let index: number = 0; index < length; index++) {
    if (expirations[index].key === key) {
      return index;
    }
  }

  return -1;
}

/**
 * @private
 *
 * @function createFindKeyIndex
 *
 * @description
 * create the method that will find the matching key index
 *
 * @param isEqual the key argument equality validator
 * @param isMatchingKey the complete key equality validator
 * @returns the function to find the key's index
 */
export function createFindKeyIndex(
  isEqual: Function,
  isMatchingKey?: Function,
) {
  const areKeysEqual =
    typeof isMatchingKey === 'function'
      ? isMatchingKey
      : function areKeysEqual(cacheKey: any[], key: any[]) {
        for (let index = 0; index < key.length; index++) {
          if (!isEqual(cacheKey[index], key[index])) {
            return false;
          }
        }

        return true;
      };

  return function findKeyIndex(keys: (any[])[], key: any[]): number {
    const keysLength = keys.length;

    for (let index = 0; index < keysLength; index++) {
      if (keys[index].length === key.length && areKeysEqual(keys[index], key)) {
        return index;
      }
    }

    return -1;
  };
}

/**
 * @private
 *
 * @function getArrayKey
 *
 * @description
 * get the key as an array if not already
 *
 * @param key the key to array-ify
 * @returns the array-ified key
 */
export function getArrayKey(key: any) {
  if (isArray(key)) {
    return key;
  }

  if (DEV && console) {
    // eslint-disable-next-line no-console
    console.warn(
      'Use of a non-array key is deprecated, please modify your transformer to return an array.',
    );
  }

  return [key];
}

/**
 * @private
 *
 * @function mergeOptions
 *
 * @description
 * merge two options objects, combining or composing functions as necessary
 *
 * @param originalOptions the options that already exist on the method
 * @param newOptions the new options to merge
 * @returns the merged options
 */
export function mergeOptions(
  originalOptions: Moize.Options,
  newOptions: Moize.Options,
) {
  if (newOptions === DEFAULT_OPTIONS) {
    return originalOptions;
  }

  return assign({}, originalOptions, newOptions, {
    onCacheAdd: combine(originalOptions.onCacheAdd, newOptions.onCacheAdd),
    onCacheChange: combine(
      originalOptions.onCacheChange,
      newOptions.onCacheChange,
    ),
    onCacheHit: combine(originalOptions.onCacheHit, newOptions.onCacheHit),
    transformArgs: compose(
      originalOptions.transformArgs,
      newOptions.transformArgs,
    ),
  });
}

/**
 * @private
 *
 * @function orderByLru
 *
 * @description
 * order the array based on a Least-Recently-Used basis
 *
 * @param keys the keys to order
 * @param newKey the new key to move to the front
 * @param values the values to order
 * @param newValue the new value to move to the front
 * @param startingIndex the index of the item to move to the front
 */
export function orderByLru(
  cache: MicroMemoize.Cache,
  newKey: MicroMemoize.Key,
  newValue: any,
  startingIndex: number,
  maxSize: number,
) {
  let index = startingIndex;

  /* eslint-disable no-param-reassign */
  while (index--) {
    cache.keys[index + 1] = cache.keys[index];
    cache.values[index + 1] = cache.values[index];
  }

  cache.keys[0] = newKey;
  cache.values[0] = newValue;

  if (startingIndex >= maxSize) {
    cache.keys.length = maxSize;
    cache.values.length = maxSize;
  }
  /* eslint-enable */
}
