/* globals afterEach,beforeEach,describe,expect,it,jest */

// src
import * as maxAge from '../src/maxAge';

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
    const expirations = [
      {
        expirationMethod() {},
        key,
        timeoutId: 123,
      },
    ];

    maxAge.clearExpiration(expirations, key, false);

    expect(stub).toHaveBeenCalledTimes(1);
    expect(expirations.length).toBe(1);
  });

  it('should clear the expiration if it exists and remove it if requested', () => {
    const key = ['foo'];
    const expirations = [
      {
        expirationMethod() {},
        key,
        timeoutId: 123,
      },
    ];

    maxAge.clearExpiration(expirations, key, true);

    expect(stub).toHaveBeenCalledTimes(1);
    expect(expirations.length).toBe(0);
  });

  it('should do nothing if the expiration is not found', () => {
    const key = ['foo'];
    const expirations = [
      {
        expirationMethod() {},
        key: ['bar'],
        timeoutId: 123,
      },
    ];

    maxAge.clearExpiration(expirations, key, true);

    expect(stub).toHaveBeenCalledTimes(0);
    expect(expirations.length).toBe(1);
  });
});

describe('onCacheAddSetExpiration', () => {
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

    const expirations = originalExpirations.map(expiration => ({
      ...expiration,
    }));
    const options = {
      maxAge: 100,
      updateExpire: true,
    };
    const isEqual = () => {};

    const onCacheAddSetExpiration = maxAge.createOnCacheAddSetExpiration(
      expirations,
      options,
      isEqual,
    );

    const cache = {
      keys: [originalExpirations[0].key],
      size: 1,
      values: ['value'],
    };

    onCacheAddSetExpiration(cache, options, () => {});

    expect(stub).toHaveBeenCalledTimes(0);
    expect(expirations).toEqual(originalExpirations);
  });

  it('should add the new expiration when options are passed', () => {
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
    };

    const onCacheAddSetExpiration = maxAge.createOnCacheAddSetExpiration(
      expirations,
      options,
      isStrictlyEqual,
    );

    const cache = {
      keys: [['key']],
      size: 1,
      values: ['value'],
    };

    onCacheAddSetExpiration(cache, options, () => {});

    expect(stub).toHaveBeenCalledTimes(1);
    expect(expirations.length).toBe(1);

    const { expirationMethod, key, timeoutId } = expirations[0];

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
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
    };

    const onCacheAddSetExpiration = maxAge.createOnCacheAddSetExpiration(
      expirations,
      options,
      isStrictlyEqual,
    );

    const cache = {
      keys: [['key']],
      size: 1,
      values: ['value'],
    };

    onCacheAddSetExpiration(cache, options, () => {});

    const { expirationMethod } = expirations[0];

    cache.keys.length = 0;
    cache.values.length = 0;

    expect(() => {
      expirationMethod();
    }).not.toThrow();
  });

  it('should not remove the expiration when it no longer exists', () => {
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
    };

    const onCacheAddSetExpiration = maxAge.createOnCacheAddSetExpiration(
      expirations,
      options,
      isStrictlyEqual,
    );

    const cache = {
      keys: [['key']],
      size: 1,
      values: ['value'],
    };

    onCacheAddSetExpiration(cache, options, () => {});

    const { expirationMethod } = expirations[0];

    expirations.length = 0;

    expect(() => {
      expirationMethod();
    }).not.toThrow();
  });

  it('should return the expired key and value and create a new expiration if onExpire returns false', () => {
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
      onExpire: jest.fn().mockReturnValue(false),
    };

    const onCacheAddSetExpiration = maxAge.createOnCacheAddSetExpiration(
      expirations,
      options,
      isStrictlyEqual,
    );

    const cache = {
      keys: [['key']],
      size: 1,
      values: ['value'],
    };

    onCacheAddSetExpiration(cache, options, () => {});

    expect(stub).toHaveBeenCalledTimes(1);

    expect(expirations.length).toBe(1);

    const { expirationMethod, key, timeoutId } = expirations[0];

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
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
      onCacheChange: jest.fn(),
      onExpire: jest.fn().mockReturnValue(false),
    };
    const moized = () => {};

    const onCacheAddSetExpiration = maxAge.createOnCacheAddSetExpiration(
      expirations,
      options,
      isStrictlyEqual,
    );

    const cache = {
      keys: [['key']],
      size: 1,
      values: ['value'],
    };

    onCacheAddSetExpiration(cache, options, moized);

    expect(stub).toHaveBeenCalledTimes(1);

    expect(expirations.length).toBe(1);

    const { expirationMethod, key, timeoutId } = expirations[0];

    expect(key).toBe(cache.keys[0]);
    expect(timeoutId).toBe(234);

    expect(cache.keys.length).toBe(1);
    expect(cache.values.length).toBe(1);

    const currentKeys = [...cache.keys];
    const currentValues = [...cache.values];

    expirationMethod();

    expect(options.onCacheChange).toHaveBeenCalledTimes(2);
    expect(options.onCacheChange).toHaveBeenCalledWith(cache, options, moized);

    expect(cache.keys.length).toBe(1);
    expect(cache.keys).toEqual(currentKeys);

    expect(cache.values.length).toBe(1);
    expect(cache.values).toEqual(currentValues);
  });
});

describe('onCacheHitResetExpiration', () => {
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

  it('should do nothing when the expiration does not exist', () => {
    const originalExpirations: Moize.Expiration[] = [];

    const expirations = originalExpirations.map(expiration => ({
      ...expiration,
    }));
    const options = {
      updateExpire: true,
    };

    const onCacheHitResetExpiration = maxAge.createOnCacheHitResetExpiration(
      expirations,
      options,
    );

    const cache = {
      keys: [['key']],
      size: 1,
      values: ['value'],
    };

    onCacheHitResetExpiration(cache);

    expect(expirations).toEqual([]);
  });

  it('should update the expiration when found', () => {
    const originalExpirations = [
      {
        expirationMethod() {},
        key: ['key'],
        timeoutId: 123,
      },
    ];

    const expirations = originalExpirations.map(expiration => ({
      ...expiration,
    }));
    const options = {
      maxAge: 100,
      updateExpire: true,
    };

    const onCacheHitResetExpiration = maxAge.createOnCacheHitResetExpiration(
      expirations,
      options,
    );

    const cache = {
      keys: [originalExpirations[0].key],
      size: 1,
      values: ['value'],
    };

    onCacheHitResetExpiration(cache);

    expect(clearStub).toHaveBeenCalledTimes(1);
    expect(clearStub).toHaveBeenCalledWith(originalExpirations[0].timeoutId);

    expect(setStub).toHaveBeenCalledTimes(1);
    expect(setStub).toHaveBeenCalledWith(
      originalExpirations[0].expirationMethod,
      options.maxAge,
    );

    expect(expirations).toEqual([
      {
        ...originalExpirations[0],
        timeoutId: 234,
      },
    ]);
  });
});

describe('getMaxAgeOptions', () => {
  it('should return the combined onCacheAdd and onCacheHit methods', () => {
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
      onCacheAdd() {},
      onCacheHit() {},
      updateExpire: true,
    };

    const maxAgeOptions = maxAge.getMaxAgeOptions(
      expirations,
      options,
      isStrictlyEqual,
    );

    expect(Object.keys(maxAgeOptions)).toEqual(['onCacheAdd', 'onCacheHit']);
    expect(typeof maxAgeOptions.onCacheAdd).toBe('function');
    expect(typeof maxAgeOptions.onCacheHit).toBe('function');
  });

  it('should return undefined for onCacheHit if updateExpire is false', () => {
    const expirations: Moize.Expiration[] = [];
    const options = {
      maxAge: 100,
      onCacheAdd() {},
      onCacheHit() {},
      updateExpire: false,
    };

    const maxAgeOptions = maxAge.getMaxAgeOptions(
      expirations,
      options,
      isStrictlyEqual,
    );

    expect(Object.keys(maxAgeOptions)).toEqual(['onCacheAdd', 'onCacheHit']);
    expect(typeof maxAgeOptions.onCacheAdd).toBe('function');
    expect(maxAgeOptions.onCacheHit).toBe(undefined);
  });

  it('should return undefined for onCacheHit if onCacheAdd is not a function', () => {
    const expirations: Moize.Expiration[] = [];
    const options = {
      onCacheAdd() {},
      onCacheHit() {},
      updateExpire: false,
    };

    const maxAgeOptions = maxAge.getMaxAgeOptions(
      expirations,
      options,
      isStrictlyEqual,
    );

    expect(Object.keys(maxAgeOptions)).toEqual(['onCacheAdd', 'onCacheHit']);
    expect(maxAgeOptions.onCacheAdd).toBe(undefined);
    expect(maxAgeOptions.onCacheHit).toBe(undefined);
  });
});
