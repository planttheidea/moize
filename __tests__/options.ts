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
import { Handler } from '../src/types';

describe('getDefaultOptions', () => {
  it('should return the deep options when requested', () => {
    const options = { isDeepEqual: true };

    const result = getDefaultOptions(options);

    expect(result).toBe(DEFAULT_OPTIONS.deep);
  });

  it('should return the promise options when requested', () => {
    const options = { isPromise: true };

    const result = getDefaultOptions(options);

    expect(result).toBe(DEFAULT_OPTIONS.promise);
  });

  it('should return the react options when requested', () => {
    const options = { isReact: true };

    const result = getDefaultOptions(options);

    expect(result).toBe(DEFAULT_OPTIONS.react);
  });

  it('should return the reactGlobal options when requested', () => {
    const options = { isReact: true, isReactGlobal: true };

    const result = getDefaultOptions(options);

    expect(result).toBe(DEFAULT_OPTIONS.reactGlobal);
  });

  it('should return the serialized options when requested', () => {
    const options = { isSerialized: true };

    const result = getDefaultOptions(options);

    expect(result).toBe(DEFAULT_OPTIONS.serialize);
  });

  it('should return the global options when no matching parameters', () => {
    const options = { maxAge: 1000 };

    const result = getDefaultOptions(options);

    expect(result).toBe(DEFAULT_OPTIONS.__global__);
  });

  it('should return the global options when no options are passed', () => {
    const result = getDefaultOptions();

    expect(result).toBe(DEFAULT_OPTIONS.__global__);
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
    const options = { ...DEFAULT_OPTIONS.__global__ };
    const onCacheAdd: void = undefined;
    const onCacheHit: void = undefined;

    const result = getMicroMemoizeOptions(options, onCacheAdd, onCacheHit);

    expect(result).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: options.isPromise,
      maxSize: options.maxSize,
    });
  });

  it('should get the micro-memoize options when custom options are needed', () => {
    const options = {
      ...DEFAULT_OPTIONS.__global__,
      isDeepEqual: true,
      isPromise: true,
      matchesKey: () => true,
      maxAge: 1000,
      onCacheChange() {},
      transformArgs: (): any[] => [],
      updateExpire: true,
    };
    const onCacheAdd = () => {};
    const onCacheHit = () => {};

    const result = getMicroMemoizeOptions(options, onCacheAdd, onCacheHit);

    expect(result).toEqual({
      isEqual: deepEqual,
      isMatchingKey: options.matchesKey,
      isPromise: options.isPromise,
      maxSize: options.maxSize,
      onCacheAdd,
      onCacheChange: options.onCacheChange,
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

  it('should get an argument limiting function if requested', () => {
    const options = { maxArgs: 1 };
    const transformKey = getTransformKey(options);

    const args = ['foo', 'bar'];

    expect(transformKey(args)).toEqual(['foo']);
  });

  it('should handle all options passed if requested', () => {
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
    const originalOptions = { ...DEFAULT_OPTIONS.__global__, isReact: true };
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
