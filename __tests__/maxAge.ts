/* globals afterEach,beforeEach,describe,expect,it,jest */

import { clearExpiration, getMaxAgeOptions } from '../src/maxAge';

import { Moize } from '../src/types';
import moize from '../src';

const isStrictlyEqual = (a: any, b: any) => a === b;

describe('clearExpiration', () => {
  const _clearTimeout = clearTimeout;
  const stub = jest.fn();

  beforeEach(() => {
    global.clearTimeout = stub;
  });

  afterEach(() => {
    stub.mockReset();

    global.clearTimeout = _clearTimeout;
  });

  it('should clear the expiration if it exists', () => {
    const key = ['foo'];
    const cache = {
      expirations: [
        {
          expirationMethod() {},
          key,
          timeoutId: 123,
        },
      ],
    } as Moize.Cache;

    clearExpiration(cache, key, false);

    expect(stub).toHaveBeenCalledTimes(1);
    expect(cache.expirations.length).toBe(1);
  });

  it('should clear the expiration if it exists and remove it if requested', () => {
    const key = ['foo'];
    const cache = {
      expirations: [
        {
          expirationMethod() {},
          key,
          timeoutId: 123,
        },
      ],
    } as Moize.Cache;

    clearExpiration(cache, key, true);

    expect(stub).toHaveBeenCalledTimes(1);
    expect(cache.expirations.length).toBe(0);
  });

  it('should do nothing if the expiration is not found', () => {
    const key = ['foo'];
    const cache = {
      expirations: [
        {
          expirationMethod() {},
          key: ['bar'],
          timeoutId: 123,
        },
      ],
    } as Moize.Cache;

    clearExpiration(cache, key, true);

    expect(stub).toHaveBeenCalledTimes(0);
    expect(cache.expirations.length).toBe(1);
  });
});

describe('getMaxAgeOptions', () => {
  it('should return the combined onCacheAdd and onCacheHit methods', () => {
    const options = {
      isEqual: isStrictlyEqual,
      maxAge: 100,
      updateExpire: true,
    };

    const maxAgeOptions = getMaxAgeOptions(options);

    expect(Object.keys(maxAgeOptions)).toEqual(['onCacheAdd', 'onCacheHit']);

    expect(typeof maxAgeOptions.onCacheAdd).toBe('function');
    expect(typeof maxAgeOptions.onCacheHit).toBe('function');
  });

  it('should return undefined for onCacheHit if updateExpire is false', () => {
    const options = {
      isEqual: isStrictlyEqual,
      maxAge: 100,
      updateExpire: false,
    };

    const maxAgeOptions = getMaxAgeOptions(options);

    expect(Object.keys(maxAgeOptions)).toEqual(['onCacheAdd']);

    expect(typeof maxAgeOptions.onCacheAdd).toBe('function');
  });

  it('should return undefined for both if maxAge is not a number', () => {
    const options = {
      isEqual: isStrictlyEqual,
      updateExpire: false,
    };

    const maxAgeOptions = getMaxAgeOptions(options);

    expect(Object.keys(maxAgeOptions)).toEqual([]);
  });

  describe('onCacheAdd', () => {
    const _setTimeout = setTimeout;
    const stub = jest.fn().mockReturnValue(234);

    beforeEach(() => {
      global.setTimeout = stub;
    });

    afterEach(() => {
      stub.mockReset();
      stub.mockReturnValue(234);

      global.setTimeout = _setTimeout;
    });

    it('should do nothing if an existing expiration is found', () => {
      const originalExpirations = [
        {
          expirationMethod() {},
          key: ['key'],
          timeoutId: 234,
        },
      ];

      const options = {
        isEqual: isStrictlyEqual,
        maxAge: 100,
        updateExpire: true,
      };

      const { onCacheAdd } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = originalExpirations.map(expiration => ({
        ...expiration,
      }));
      cache.keys = [originalExpirations[0].key];
      cache.values = ['value'];

      onCacheAdd(cache, {}, memoized);

      expect(stub).toHaveBeenCalledTimes(0);
      expect(cache.expirations).toEqual(originalExpirations);
    });

    it('should add the new expiration when options are passed', () => {
      const options = {
        _mm: {},
        isEqual: isStrictlyEqual,
        maxAge: 100,
      };

      const { onCacheAdd } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = [];
      cache.keys = [['key']];
      cache.values = ['value'];

      onCacheAdd(cache, options, memoized);

      expect(stub).toHaveBeenCalledTimes(1);
      expect(cache.expirations.length).toBe(1);

      const { expirationMethod, key, timeoutId } = cache.expirations[0];

      expect(stub).toHaveBeenCalledWith(expirationMethod, options.maxAge);

      expect(key).toBe(cache.keys[0]);
      expect(timeoutId).toBe(234);

      expect(cache.keys.length).toBe(1);
      expect(cache.values.length).toBe(1);

      expirationMethod();

      expect(cache.keys.length).toBe(0);
      expect(cache.values.length).toBe(0);
    });

    it('should not remove the key / value combo when they no longer exist', () => {
      const options = {
        _mm: {},
        isEqual: isStrictlyEqual,
        maxAge: 100,
      };

      const { onCacheAdd } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = [];
      cache.keys = [['key']];
      cache.values = ['value'];

      onCacheAdd(cache, options, memoized);

      const { expirationMethod } = cache.expirations[0];

      cache.keys.length = 0;
      cache.values.length = 0;

      expect(() => {
        expirationMethod();
      }).not.toThrow();
    });

    it('should not remove the expiration when it no longer exists', () => {
      const options = {
        _mm: {},
        isEqual: isStrictlyEqual,
        maxAge: 100,
      };

      const { onCacheAdd } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = [];
      cache.keys = [['key']];
      cache.values = ['value'];

      onCacheAdd(cache, options, memoized);

      const { expirationMethod } = cache.expirations[0];

      cache.expirations.length = 0;

      expect(() => {
        expirationMethod();
      }).not.toThrow();
    });

    it('should return the expired key and value and create a new expiration if onExpire returns false', () => {
      const options = {
        _mm: {},
        isEqual: isStrictlyEqual,
        maxAge: 100,
        onExpire: jest.fn().mockReturnValue(false),
      };

      const { onCacheAdd } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = [];
      cache.keys = [['key']];
      cache.values = ['value'];

      onCacheAdd(cache, options, memoized);

      expect(stub).toHaveBeenCalledTimes(1);

      expect(cache.expirations.length).toBe(1);

      const { expirationMethod, key, timeoutId } = cache.expirations[0];

      expect(key).toBe(cache.keys[0]);
      expect(timeoutId).toBe(234);

      expect(cache.keys.length).toBe(1);
      expect(cache.values.length).toBe(1);

      const currentKeys = [...cache.keys];
      const currentValues = [...cache.values];

      expirationMethod();

      expect(cache.keys.length).toBe(1);
      expect(cache.keys).toEqual(currentKeys);

      expect(cache.values.length).toBe(1);
      expect(cache.values).toEqual(currentValues);
    });

    it('should fire onCacheChange when it exists', () => {
      const onCacheChange = jest.fn();
      const options = {
        _mm: { onCacheChange },
        isEqual: isStrictlyEqual,
        maxAge: 100,
        onCacheChange,
        onExpire: jest.fn().mockReturnValue(false),
      };

      const { onCacheAdd } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = [];
      cache.keys = [['key']];
      cache.values = ['value'];

      onCacheAdd(cache, options, memoized);

      expect(stub).toHaveBeenCalledTimes(1);

      expect(cache.expirations.length).toBe(1);

      const { expirationMethod, key, timeoutId } = cache.expirations[0];

      expect(key).toBe(cache.keys[0]);
      expect(timeoutId).toBe(234);

      expect(cache.keys.length).toBe(1);
      expect(cache.values.length).toBe(1);

      const currentKeys = [...cache.keys];
      const currentValues = [...cache.values];

      expirationMethod();

      expect(options.onCacheChange).toHaveBeenCalledTimes(2);
      expect(options.onCacheChange).toHaveBeenCalledWith(cache, options, memoized);

      expect(cache.keys.length).toBe(1);
      expect(cache.keys).toEqual(currentKeys);

      expect(cache.values.length).toBe(1);
      expect(cache.values).toEqual(currentValues);
    });
  });

  describe('onCacheHit', () => {
    const _clearTimeout = clearTimeout;
    const _setTimeout = setTimeout;

    const clearStub = jest.fn();
    const setStub = jest.fn().mockReturnValue(234);

    beforeEach(() => {
      global.clearTimeout = clearStub;
      global.setTimeout = setStub;
    });

    afterEach(() => {
      clearStub.mockReset();

      setStub.mockReset();
      setStub.mockReturnValue(234);

      global.clearTimeout = _clearTimeout;
      global.setTimeout = _setTimeout;
    });

    it('should do onCacheHitnothing when the expiration does not exist', () => {
      const originalExpirations: Moize.Expiration[] = [];

      const options = {
        isEqual: isStrictlyEqual,
        maxAge: 100,
        updateExpire: true,
      };

      const { onCacheHit } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = originalExpirations.map(expiration => ({
        ...expiration,
      }));
      cache.keys = [['key']];
      cache.values = ['value'];

      onCacheHit(cache);

      expect(cache.expirations).toEqual([]);
    });

    it('should update the expiration when found', () => {
      const originalExpirations = [
        {
          expirationMethod() {},
          key: ['key'],
          timeoutId: 123,
        },
      ];

      const options = {
        isEqual: isStrictlyEqual,
        maxAge: 100,
        updateExpire: true,
      };

      const { onCacheHit } = getMaxAgeOptions(options);

      const memoized = moize(() => {}, options);

      const { cache } = memoized;

      // @ts-ignore
      cache.expirations = originalExpirations.map(expiration => ({
        ...expiration,
      }));
      cache.keys = [originalExpirations[0].key];
      cache.values = ['value'];

      onCacheHit(cache);

      expect(clearStub).toHaveBeenCalledTimes(1);
      expect(clearStub).toHaveBeenCalledWith(originalExpirations[0].timeoutId);

      expect(setStub).toHaveBeenCalledTimes(1);
      expect(setStub).toHaveBeenCalledWith(originalExpirations[0].expirationMethod, options.maxAge);

      expect(cache.expirations).toEqual([
        {
          ...originalExpirations[0],
          timeoutId: 234,
        },
      ]);
    });
  });
});
