import { getStatsCache } from './stats';
import * as Types from './types';

export function createOnCacheOperation(
  fn: Types.CacheHandler | void,
): Types.CacheHandler | void {
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
      cache: Types.Cache,
      _options: Types.Options,
      memoized: Types.Moized<Types.Moizeable>,
    ) {
      return fn(cache, memoized.options, memoized);
    };
  }
}

/**
 * @private
 *
 * @function enhanceCache
 *
 * @description
 * enhance the provided cache with the extra values
 *
 * @param cache the cache to enhance
 */
export function enhanceCache(cache: Types.Cache) {
  // @ts-ignore
  const expirations: Types.Expirations = [];

  Object.defineProperty(expirations, 'snapshot', {
    get() {
      return [...cache.expirations];
    },
  });

  cache.expirations = expirations;
  cache.stats = getStatsCache();
}
