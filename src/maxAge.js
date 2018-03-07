// @flow

// types
import type {Expiration, Options} from './types';

// utils
import {combine, findExpirationIndex, findKeyIndex} from './utils';

export const createOnCacheChangeSetExpiration: Function = (
  expirations: Array<Expiration>,
  options: Options,
  isEqual: Function
): ?Function => {
  const {maxAge, onExpire} = options;

  return function onCacheChange(cache: Object): ?Function {
    const key: any = cache.keys[0];

    if (~findExpirationIndex(expirations, key)) {
      return;
    }

    const expirationMethod = () => {
      const keyIndex: number = findKeyIndex(isEqual, cache.keys, key);
      const value: any = cache.values[keyIndex];

      if (~keyIndex) {
        cache.keys.splice(keyIndex, 1);
        cache.values.splice(keyIndex, 1);
      }

      const currentExpirationIndex = findExpirationIndex(expirations, key);

      if (~currentExpirationIndex) {
        expirations.splice(currentExpirationIndex, 1);
      }

      if (typeof onExpire === 'function' && onExpire(key) === false) {
        cache.keys.unshift(key);
        cache.values.unshift(value);

        createOnCacheChangeSetExpiration(expirations, options, isEqual)(cache);
      }
    };

    expirations.push({
      expirationMethod,
      key,
      // $FlowIgnore maxAge is an number
      timeoutId: setTimeout(expirationMethod, maxAge)
    });
  };
};

export const createOnCacheHitResetExpiration: Function = (
  expirations: Array<Expiration>,
  options: Options
): ?Function => {
  /**
   * @function onCacheHit
   *
   * @description
   * when a cache item is hit, reset the expiration
   *
   * @param {Object} cache the cache object
   * @returns {void}
   */
  return function onCacheHit(cache: Object) {
    const key: any = cache.keys[0];

    const expirationIndex: number = findExpirationIndex(expirations, key);

    if (!~expirationIndex) {
      return;
    }

    clearTimeout(expirations[expirationIndex].timeoutId);

    // $FlowIgnore options exists
    const maxAge: number = options.maxAge;

    expirations[expirationIndex].timeoutId = setTimeout(expirations[expirationIndex].expirationMethod, maxAge);
  };
};

export const getMaxAgeOptions = (expirations: Array<Expiration>, options: Options, isEqual: Function): Object => {
  const {maxAge, onCacheChange: onChange, onCacheHit: onHit, updateExpire} = options;

  let onCacheChange, onCacheHit;

  if (typeof maxAge === 'number' && isFinite(maxAge)) {
    const onCacheChangeSetExpiration = createOnCacheChangeSetExpiration(expirations, options, isEqual);

    onCacheChange =
      typeof onChange === 'function' ? combine(onChange, onCacheChangeSetExpiration) : onCacheChangeSetExpiration;
  }

  if (onCacheChange && updateExpire) {
    const onCacheHitResetExpiration = createOnCacheHitResetExpiration(expirations, options);

    onCacheHit = typeof onHit === 'function' ? combine(onHit, onCacheHitResetExpiration) : onCacheHitResetExpiration;
  }

  return {
    onCacheChange,
    onCacheHit
  };
};
