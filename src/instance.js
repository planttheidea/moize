// @flow

// types
import type {Expiration, MicroMemoizeOptions, Options} from './types';

// utils
import {findKeyIndex} from './utils';

export const addInstanceMethods = (moized: Function): void => {
  const {isEqual, transformKey} = moized.options;

  moized.add = (key: Array<any>, value: any): void => {
    const savedKey: Array<any> = transformKey ? transformKey(key) : key;

    if (!~findKeyIndex(isEqual, moized.cache.keys, savedKey)) {
      moized.cache.keys.unshift(savedKey);
      moized.cache.values.unshift(value);
    }
  };

  moized.clear = (): void => {
    moized.cache.keys.length = 0;
    moized.cache.values.length = 0;
  };

  moized.get = (key: Array<any>): any => {
    const keyIndex: number = findKeyIndex(isEqual, moized.cache.keys, transformKey ? transformKey(key) : key);

    return ~keyIndex ? moized.cache.values[keyIndex] : undefined;
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
    }
  };

  moized.values = (): Array<Array<any>> => {
    return moized.cacheSnapshot.values;
  };
};

export const addInstanceProperties = (
  moized: Function,
  moizeOptions: Options,
  expirations: Array<Expiration>,
  originalFunction: Function
): void => {
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

export const augmentMoizeInstance = (moized: Function, {expirations, options, originalFunction}: Object): Function => {
  addInstanceMethods(moized);
  addInstanceProperties(moized, options, expirations, originalFunction);

  return moized;
};
