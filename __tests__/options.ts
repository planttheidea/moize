import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';

import {
  DEFAULT_OPTIONS,
  getDefaultOptions,
  getIsEqual,
  getIsMatchingKey,
  getMicroMemoizeOptions,
  getTransformKey,
  isMatchingReactKey,
  isOptions,
  mergeOptions,
  setDefaultOptions,
} from '../src/options';
import { isMatchingSerializedKey } from '../src/serialize';

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

  it('should return sameValueZeroEqual as the ultimate fallback', () => {
    const options = {};

    const result = getIsEqual(options);

    expect(result).toBe(sameValueZeroEqual);
  });
});

describe('getIsMatchingKey', () => {
  it('should return the matchesKey method if it exists in options', () => {
    const options = { matchesKey: () => true };

    const result = getIsMatchingKey(options);

    expect(result).toBe(options.matchesKey);
  });

  it('should return isMatchingSerializedKey if serialize is requested', () => {
    const options = { isSerialized: true };

    const result = getIsMatchingKey(options);

    expect(result).toBe(isMatchingSerializedKey);
  });

  it('should return isMatchingReactKey if react is requested', () => {
    const options = { isReact: true };

    const result = getIsMatchingKey(options);

    expect(result).toBe(isMatchingReactKey);
  });

  it('should return undefined as the ultimate fallback', () => {
    const options = {};

    const result = getIsMatchingKey(options);

    expect(result).toBe(undefined);
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
      isReact: true,
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
      isMatchingKey: isMatchingReactKey,
      isPromise: options.isPromise,
      maxSize: options.maxSize,
      onCacheAdd,
      onCacheChange: options.onCacheChange,
      onCacheHit,
      transformKey: options.transformArgs,
    });
  });
});
