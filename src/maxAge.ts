// utils
import {
  createFindKeyIndex,
  findExpirationIndex,
} from './utils';

/**
 * @private
 *
 * @function clearExpiration
 *
 * @description
 * clear an active expiration and remove it from the list if applicable
 *
 * @param {Array<Expiration>} expirations the list of expirations
 * @param {any} key the key to clear
 * @param {boolean} [shouldRemove] should the expiration be removed from the list
 */
export function clearExpiration(expirations: Moize.Expiration[], key: any, shouldRemove: boolean) {
  const expirationIndex = findExpirationIndex(expirations, key);

  if (~expirationIndex) {
    clearTimeout(expirations[expirationIndex].timeoutId as number);

    if (shouldRemove) {
      expirations.splice(expirationIndex, 1);
    }
  }
}

export function createOnCacheAddSetExpiration(
  expirations: Moize.Expiration[],
  options: Moize.Options,
  isEqual: Function,
  isMatchingKey?: Function,
) {
  const { maxAge, onCacheChange, onExpire } = options;

  const findKeyIndex = createFindKeyIndex(isEqual, isMatchingKey);

  /**
   * @private
   *
   * @function onCacheAdd
   *
   * @description
   * when an item is added to the cache, add an expiration for it
   *
   * @modifies {expirations}
   *
   * @param cache the cache of the memoized function
   * @param moizedOptions the options passed to the memoized function
   * @param moized the memoized function
   */
  return function onCacheAdd(cache: Moize.Cache, moizedOptions: Moize.Options, moized: Function) {
    const key: any = cache.keys[0];

    if (!~findExpirationIndex(expirations, key)) {
      const expirationMethod = () => {
        const keyIndex: number = findKeyIndex(cache.keys, key);
        const value: any = cache.values[keyIndex];

        if (~keyIndex) {
          cache.keys.splice(keyIndex, 1);
          cache.values.splice(keyIndex, 1);

          if (typeof onCacheChange === 'function') {
            onCacheChange(cache, moizedOptions, moized);
          }
        }

        clearExpiration(expirations, key, true);

        if (typeof onExpire === 'function' && onExpire(key) === false) {
          cache.keys.unshift(key);
          cache.values.unshift(value);

          createOnCacheAddSetExpiration(expirations, options, isEqual)(
            cache,
            moizedOptions,
            moized,
          );

          if (typeof onCacheChange === 'function') {
            onCacheChange(cache, moizedOptions, moized);
          }
        }
      };

      expirations.push({
        expirationMethod,
        key,
        timeoutId: setTimeout(expirationMethod, maxAge),
      });
    }
  };
}

export function createOnCacheHitResetExpiration(
  expirations: Moize.Expiration[],
  options: Moize.Options,
) {
  const { maxAge } = options;

  /**
   * @private
   *
   * @function onCacheHit
   *
   * @description
   * when a cache item is hit, reset the expiration
   *
   * @modifies {expirations}
   *
   * @param {Cache} cache the cache of the memoized function
   * @returns {void}
   */
  return function onCacheHit(cache: Moize.Cache) {
    const key: any = cache.keys[0];
    const expirationIndex: number = findExpirationIndex(expirations, key);

    if (~expirationIndex) {
      clearExpiration(expirations, key, false);

      // eslint-disable-next-line no-param-reassign
      expirations[expirationIndex].timeoutId = setTimeout(
        expirations[expirationIndex].expirationMethod,
        maxAge,
      );
    }
  };
}

/**
 * @private
 *
 * @function getMaxAgeOptions
 *
 * @description
 * get the micro-memoize options specific to the maxAge option
 *
 * @param {Array<Expiration>} expirations the expirations for the memoized function
 * @param {Options} options the options passed to the moizer
 * @param {function} isEqual the function to test equality of the key on a per-argument basis
 * @param {function} isMatchingKey the function to test equality of the whole key
 * @returns {Object} the object of options based on the entries passed
 */
export function getMaxAgeOptions(
  expirations: Moize.Expiration[],
  options: Moize.Options,
  isEqual: Function,
  isMatchingKey?: Function,
) {
  const { maxAge, updateExpire } = options;

  let onCacheAdd;
  let onCacheHit;

  // eslint-disable-next-line no-restricted-globals
  if (typeof maxAge === 'number' && isFinite(maxAge)) {
    onCacheAdd = createOnCacheAddSetExpiration(expirations, options, isEqual, isMatchingKey);
  }

  if (onCacheAdd && updateExpire) {
    onCacheHit = createOnCacheHitResetExpiration(expirations, options);
  }


  return {
    onCacheAdd,
    onCacheHit,
  };
}
