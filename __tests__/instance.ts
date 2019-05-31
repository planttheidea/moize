/* globals afterEach,beforeEach,describe,expect,it,jest */

// test
// eslint-disable-next-line no-unused-vars
import memoize, { MicroMemoize } from 'micro-memoize';

// src
import {
  createMoized,
} from '../src/moized';
import { getTransformKey } from '../src/options';
import { getUsagePercentage, statsCache } from '../src/stats';

const isStrictEqual = (a: any, b: any) => a === b;

const { hasOwnProperty } = Object.prototype;

describe('addInstanceMethods', () => {
  it('should add functions to the moized object', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    moized.options = {};

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction: () => {},
    };

    addInstanceMethods(moized, configuration);

    expect(typeof moized.add).toBe('function');
    expect(typeof moized.clear).toBe('function');
    expect(typeof moized.get).toBe('function');
    expect(typeof moized.getStats).toBe('function');
    expect(typeof moized.has).toBe('function');
    expect(typeof moized.keys).toBe('function');
    expect(typeof moized.remove).toBe('function');
    expect(typeof moized.values).toBe('function');
  });

  it('should not call onExpire for removed cache items', async () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.options = {
      isEqual: isStrictEqual,
      maxAge: 1000,
      transformKey(_key: any[]) {
        return _key;
      },
    };

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    const expirationMethod = jest.fn();

    const configuration = {
      expirations: [
        {
          expirationMethod,
          key,
          timeoutId: setTimeout(expirationMethod, moized.options.maxAge),
        },
      ],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    await new Promise((resolve: Function) => {
      setTimeout(resolve, 200);
    });

    moized.remove(key);

    await new Promise((resolve: Function) => {
      setTimeout(resolve, moized.options.maxAge);
    });

    expect(expirationMethod).toHaveBeenCalledTimes(0);
  });
});

describe('addInstanceProperties', () => {
  it('should add the correct properties to the moized method', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};
    const options: Moize.AugmentationOptions = {
      expirations: [],
      options: {
        key: 'value',
      },
      originalFunction() {},
    };

    const _microMemoizeOptions: MicroMemoize.Options = {
      micro: 'memoize',
    };
    const cache: Moize.Cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.cache = cache;
    moized.options = _microMemoizeOptions;

    addInstanceProperties(moized, options);

    expect(moized._microMemoizeOptions).toBe(_microMemoizeOptions);
    expect(moized.cache).toEqual(cache);
    expect(moized.expirations).toBe(options.expirations);
    expect(moized.expirationsSnapshot).not.toBe(options.expirations);
    expect(moized.expirationsSnapshot).toEqual(options.expirations);
    expect(moized.isCollectingStats).toBe(statsCache.isCollectingStats);
    expect(moized.isMoized).toBe(true);
    expect(moized.options).toBe(options.options);
    expect(moized.originalFunction).toBe(options.originalFunction);

    expect(hasOwnProperty.call(moized, 'displayName')).toBe(false);
    expect(hasOwnProperty.call(moized, 'contextTypes')).toBe(false);
    expect(hasOwnProperty.call(moized, 'defaultProps')).toBe(false);
    expect(hasOwnProperty.call(moized, 'propTypes')).toBe(false);
  });

  it('should add the correct properties to the moized React method', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};
    const options: Moize.AugmentationOptions = {
      expirations: [],
      options: {
        isReact: true,
        key: 'value',
      },
      originalFunction() {},
    };

    options.originalFunction.contextTypes = 'contextTypes';
    options.originalFunction.defaultProps = 'defaultProps';
    options.originalFunction.displayName = 'displayName';
    options.originalFunction.propTypes = 'propTypes';

    const _microMemoizeOptions = {
      micro: 'memoize',
    };
    const cache: Moize.Cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.cache = cache;
    moized.cacheSnapshot = { ...cache };
    moized.options = _microMemoizeOptions;

    addInstanceProperties(moized, options);

    expect(moized._microMemoizeOptions).toBe(_microMemoizeOptions);
    expect(moized.cache).toEqual(cache);
    expect(moized.expirations).toBe(options.expirations);
    expect(moized.expirationsSnapshot).not.toBe(options.expirations);
    expect(moized.expirationsSnapshot).toEqual(options.expirations);
    expect(moized.isCollectingStats).toBe(statsCache.isCollectingStats);
    expect(moized.isMoized).toBe(true);
    expect(moized.options).toBe(options.options);
    expect(moized.originalFunction).toBe(options.originalFunction);

    expect(hasOwnProperty.call(moized, 'contextTypes')).toBe(true);
    expect(moized.contextTypes).toBe(options.originalFunction.contextTypes);

    expect(hasOwnProperty.call(moized, 'defaultProps')).toBe(true);
    expect(moized.defaultProps).toBe(options.originalFunction.defaultProps);

    expect(hasOwnProperty.call(moized, 'displayName')).toBe(true);
    expect(moized.displayName).toBe(
      `Moized(${options.originalFunction.displayName})`,
    );

    expect(hasOwnProperty.call(moized, 'propTypes')).toBe(true);
    expect(moized.propTypes).toBe(options.originalFunction.propTypes);
  });

  it('should add the correct displayName when none is provided', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};
    const options: Moize.AugmentationOptions = {
      expirations: [],
      options: {
        isReact: true,
        key: 'value',
      },
      originalFunction() {},
    };

    const _microMemoizeOptions = {
      micro: 'memoize',
    };
    const cache: Moize.Cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.cache = cache;
    moized.options = _microMemoizeOptions;

    addInstanceProperties(moized, options);

    expect(hasOwnProperty.call(moized, 'displayName')).toBe(true);
    expect(moized.displayName).toBe(`Moized(${options.originalFunction.name})`);
  });

  it('should add the correct displayName when the function is anonymous', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};
    const options: Moize.AugmentationOptions = {
      expirations: [],
      options: {
        isReact: true,
        key: 'value',
      },
      originalFunction() {},
    };

    options.originalFunction = () => {};

    const _microMemoizeOptions = {
      micro: 'memoize',
    };
    const cache: Moize.Cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.cache = cache;
    moized.options = _microMemoizeOptions;

    addInstanceProperties(moized, options);

    expect(hasOwnProperty.call(moized, 'displayName')).toBe(true);
    expect(moized.displayName).toBe('Moized(Component)');
  });
});

describe('augmentInstance', () => {
  it('should add the methods and properties to the moized method', () => {
    // @ts-ignore
    const moized: Moize.Moized = memoize(() => {});
    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {
        isEqual: isStrictEqual,
        onCacheAdd() {},
        onCacheChange() {},
        transformKey: undefined,
      },
      originalFunction() {},
    };

    const result = augmentInstance(moized, configuration);

    expect(result).toBe(moized);

    expect(hasOwnProperty.call(moized, 'add')).toBe(true);
    expect(hasOwnProperty.call(moized, 'clear')).toBe(true);
    expect(hasOwnProperty.call(moized, 'get')).toBe(true);
    expect(hasOwnProperty.call(moized, 'getStats')).toBe(true);
    expect(hasOwnProperty.call(moized, 'has')).toBe(true);
    expect(hasOwnProperty.call(moized, 'keys')).toBe(true);
    expect(hasOwnProperty.call(moized, 'remove')).toBe(true);
    expect(hasOwnProperty.call(moized, 'values')).toBe(true);

    expect(hasOwnProperty.call(moized, '_microMemoizeOptions')).toBe(true);
    expect(hasOwnProperty.call(moized, 'cache')).toBe(true);
    expect(hasOwnProperty.call(moized, 'cacheSnapshot')).toBe(true);
    expect(hasOwnProperty.call(moized, 'expirations')).toBe(true);
    expect(hasOwnProperty.call(moized, 'expirationsSnapshot')).toBe(true);
    expect(hasOwnProperty.call(moized, 'isCollectingStats')).toBe(true);
    expect(hasOwnProperty.call(moized, 'isMoized')).toBe(true);
    expect(hasOwnProperty.call(moized, 'options')).toBe(true);
    expect(hasOwnProperty.call(moized, 'originalFunction')).toBe(true);
  });
});

describe('moized.add', () => {
  it('should add the item to the cache if it does not already exist', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    moized.cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd: jest.fn(),
      onCacheChange: jest.fn(),
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const key = ['key'];
    const value = 'value';

    moized.add(key, value);

    expect(moized.cache.keys).toEqual([key]);
    expect(moized.cache.values).toEqual([value]);

    expect(moized.options.onCacheAdd).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheAdd).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );

    expect(moized.options.onCacheChange).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheChange).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should add the item to the cache if it does not already exist with a transformed key', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    moized.cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd: jest.fn(),
      onCacheChange: jest.fn(),
      transformKey: getTransformKey({
        transformArgs(args: any[]) {
          return args[0]
            .split('')
            .reverse()
            .join('');
        },
      }),
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const key = ['key'];
    const value = 'value';

    moized.add(key, value);

    expect(moized.cache.keys).toEqual([
      [
        key[0]
          .split('')
          .reverse()
          .join(''),
      ],
    ]);
    expect(moized.cache.values).toEqual([value]);

    expect(moized.options.onCacheAdd).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheAdd).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );

    expect(moized.options.onCacheChange).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheChange).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should add the item to the cache if it does not already exist with a transformed key that is an array', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    moized.cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd: jest.fn(),
      onCacheChange: jest.fn(),
      transformKey: jest.fn((args: any[]) => ['foo', args[0]]),
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const key = ['key'];
    const value = 'value';

    moized.add(key, value);

    expect(moized.cache.keys).toEqual([['foo', key[0]]]);
    expect(moized.cache.values).toEqual([value]);

    expect(moized.options.onCacheAdd).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheAdd).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );

    expect(moized.options.onCacheChange).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheChange).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should remove the oldest item from cache if the maxSize is exceeded', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    moized.cache = {
      keys: [['existingKey']],
      size: 1,
      values: ['existingValue'],
    };

    moized.options = {
      isEqual: isStrictEqual,
      maxSize: 1,
      onCacheAdd: jest.fn(),
      onCacheChange: jest.fn(),
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const key = ['key'];
    const value = 'value';

    moized.add(key, value);

    expect(moized.cache.keys).toEqual([key]);
    expect(moized.cache.values).toEqual([value]);

    expect(moized.options.onCacheAdd).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheAdd).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );

    expect(moized.options.onCacheChange).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheChange).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should do nothing if the item already exists in cache', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    const key = ['key'];
    const value = 'value';

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd: jest.fn(),
      onCacheChange: jest.fn(),
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    moized.add(key, value);

    expect(moized.cache.keys).toEqual([key]);
    expect(moized.cache.values).toEqual([value]);

    expect(moized.options.onCacheAdd).toHaveBeenCalledTimes(0);

    expect(moized.options.onCacheChange).toHaveBeenCalledTimes(0);
  });

  it('should throw if the key is not an array', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    const key = 'key';
    const value = 'value';

    moized.cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd: jest.fn(),
      onCacheChange: jest.fn(),
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    // @ts-ignore
    expect(() => moized.add(key, value)).toThrow();
  });
});

describe('moized.clear', () => {
  it('should clear the items in cache', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    const key = ['key'];
    const value = 'value';

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual() {},
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    moized.clear();

    expect(moized.cache.keys).toEqual([]);
    expect(moized.cache.values).toEqual([]);
  });
});

describe('moized.get', () => {
  it('should get the item from cache if the key exists', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const result = moized.get(key);

    expect(moized).toHaveBeenCalledTimes(1);
    expect(moized).toHaveBeenCalledWith(...key);

    expect(result).toBe(value);
  });

  it('should not get the item from cache if the key does not exist', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const result = moized.get(key);

    expect(moized).toHaveBeenCalledTimes(0);

    expect(result).toBe(undefined);
  });

  it('should get the item from cache if the transformed key exists', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey(_key: any[]) {
        return _key;
      },
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const result = moized.get(key);

    expect(moized).toHaveBeenCalledTimes(1);
    expect(moized).toHaveBeenCalledWith(...key);

    expect(result).toBe(value);
  });
});

describe('moized.getStats', () => {
  const _isCollectingStats = statsCache.isCollectingStats;

  beforeEach(() => {
    statsCache.isCollectingStats = true;
  });

  afterEach(() => {
    statsCache.isCollectingStats = _isCollectingStats;
  });

  it('should call getStats with the profileName in options', () => {
    // @ts-ignore
    const moized: Moize.Moized = () => {};

    moized.options = {};

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {
        profileName: 'profileName',
      },
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const result = moized.getStats();

    const profile = statsCache.profiles[configuration.options.profileName];

    // @ts-ignore
    expect(result).toEqual({
      ...profile,
      usage: getUsagePercentage(profile.calls, profile.hits),
    });
  });
});

describe('moized.has', () => {
  it('should return true if the key exists', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    expect(moized.has(key)).toBe(true);
  });

  it('should return false if the key does not exist', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [],
      size: 0,
      values: [],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    expect(moized.has(key)).toBe(false);
  });

  it('should return true if the transformed key exists in cache', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey(_key: any[]) {
        return _key;
      },
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    expect(moized.has(key)).toBe(true);
  });
});

describe('moized.keys', () => {
  it('should return a shallow clone of the keys', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    Object.defineProperties(moized, {
      cacheSnapshot: {
        get() {
          return {
            keys: [...moized.cache.keys],
            values: [...moized.cache.values],
          };
        },
      },
    });

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const keys = moized.keys();

    expect(keys).toEqual(moized.cache.keys);
    expect(keys).not.toBe(moized.cache.keys);
  });
});

describe('moized.remove', () => {
  it('should remove the existing key from cache', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    moized.remove(key);

    expect(moized.cache.keys).toEqual([]);
    expect(moized.cache.values).toEqual([]);
  });

  it('should do nothing if the key is not found in cache', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [['foo']],
      size: 1,
      values: ['bar'],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    moized.remove(key);

    expect(moized.cache.keys).toEqual([['foo']]);
    expect(moized.cache.values).toEqual(['bar']);
  });

  it('should remove the existing key from cache with a custom transformKey', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey(_key: any[]) {
        return _key;
      },
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    moized.remove(key);

    expect(moized.cache.keys).toEqual([]);
    expect(moized.cache.values).toEqual([]);
  });
});

describe('moized.update', () => {
  it('should set the new value in cache for the moized item', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    const keys = [['foo'], [{ bar: 'baz' }], key];
    const values = ['bar', ['quz'], value];

    moized.cache = {
      keys: [...keys],
      size: keys.length,
      values: [...values],
    };

    moized.options = {
      isEqual: isStrictEqual,
      onCacheChange: jest.fn(),
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const newValue = 'new value';

    moized.update(key, newValue);

    expect(moized.cache.keys).toEqual([key, ...keys.slice(0, keys.length - 1)]);
    expect(moized.cache.values).toEqual([
      newValue,
      ...values.slice(0, values.length - 1),
    ]);

    expect(moized.options.onCacheChange).toHaveBeenCalledTimes(1);
    expect(moized.options.onCacheChange).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should set the new value in cache for the moized item based on a transformed key', () => {
    const key = ['key'];

    const transformedKey = ['yek'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    const keys = [['foo'], [{ bar: 'baz' }], transformedKey];
    const values = ['bar', ['quz'], value];

    moized.cache = {
      keys: [...keys],
      size: keys.length,
      values: [...values],
    };

    moized.options = {
      isEqual: isStrictEqual,
      transformKey(_key: any[]) {
        return [
          _key[0]
            .split('')
            .reverse()
            .join(''),
        ];
      },
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const newValue = 'new value';

    moized.update(key, newValue);

    expect(moized.cache.keys).toEqual([
      transformedKey,
      ...keys.slice(0, keys.length - 1),
    ]);
    expect(moized.cache.values).toEqual([
      newValue,
      ...values.slice(0, values.length - 1),
    ]);
  });

  it('should do nothing if the key does not exist in keys', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    moized.options = {
      isEqual: isStrictEqual,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const newValue = 'new value';

    moized.update(['other key'], newValue);

    expect(moized.cache.keys).toEqual([key]);
    expect(moized.cache.values).toEqual([value]);
  });
});

describe('moized.values', () => {
  it('should return a shallow clone of the values', () => {
    const key = ['key'];
    const value = 'value';

    // @ts-ignore
    const moized: Moize.Moized = jest.fn(() => value);

    moized.cache = {
      keys: [key],
      size: 1,
      values: [value],
    };

    Object.defineProperties(moized, {
      cacheSnapshot: {
        get() {
          return {
            keys: [...moized.cache.keys],
            values: [...moized.cache.values],
          };
        },
      },
    });

    moized.options = {
      isEqual: isStrictEqual,
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    };

    const configuration: Moize.AugmentationOptions = {
      expirations: [],
      options: {},
      originalFunction() {},
    };

    addInstanceMethods(moized, configuration);

    const values = moized.values();

    expect(values).toEqual(moized.cache.values);
    expect(values).not.toBe(moized.cache.values);
  });
});
