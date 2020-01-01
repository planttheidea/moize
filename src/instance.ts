import { clearExpiration } from './maxAge';
import { getStats, statsCache } from './stats';
import {
  Fn,
  Key,
  Memoized,
  Moizeable,
  MoizeConfiguration,
  Moized,
  Options,
  StatsProfile,
} from './types';
import { createFindKeyIndex } from './utils';

/**
 * @private
 *
 * @description
 * add methods to the moized fuction object that allow extra features
 *
 * @param memoized the memoized function from micro-memoize
 */
export function addInstanceMethods<OriginalFn extends Fn>(
  memoized: Moizeable,
  { expirations }: MoizeConfiguration<OriginalFn>
) {
  const { isEqual, isMatchingKey, onCacheAdd, onCacheChange } = memoized.options;

  const findKeyIndex: Function = createFindKeyIndex(isEqual, isMatchingKey);

  const moized = (memoized as unknown) as Moized<OriginalFn, Options>;

  moized.add = function(key: Key, value: any) {
    const { transformKey } = moized.options;

    const savedKey = transformKey ? transformKey(key) : key;

    if (!~findKeyIndex(moized.cache.keys, savedKey)) {
      if (moized.cache.size >= moized.options.maxSize) {
        moized.cache.keys.pop();
        moized.cache.values.pop();
      }

      moized.cache.keys.unshift(savedKey);
      moized.cache.values.unshift(value);

      onCacheAdd(moized.cache, moized.options, moized);
      onCacheChange(moized.cache, moized.options, moized);
    }
  };

  moized.clear = function() {
    moized.cache.keys.length = 0;
    moized.cache.values.length = 0;

    onCacheChange(moized.cache, moized.options, moized);
  };

  moized.get = function(key: Key) {
    const { transformKey } = moized.options;

    const keyIndex = findKeyIndex(moized.cache.keys, transformKey ? transformKey(key) : key);

    return keyIndex !== -1 ? moized.apply(this, moized.cache.keys[keyIndex]) : undefined;
  };

  moized.getStats = function(): StatsProfile {
    return getStats(moized.options.profileName);
  };

  moized.has = function(key: Key) {
    const { transformKey } = moized.options;

    return findKeyIndex(moized.cache.keys, transformKey ? transformKey(key) : key) !== -1;
  };

  moized.keys = function() {
    return moized.cacheSnapshot.keys;
  };

  moized.remove = function(key: Key) {
    const {
      cache,
      options: { transformKey },
    } = moized;

    const keyIndex: number = findKeyIndex(cache.keys, transformKey ? transformKey(key) : key);

    if (keyIndex !== -1) {
      const existingKey: Array<any> = cache.keys[keyIndex];

      cache.keys.splice(keyIndex, 1);
      cache.values.splice(keyIndex, 1);

      onCacheChange(cache, moized.options, moized);

      clearExpiration(expirations, existingKey, true);
    }
  };

  moized.update = function(key: Key, value: any) {
    const {
      cache,
      options: { transformKey },
    } = moized;

    const keyIndex = findKeyIndex(cache.keys, transformKey ? transformKey(key) : key);

    if (keyIndex !== -1) {
      const existingKey: Array<any> = cache.keys[keyIndex];

      cache.orderByLru(cache.keys, existingKey, keyIndex);
      cache.orderByLru(cache.values, value, keyIndex);

      onCacheChange(cache, moized.options, moized);
    }
  };

  moized.values = function() {
    return moized.cacheSnapshot.values;
  };
}

/**
 * @private
 *
 * @description
 * add propeties to the moized fuction object that surfaces extra information
 *
 * @param memoized the memoized function
 * @param expirations the list of expirations for cache items
 * @param options the options passed to the moizer
 * @param originalFunction the function that is being memoized
 */
export function addInstanceProperties<OriginalFn extends Moizeable>(
  memoized: Memoized<OriginalFn>,
  { expirations, options: moizeOptions, originalFunction }: MoizeConfiguration<OriginalFn>
) {
  const { options: microMemoizeOptions } = memoized;

  Object.defineProperties(memoized, {
    _microMemoizeOptions: {
      configurable: true,
      get() {
        return microMemoizeOptions;
      },
    },

    expirations: {
      configurable: true,
      get() {
        return expirations;
      },
    },

    expirationsSnapshot: {
      configurable: true,
      get() {
        return expirations.slice(0);
      },
    },

    isCollectingStats: {
      configurable: true,
      get() {
        return statsCache.isCollectingStats;
      },
    },

    isMoized: {
      configurable: true,
      get() {
        return true;
      },
    },

    options: {
      configurable: true,
      get() {
        return moizeOptions;
      },
    },

    originalFunction: {
      configurable: true,
      get() {
        return originalFunction;
      },
    },
  });

  const moized = (memoized as unknown) as Moized<OriginalFn, Options>;

  if (moizeOptions.isReact) {
    moized.contextTypes = originalFunction.contextTypes;
    moized.defaultProps = originalFunction.defaultProps;
    moized.displayName = `Moized(${originalFunction.displayName ||
      originalFunction.name ||
      'Component'})`;
    moized.propTypes = originalFunction.propTypes;
  }
}

/**
 * @private
 *
 * @description
 * add methods and properties to the memoized function for more features
 *
 * @param memoized the memoized function
 * @param configuration the configuration object for the instance
 * @returns the memoized function passed
 */
export function createMoizeInstance<OriginalFn extends Moizeable, CombinedOptions extends Options>(
  memoized: Memoized<OriginalFn>,
  configuration: MoizeConfiguration<OriginalFn>
) {
  addInstanceMethods<OriginalFn>(memoized, configuration);
  addInstanceProperties<OriginalFn>(memoized, configuration);

  return memoized as Moized<OriginalFn, CombinedOptions>;
}
