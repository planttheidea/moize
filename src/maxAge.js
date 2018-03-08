// @flow

// types
import type {Cache, Expiration, Options} from './types';

// utils
import {combine, findExpirationIndex, findKeyIndex} from './utils';

export const createOnCacheAddSetExpiration: Function = (
  expirations: Array<Expiration>,
  options: Options,
  isEqual: Function
): ?Function => {
  const {maxAge, onCacheChange, onExpire} = options;

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
   * @param {Cache} cache the cache of the memoized function
   * @returns {void}
   */
  return function onCacheAdd(cache: Cache): ?Function {
    const key: any = cache.keys[0];

    if (!~findExpirationIndex(expirations, key)) {
      const expirationMethod = () => {
        const keyIndex: number = findKeyIndex(isEqual, cache.keys, key);
        const value: any = cache.values[keyIndex];

        if (~keyIndex) {
          cache.keys.splice(keyIndex, 1);
          cache.values.splice(keyIndex, 1);

          if (typeof onCacheChange === 'function') {
            onCacheChange(cache);
          }
        }

        const currentExpirationIndex = findExpirationIndex(expirations, key);

        if (~currentExpirationIndex) {
          expirations.splice(currentExpirationIndex, 1);
        }

        if (typeof onExpire === 'function' && onExpire(key) === false) {
          cache.keys.unshift(key);
          cache.values.unshift(value);

          createOnCacheAddSetExpiration(expirations, options, isEqual)(cache);

          if (typeof onCacheChange === 'function') {
            onCacheChange(cache);
          }
        }
      };

      expirations.push({
        expirationMethod,
        key,
        // $FlowIgnore maxAge is an number
        timeoutId: setTimeout(expirationMethod, maxAge)
      });
    }
  };
};

export const createOnCacheHitResetExpiration: Function = (
  expirations: Array<Expiration>,
  options: Options
): ?Function => {
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
  return function onCacheHit(cache: Cache) {
    const key: any = cache.keys[0];

    const expirationIndex: number = findExpirationIndex(expirations, key);

    if (~expirationIndex) {
      clearTimeout(expirations[expirationIndex].timeoutId);

      // $FlowIgnore options exists
      const maxAge: number = options.maxAge;

      expirations[expirationIndex].timeoutId = setTimeout(expirations[expirationIndex].expirationMethod, maxAge);
    }
  };
};

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
 * @param {function} isEqual the function to test equality
 * @returns {Object} the object of options based on the entries passed
 */
export const getMaxAgeOptions = (expirations: Array<Expiration>, options: Options, isEqual: Function): Object => {
  const {maxAge, onCacheAdd: onAdd, onCacheHit: onHit, updateExpire} = options;

  const onCacheAdd = combine(
    onAdd,
    typeof maxAge === 'number' && isFinite(maxAge) && createOnCacheAddSetExpiration(expirations, options, isEqual)
  );

  return {
    onCacheAdd,
    onCacheHit: combine(onHit, onCacheAdd && updateExpire && createOnCacheHitResetExpiration(expirations, options))
  };
};
