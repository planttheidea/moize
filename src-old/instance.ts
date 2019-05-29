// external dependencies
// eslint-disable-next-line no-unused-vars
import { MicroMemoize } from 'micro-memoize';

// maxAge
import { clearExpiration } from './maxAge';

// stats
import { getStats as _getStats, statsCache } from './stats';

// utils
import { createFindKeyIndex, orderByLru } from './utils';

const { isArray } = Array;

export interface ExtendedMemoized extends MicroMemoize.Memoized {
  add: (key: any[], value: any) => boolean;
  clear: () => void;
  contextTypes?: Object;
  defaultProps?: Object;
  displayName?: string;
  get: (key: any[]) => any;
  getStats: () => Moize.StatsObject;
  has: (key: any[]) => boolean;
  keys: () => any[];
  propTypes?: Object;
  remove: (key: any[]) => boolean;
  update: (key: any[], value: any) => boolean;
  values: () => any[];
}

/**
 * @private
 *
 * @function addInstanceMethods
 *
 * @description
 * add methods to the memoized fuction object that allow extra features
 *
 * @param memoized the memoized function
 */
export function addInstanceMethods(
  memoized: MicroMemoize.Memoized,
  { expirations, options }: Moize.AugmentationOptions,
) {
  const {
    isEqual,
    isMatchingKey,
    maxSize,
    onCacheAdd,
    onCacheChange,
    transformKey,
  } = memoized.options;

  const findKeyIndex: Function = createFindKeyIndex(isEqual, isMatchingKey);

  /* eslint-disable no-param-reassign */

  memoized.add = function add(key: any[], value: any) {
    if (!isArray(key)) {
      throw new TypeError('The key passed needs to be an array.');
    }

    const savedKey = transformKey ? transformKey(key) : key;
    const keyIndex = findKeyIndex(memoized.cache.keys, savedKey);

    if (!~keyIndex) {
      if (memoized.cache.size >= memoized.options.maxSize) {
        memoized.cache.keys.pop();
        memoized.cache.values.pop();
      }

      memoized.cache.keys.unshift(savedKey);
      memoized.cache.values.unshift(value);

      if (onCacheAdd) {
        onCacheAdd(memoized.cache, memoized.options, memoized);
      }

      if (onCacheChange) {
        onCacheChange(memoized.cache, memoized.options, memoized);
      }
    }

    return !~keyIndex;
  };

  memoized.clear = function clear() {
    memoized.cache.keys.length = 0;
    memoized.cache.values.length = 0;

    if (onCacheChange) {
      onCacheChange(memoized.cache, memoized.options, memoized);
    }
  };

  memoized.get = function get(key: any[]) {
    const keyIndex: number = findKeyIndex(
      memoized.cache.keys,
      transformKey ? transformKey(key) : key,
    );

    return ~keyIndex
      ? memoized.apply(this, memoized.cache.keys[keyIndex])
      : undefined;
  };

  memoized.getStats = function getStats() {
    const { profileName } = options;

    return _getStats(profileName);
  };

  memoized.has = function has(key: any[]) {
    return !!~findKeyIndex(
      memoized.cache.keys,
      transformKey ? transformKey(key) : key,
    );
  };

  memoized.keys = function keys(): (any[])[] {
    return memoized.cacheSnapshot.keys;
  };

  memoized.remove = function remove(key: any[]) {
    const keyIndex: number = findKeyIndex(
      memoized.cache.keys,
      transformKey ? transformKey(key) : key,
    );

    if (~keyIndex) {
      const existingKey: any[] = memoized.cache.keys[keyIndex];

      memoized.cache.keys.splice(keyIndex, 1);
      memoized.cache.values.splice(keyIndex, 1);

      if (onCacheChange) {
        onCacheChange(memoized.cache, memoized.options, memoized);
      }

      clearExpiration(expirations, existingKey, true);
    }

    return !!~keyIndex;
  };

  memoized.update = function update(key: any[], value: any) {
    const keyIndex = findKeyIndex(
      memoized.cache.keys,
      transformKey ? transformKey(key) : key,
    );

    if (~keyIndex) {
      const existingKey: any[] = memoized.cache.keys[keyIndex];

      orderByLru(memoized.cache, existingKey, value, keyIndex, maxSize);

      if (onCacheChange) {
        onCacheChange(memoized.cache, memoized.options, memoized);
      }
    }

    return !!~keyIndex;
  };

  memoized.values = function value() {
    return memoized.cacheSnapshot.values;
  };

  /* eslint-enable */
}

/**
 * @private
 *
 * @function addInstanceMethods
 *
 * @description
 * add propeties to the memoized fuction object that surfaces extra information
 *
 * @modifies {memoized}
 *
 * @param memoized the memoized function
 * @param expirations the list of expirations for cache items
 * @param options the options passed to the moizer
 * @param originalFunction the function that is being memoized
 */
export function addInstanceProperties(
  memoized: MicroMemoize.Memoized,
  { expirations, options, originalFunction }: Moize.AugmentationOptions,
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
        return options;
      },
    },
    originalFunction: {
      configurable: true,
      get() {
        return originalFunction;
      },
    },
  });

  if (options.isReact) {
    /* eslint-disable no-param-reassign */
    memoized.contextTypes = originalFunction.contextTypes;
    memoized.defaultProps = originalFunction.defaultProps;
    memoized.displayName = `Moized(${originalFunction.displayName ||
      originalFunction.name ||
      'Component'})`;
    memoized.propTypes = originalFunction.propTypes;
    /* eslint-enable */
  }
}

/**
 * @private
 *
 * @function augmentInstance
 *
 * @description
 * add methods and properties to the memoized function for more features
 *
 * @param memoized the memoized function
 * @param augmentationOptions the configuration object for the instance
 * @returns the memoized function passed
 */
export function augmentInstance(
  memoized: MicroMemoize.Memoized,
  augmentationOptions: Moize.AugmentationOptions,
): Moize.Moized {
  addInstanceMethods(memoized, augmentationOptions);
  addInstanceProperties(memoized, augmentationOptions);

  return (memoized as unknown) as Moize.Moized;
}
