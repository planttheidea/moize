/* eslint-disable */

import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';

import {
  DEFAULT_OPTIONS,
  getDefaultOptions,
  getIsEqual,
  getMicroMemoizeOptions,
  getTransformKey,
  isOptions,
  mergeOptions,
  setDefaultOptions,
} from '../src/options';
import { getStringifiedArgs } from '../src/serialize';

describe('getDefaultOptions', () => {
  it('should return the global options', () => {
    const result = getDefaultOptions();

    expect(result).toBe(DEFAULT_OPTIONS);
  });
});

describe('getIsEqual', () => {
  it('should return the equals method if it exists in options', () => {
    const options = { equals: () => true };

    const result = getIsEqual(options);

    expect(result).toBe(options.equals);
  });

  it('should return deepEqual if it is requested', () => {
    const options = { isDeepEqual: true };

    const result = getIsEqual(options);

    expect(result).toBe(deepEqual);
  });

  it('should return shallowEqual if react is requested', () => {
    const options = { isReact: true };

    const result = getIsEqual(options);

    expect(result).toBe(shallowEqual);
  });

  it('should return sameValueZeroEqual as the ultimate fallback', () => {
    const options = {};

    const result = getIsEqual(options);

    expect(result).toBe(sameValueZeroEqual);
  });
});

describe('getMicroMemoizeOptions', () => {
  it('should get the micro-memoize options with defaults', () => {
    const options = { ...DEFAULT_OPTIONS };
    const onCacheAdd: void = undefined;
    const onCacheChange: void = undefined;
    const onCacheHit: void = undefined;

    const result = getMicroMemoizeOptions(
      options,
      onCacheAdd,
      onCacheChange,
      onCacheHit,
    );

    expect(result).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: options.isPromise,
      maxSize: options.maxSize,
    });
  });

  it('should get the micro-memoize options when custom options are needed', () => {
    const options = {
      ...DEFAULT_OPTIONS,
      isDeepEqual: true,
      isPromise: true,
      matchesKey: () => true,
      maxAge: 1000,
      onCacheChange() {},
      transformArgs: (): any[] => [],
      updateExpire: true,
    };
    const onCacheAdd = () => {};
    const onCacheChange = () => {};
    const onCacheHit = () => {};

    const result = getMicroMemoizeOptions(
      options,
      onCacheAdd,
      onCacheChange,
      onCacheHit,
    );

    expect(result).toEqual({
      isEqual: deepEqual,
      isMatchingKey: options.matchesKey,
      isPromise: options.isPromise,
      maxSize: options.maxSize,
      onCacheAdd,
      onCacheChange,
      onCacheHit,
      transformKey: options.transformArgs,
    });
  });
});

describe('getTransformKey', () => {
  it('should get the serialize key if requested', () => {
    const options = { isSerialized: true };

    expect(getTransformKey(options)).toBe(getStringifiedArgs);
  });

  it('should get the custom transformArgs if requested', () => {
    const options = { transformArgs: () => ['foo'] };

    expect(getTransformKey(options)).toBe(options.transformArgs);
  });

  it('should get the limited arguments if react is requested', () => {
    const options = { isReact: true };
    const transformKey = getTransformKey(options);

    const args = [{ props: true }, { context: true }, 'foo'];

    expect(transformKey(args)).toEqual([args[0], args[1]]);
  });

  it('should get the limited arguments if react is requested as well as maxArgs', () => {
    const options = { isReact: true, maxArgs: 1 };
    const transformKey = getTransformKey(options);

    const args = [{ props: true }, { context: true }, 'foo'];

    expect(transformKey(args)).toEqual([args[0]]);
  });

  it('should get an argument limiting function if requested', () => {
    const options = { maxArgs: 1 };
    const transformKey = getTransformKey(options);

    const args = ['foo', 'bar'];

    expect(transformKey(args)).toEqual(['foo']);
  });

  it('should handle all options passed if requested in the correct order', () => {
    const options = {
      isSerialized: true,
      maxArgs: 2,
      transformArgs(args: any[]) {
        return args.slice().reverse();
      },
    };
    const transformKey = getTransformKey(options);

    const args = ['foo', 'bar', 'baz'];

    expect(transformKey(args)).toEqual(['bar|foo']);
  });
});

describe('isOptions', () => {
  it('should return true if it is an object that is not null', () => {
    expect(isOptions({})).toBe(true);
  });

  it('should return true if it is a pure object that is not null', () => {
    expect(isOptions(Object.create(null))).toBe(true);
  });

  it('should return false if it is null', () => {
    expect(isOptions(null)).toBe(false);
  });

  it('should return false if it is not a plain object', () => {
    expect(isOptions([])).toBe(false);
  });
});

describe('mergedOptions', () => {
  it('should merge the non-handlers options safely', () => {
    const originalOptions = { ...DEFAULT_OPTIONS, isReact: true };
    const newOptions = { maxAge: 1000, isSerialized: true };

    const result = mergeOptions(originalOptions, newOptions);

    expect(result).toEqual({
      ...originalOptions,
      ...newOptions,
    });
  });

  it('should merge the handlers options safely', () => {
    let count = 0;

    const originalOptions = {
      onCacheAdd() {
        count++;
      },
    };
    const newOptions = {
      onCacheAdd() {
        count++;
      },
    };

    const result = mergeOptions(originalOptions, newOptions);

    expect(Object.keys(result)).toEqual([
      'onCacheAdd',
      'onCacheChange',
      'onCacheHit',
      'transformArgs',
    ]);

    // @ts-ignore
    result.onCacheAdd();

    expect(count).toBe(2);

    expect(result.onCacheChange).toBe(undefined);
    expect(result.onCacheHit).toBe(undefined);
    expect(result.transformArgs).toBe(undefined);
  });
});

describe('setDefaultOptions', () => {
  const original: typeof DEFAULT_OPTIONS = { ...DEFAULT_OPTIONS };

  afterEach(() => {
    for (const key in original) {
      DEFAULT_OPTIONS[key] = original[key];
    }
  });

  it('should not set anything if the options passed are not valid', () => {
    const options: void = null;

    // @ts-ignore
    const result = setDefaultOptions(options);

    expect(result).toBe(false);

    expect(DEFAULT_OPTIONS).toEqual(original);
  });

  it('should set the options for all keys if no type is provided', () => {
    const options = { equals: () => true };

    const result = setDefaultOptions(options);

    expect(result).toBe(true);

    expect(DEFAULT_OPTIONS).toEqual({
      ...original,
      equals: options.equals,
    });
  });
});
