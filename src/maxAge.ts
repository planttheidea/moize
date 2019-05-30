import { MicroMemoize } from 'micro-memoize';

import { Cache, Options } from './types';

/**
 * @private
 *
 * @function clearExpiration
 *
 * @description
 * clear an active expiration and remove it from the list if applicable
 *
 * @param expirations the list of expirations
 * @param key the key to clear
 * @param shouldRemove should the expiration be removed from the list
 */
export function clearExpiration(cache: Cache, key: any, shouldRemove: boolean) {
  const index = findExpirationIndex(cache, key);

  if (~index) {
    const { expirations } = cache;

    clearTimeout(expirations[index].timeoutId as number);

    if (shouldRemove) {
      expirations.splice(index, 1);
    }
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
export function findExpirationIndex(cache: Cache, key: any[]): number {
  const { expirations } = cache;

  for (let index: number = 0; index < expirations.length; index++) {
    if (expirations[index].key === key) {
      return index;
    }
  }

  return -1;
}

export function getMaxAgeOptions(options: Options) {
  if (typeof options.maxAge === 'number') {
    const onCacheAdd = function (
      _cache: Cache,
      _options: Options,
      memoized: MicroMemoize.Memoized<Function>,
    ) {
      const key: any = _cache.keys[0];

      if (!~findExpirationIndex(_cache, key)) {
        const expirationMethod = () => {
          const { keys, values } = _cache;
          const { onCacheChange, onExpire } = options;

          const keyIndex: number = _cache.getKeyIndex(key);
          const value: any = values[keyIndex];

          if (~keyIndex) {
            keys.splice(keyIndex, 1);
            values.splice(keyIndex, 1);

            if (_cache.shouldUpdateOnChange) {
              onCacheChange(_cache, options, memoized);
            }
          }

          clearExpiration(_cache, key, true);

          if (typeof onExpire === 'function' && onExpire(key) === false) {
            keys.unshift(key);
            values.unshift(value);

            onCacheAdd(_cache, options, memoized);

            if (_cache.shouldUpdateOnChange) {
              onCacheChange(_cache, options, memoized);
            }
          }
        };

        _cache.expirations.push({
          expirationMethod,
          key,
          timeoutId: setTimeout(expirationMethod, options.maxAge),
        });
      }
    };

    if (options.updateExpire) {
      const onCacheHit = function (_cache: Cache) {
        const key: any = _cache.keys[0];
        const index: number = findExpirationIndex(_cache, key);

        if (~index) {
          clearExpiration(_cache, key, false);

          const expiration = _cache.expirations[index];

          expiration.timeoutId = setTimeout(expiration.expirationMethod, options.maxAge);
        }
      };

      return {
        onCacheAdd,
        onCacheHit,
      };
    }

    return { onCacheAdd };
  }

  return {};
}
