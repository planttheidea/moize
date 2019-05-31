import { MicroMemoize } from 'micro-memoize';

import { Cache, Moizable, Options } from './types';

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
      cache: Cache,
      _options: Options,
      memoized: MicroMemoize.Memoized<Moizable>,
    ) {
      const key: any = cache.keys[0];

      if (!~findExpirationIndex(cache, key)) {
        const expirationMethod = () => {
          const {
            _mm: { onCacheChange },
            onExpire,
          } = options;

          const keyIndex: number = cache.getKeyIndex(key);

          const { keys, values } = cache;
          const value: any = values[keyIndex];

          if (~keyIndex) {
            keys.splice(keyIndex, 1);
            values.splice(keyIndex, 1);

            if (cache.shouldUpdateOnChange) {
              onCacheChange(cache, options, memoized);
            }
          }

          clearExpiration(cache, key, true);

          if (typeof onExpire === 'function' && onExpire(key) === false) {
            keys.unshift(key);
            values.unshift(value);

            onCacheAdd(cache, options, memoized);

            if (cache.shouldUpdateOnChange) {
              onCacheChange(cache, options, memoized);
            }
          }
        };

        cache.expirations.push({
          expirationMethod,
          key,
          timeoutId: setTimeout(expirationMethod, options.maxAge),
        });
      }
    };

    if (options.updateExpire) {
      const onCacheHit = function (cache: Cache) {
        const key: any = cache.keys[0];
        const index: number = findExpirationIndex(cache, key);

        if (~index) {
          clearExpiration(cache, key, false);

          const expiration = cache.expirations[index];

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
