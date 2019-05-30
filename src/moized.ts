import memoize, { MicroMemoize } from 'micro-memoize';

import { getStats } from './stats';

import { Options } from './types';

export function createMoized<Fn extends Function>(
  fn: Fn,
  options: Options,
  microMemoizeOptions: MicroMemoize.Options,
) {
  const moized = memoize(fn, microMemoizeOptions);

  const { cache } = moized;

  /* eslint-disable func-names */

  moized.clear = function () {
    cache.keys.length = 0;
    cache.values.length = 0;

    if (cache.shouldUpdateOnChange) {
      microMemoizeOptions.onCacheChange(cache, options, moized);
    }

    return true;
  };

  moized.delete = function (key: MicroMemoize.Key) {
    if (cache.canTransformKey) {
      key = microMemoizeOptions.transformKey(key);
    }

    const keyIndex = moized.cache.getKeyIndex(key);

    if (~keyIndex) {
      cache.keys.splice(keyIndex, 1);
      cache.values.splice(keyIndex, 1);

      return true;
    }

    return false;
  };

  moized.get = function (key: MicroMemoize.Key) {
    if (cache.canTransformKey) {
      key = microMemoizeOptions.transformKey(key);
    }

    const keyIndex = cache.getKeyIndex(key);

    if (~keyIndex) {
      return cache.values[keyIndex];
    }
  };

  moized.getStats = function () {
    return getStats(options.profileName);
  };

  moized.has = function (key: MicroMemoize.Key) {
    if (cache.canTransformKey) {
      key = microMemoizeOptions.transformKey(key);
    }

    return !!~cache.getKeyIndex(key);
  };

  moized.keys = function () {
    return cache.snapshot.keys;
  };

  moized.set = function (key: MicroMemoize.Key, value: MicroMemoize.Value) {
    if (cache.canTransformKey) {
      key = microMemoizeOptions.transformKey(key);
    }

    // eslint-disable-next-line prefer-spread
    moized.apply(null, key);

    cache.values[0] = value;

    return true;
  };

  moized.values = function () {
    return cache.snapshot.values;
  };

  /* eslint-enable */

  return moized;
}
