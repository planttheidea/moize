import * as Types from './types';
import { isValidNumericOption } from './utils';

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
export function clearExpiration(
  cache: Types.Cache,
  key: any,
  shouldRemove: boolean,
) {
  const index = findExpirationIndex(cache, key);

  if (index !== -1) {
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
export function findExpirationIndex(cache: Types.Cache, key: any[]) {
  const { expirations } = cache;

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
 * @function getMaxAgeOptions
 *
 * @description
 * get the options specific to the maxAge parameter
 *
 * @param options the options for the moize instance
 * @returns the options specific to maxAge
 */
export function getMaxAgeOptions(options: Types.Options) {
  if (typeof options.maxAge === 'number' && options.maxAge !== Infinity) {
    if (!isValidNumericOption(options.maxAge)) {
      throw new Error('The maxAge option must be a non-negative integer.');
    }

    const onCacheAdd = function (
      cache: Types.Cache,
      _options: Types.Options,
      memoized: Types.Moized<Types.Moizeable>,
    ) {
      const key = cache.keys[0];

      if (findExpirationIndex(cache, key) === -1) {
        const expirationMethod = () => {
          const {
            _mm: { onCacheChange },
            onExpire,
          } = options;

          const keyIndex = cache.getKeyIndex(key);

          const { keys, values } = cache;
          const value = values[keyIndex];

          if (keyIndex !== -1) {
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
      const onCacheHit = function (cache: Types.Cache) {
        const key = cache.keys[0];
        const index = findExpirationIndex(cache, key);

        if (index !== -1) {
          clearExpiration(cache, key, false);

          const expiration = cache.expirations[index];

          expiration.timeoutId = setTimeout(
            expiration.expirationMethod,
            options.maxAge,
          );
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
