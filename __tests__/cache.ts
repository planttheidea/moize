import { MicroMemoize } from 'micro-memoize';

import { createOnCacheOperation, enhanceCache } from '../src/cache';
import moize from '../src';
import { getStatsCache } from '../src/stats';
import { Cache } from '../src/types';

describe('createOnCacheOperation', () => {
  it('should return undefined when fn is not a function', () => {
    const fn: void = undefined;

    const result = createOnCacheOperation(fn);

    expect(result).toBe(undefined);
  });

  it('should call the fn passed with the cache, options, and memoized function', () => {
    const _cache = {
      keys: [],
      size: 0,
      values: [],
    } as MicroMemoize.Cache;
    const _microMemoizeOptions: MicroMemoize.Options = {};

    const fn = jest.fn();

    const onCacheOperation = createOnCacheOperation(fn);

    if (typeof onCacheOperation !== 'function') {
      throw new TypeError('should be a function');
    }

    const memoized = moize(jest.fn());

    onCacheOperation(_cache, _microMemoizeOptions, memoized);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(_cache, memoized.options, memoized);
  });
});

describe('enhanceCache', () => {
  it('should add the expirations and stats to the cache', () => {
    const cache = {} as Cache;

    enhanceCache(cache);

    expect(cache.expirations).toEqual([]);
    expect(cache.expirations.snapshot).toEqual([]);
    expect(cache.stats).toBe(getStatsCache());
  });
});
