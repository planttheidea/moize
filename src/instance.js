// @flow

// stats
import {getStats} from './stats';

// types
import type {MicroMemoizeOptions, StatsProfile} from './types';

// utils
import {findKeyIndex} from './utils';

export const addInstanceMethods = (moized: Function): void => {
  const {isEqual, onCacheAdd, onCacheChange, transformKey} = moized.options;

  moized.add = (key: Array<any>, value: any): void => {
    const savedKey: Array<any> = transformKey ? transformKey(key) : key;

    if (!~findKeyIndex(isEqual, moized.cache.keys, savedKey)) {
      moized.cache.keys.unshift(savedKey);
      moized.cache.values.unshift(value);

      onCacheAdd(moized.cache);
      onCacheChange(moized.cache);
    }
  };

  moized.clear = (): void => {
    moized.cache.keys.length = 0;
    moized.cache.values.length = 0;

    onCacheChange(moized.cache);
  };

  moized.get = function(key: Array<any>): any {
    const keyIndex: number = findKeyIndex(isEqual, moized.cache.keys, transformKey ? transformKey(key) : key);

    return ~keyIndex ? moized.apply(this, moized.cache.keys[keyIndex]) : undefined; // eslint-disable-line prefer-spread
  };

  moized.getStats = (): StatsProfile => {
    const {profileName} = moized.options;

    return getStats(profileName);
  };

  moized.has = (key: Array<any>): boolean => {
    return !!~findKeyIndex(isEqual, moized.cache.keys, transformKey ? transformKey(key) : key);
  };

  moized.keys = (): Array<Array<any>> => {
    return moized.cacheSnapshot.keys;
  };

  moized.remove = (key: Array<any>): void => {
    const keyIndex: number = findKeyIndex(isEqual, moized.cache.keys, transformKey ? transformKey(key) : key);

    if (~keyIndex) {
      moized.cache.keys.splice(keyIndex, 1);
      moized.cache.values.splice(keyIndex, 1);

      onCacheChange(moized.cache);
    }
  };

  moized.values = (): Array<Array<any>> => {
    return moized.cacheSnapshot.values;
  };
};

export const addInstanceProperties = (
  moized: Function,
  {collectStats, expirations, options: moizeOptions, originalFunction}: Object
): void => {
  const cache = moized.cache;
  const microMemoizeOptions: MicroMemoizeOptions = moized.options;

  Object.defineProperties(
    moized,
    ({
      _microMemoizeOptions: {
        configurable: true,
        get() {
          return microMemoizeOptions;
        }
      },
      cache: {
        configurable: true,
        get() {
          return Object.assign({}, cache, {
            get size() {
              return cache.keys.length;
            }
          });
        }
      },
      cacheSnapshot: {
        configurable: true,
        get() {
          return {
            keys: cache.keys.slice(0),
            size: cache.keys.length,
            values: cache.values.slice(0)
          };
        }
      },
      collectStats: {
        configurable: true,
        get() {
          return collectStats;
        }
      },
      expirations: {
        configurable: true,
        get() {
          return expirations;
        }
      },
      expirationsSnapshot: {
        configurable: true,
        get() {
          return expirations.slice(0);
        }
      },
      isMoized: {
        configurable: true,
        get() {
          return true;
        }
      },
      options: {
        configurable: true,
        get() {
          return moizeOptions;
        }
      },
      originalFunction: {
        configurable: true,
        get() {
          return originalFunction;
        }
      }
    }: Object)
  );

  if (moizeOptions.isReact) {
    moized.displayName = `Moized(${originalFunction.displayName || originalFunction.name || 'Component'})`;
    moized.contextTypes = originalFunction.contextTypes;
    moized.defaultProps = originalFunction.defaultProps;
    moized.propTypes = originalFunction.propTypes;
  }
};

export const augmentMoizeInstance = (moized: Function, configuration: Object): Function => {
  addInstanceMethods(moized);
  addInstanceProperties(moized, configuration);

  return moized;
};
