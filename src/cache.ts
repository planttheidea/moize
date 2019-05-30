import { MicroMemoize } from 'micro-memoize';

import { statsCache } from './stats';
import { slice } from './utils';

import { Cache, Expirations, Handler, Options } from './types';

export function createOnCacheOperation(fn: Handler | void): Handler | void {
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
      cache: Cache,
      _options: Options,
      memoized: MicroMemoize.Memoized<Function>,
    ) {
      return fn(cache, memoized.options, memoized);
    };
  }
}

export function enhanceCache(cache: Cache) {
  // @ts-ignore
  const expirations: Expirations = [];

  Object.defineProperty(expirations, 'snapshot', {
    get() {
      return slice(cache.expirations, 0);
    },
  });

  cache.expirations = expirations;
  cache.stats = statsCache;

  return cache;
}
