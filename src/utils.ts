// external dependencies
// eslint-disable-next-line no-unused-vars
import { MicroMemoize } from 'micro-memoize';

// constants
import { DEFAULT_OPTIONS } from './constants';

const { isArray } = Array;
const { hasOwnProperty } = Object.prototype;

export function assignFallback(target: any) {
  /* eslint-disable prefer-rest-params */
  if (arguments.length < 2) {
    return target;
  }

  const { length } = arguments;

  for (let index = 1, source; index < length; index++) {
    source = arguments[index];

    if (source && typeof source === 'object') {
      for (const key in source) {
        if (hasOwnProperty.call(source, key)) {
          // eslint-disable-next-line no-param-reassign
          target[key] = source[key];
        }
      }
    }
  }

  return target;
  /* eslint-enable */
}

export const assign = typeof Object.assign === 'function' ? Object.assign : assignFallback;

export function combine(...functions: (Function | void)[]): Function | void {
  if (functions.length) {
    return functions.reduce((f: (Function | void), g: (Function | void)) => {
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

export function compose(...functions: (Function | void)[]): Function | void {
  if (functions.length) {
    return functions.reduce((f: (Function | void), g: (Function | void)) => {
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
 * @param {Array<Expiration>} expirations the list of expirations
 * @param {Array<any>} key the key to match
 * @returns {number} the index of the expiration
 */
export function findExpirationIndex(expirations: Moize.Expiration[], key: any[]): number {
  const { length } = expirations;

  for (let index: number = 0; index < length; index++) {
    if (expirations[index].key === key) {
      return index;
    }
  }

  return -1;
}

export function createFindKeyIndex(isEqual: Function, isMatchingKey?: Function) {
  const areKeysEqual = typeof isMatchingKey === 'function'
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

export function getArrayKey(key: any) {
  return isArray(key) ? key : [];
}

/**
 * @private
 *
 * @function mergeOptions
 *
 * @description
 * merge two options objects, combining or composing functions as necessary
 *
 * @param {Options} originalOptions the options that already exist on the method
 * @param {Options} newOptions the new options to merge
 * @returns {Options} the merged options
 */
export function mergeOptions(originalOptions: Moize.Options, newOptions: Moize.Options) {
  if (newOptions === DEFAULT_OPTIONS) {
    return originalOptions;
  }

  return assign({}, originalOptions, newOptions, {
    onCacheAdd: combine(originalOptions.onCacheAdd, newOptions.onCacheAdd),
    onCacheChange: combine(originalOptions.onCacheChange, newOptions.onCacheChange),
    onCacheHit: combine(originalOptions.onCacheHit, newOptions.onCacheHit),
    transformArgs: compose(
      originalOptions.transformArgs,
      newOptions.transformArgs,
    ),
  });
}

/**
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
