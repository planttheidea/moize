import { MicroMemoize } from 'micro-memoize';

import { getStatsCache } from './stats';
import { slice } from './utils';

import { Moize } from './types';

export function createOnCacheOperation(
  fn: Moize.Handler | void,
): Moize.Handler | void {
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
      cache: Moize.Cache,
      _options: Moize.Options,
      memoized: MicroMemoize.Memoized<Moize.Moizable>,
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
export function enhanceCache(cache: Moize.Cache) {
  // @ts-ignore
  const expirations: Moize.Expirations = [];

  Object.defineProperty(expirations, 'snapshot', {
    get() {
      return slice(cache.expirations, 0);
    },
  });

  cache.expirations = expirations;
  cache.stats = getStatsCache();
}
