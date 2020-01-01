import { DEFAULT_OPTIONS } from './constants';
import { Expiration, Fn, IsEqual, IsMatchingKey, Key, Moizeable, Moized, Options } from './types';

/**
 * @private
 *
 * @description
 * method to combine functions and return a single function that fires them all
 *
 * @param functions the functions to compose
 * @returns the composed function
 */
export function combine<Arg, Result>(...functions: Fn<Arg>[]): Fn<Arg, Result> | undefined {
  if (functions.length) {
    return functions.reduce(function(f: any, g: any) {
      if (typeof f === 'function') {
        return typeof g === 'function'
          ? function(this: any) {
              f.apply(this, arguments);
              g.apply(this, arguments);
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
 * @description
 * method to compose functions and return a single function
 *
 * @param functions the functions to compose
 * @returns the composed function
 */
export function compose<Arg, Result>(...functions: Fn<Arg>[]): Fn<Arg, Result> {
  if (functions.length) {
    return functions.reduce(function(f: any, g: any) {
      if (typeof f === 'function') {
        return typeof g === 'function'
          ? function(this: any) {
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
 * @description
 * find the index of the expiration based on the key
 *
 * @param expirations the list of expirations
 * @param key the key to match
 * @returns the index of the expiration
 */
export function findExpirationIndex(expirations: Expiration[], key: Key) {
  for (let index = 0; index < expirations.length; index++) {
    if (expirations[index].key === key) {
      return index;
    }
  }

  return -1;
}

/**
 * @private
 *
 * @description
 * create function that finds the index of the key in the list of cache keys
 *
 * @param isEqual the function to test individual argument equality
 * @param isMatchingKey the function to test full key equality
 * @returns the function that finds the index of the key
 */
export function createFindKeyIndex(isEqual: IsEqual, isMatchingKey: IsMatchingKey | undefined) {
  const areKeysEqual: IsMatchingKey =
    typeof isMatchingKey === 'function'
      ? isMatchingKey
      : function(cacheKey: Key, key: Key) {
          for (let index = 0; index < key.length; index++) {
            if (!isEqual(cacheKey[index], key[index])) {
              return false;
            }
          }

          return true;
        };

  return function(keys: Key[], key: Key) {
    for (let keysIndex = 0; keysIndex < keys.length; keysIndex++) {
      if (keys[keysIndex].length === key.length && areKeysEqual(keys[keysIndex], key)) {
        return keysIndex;
      }
    }

    return -1;
  };
}

/**
 * @private
 *
 * @description
 * return the transformed key as an array
 *
 * @param key the transformed key
 * @returns the key as an array
 */
export function getArrayKey<Key>(key: Key): Key | Key[] {
  return Array.isArray(key) ? key : [key];
}

/**
 * @private
 *
 * @description
 * merge two options objects, combining or composing functions as necessary
 *
 * @param originalOptions the options that already exist on the method
 * @param newOptions the new options to merge
 * @returns the merged options
 */
export function mergeOptions(originalOptions: Options, newOptions: Options): Options {
  return newOptions === DEFAULT_OPTIONS
    ? originalOptions
    : {
        ...originalOptions,
        ...newOptions,
        onCacheAdd: combine(originalOptions.onCacheAdd, newOptions.onCacheAdd),
        onCacheChange: combine(originalOptions.onCacheChange, newOptions.onCacheChange),
        onCacheHit: combine(originalOptions.onCacheHit, newOptions.onCacheHit),
        transformArgs: compose(originalOptions.transformArgs, newOptions.transformArgs),
      };
}

export function isMoized(fn: Moizeable | Moized | Options): fn is Moized {
  return typeof fn === 'function' && fn.isMoized;
}
