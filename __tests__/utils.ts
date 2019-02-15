/* eslint-disable */

// src
import {
  assignFallback,
  combine,
  compose,
  createFindKeyIndex,
  findExpirationIndex,
  getArrayKey,
  mergeOptions,
  orderByLru,
} from '../src/utils';
import { DEFAULT_OPTIONS } from '../src/constants';

describe('assignFallback', () => {});

describe('combine', () => {
  it('should fire all functions passed', () => {
    const a: any = null;
    const b = jest.fn();
    const c: any = null;
    const d = jest.fn();

    const result = combine(a, b, c, d);

    const args = ['foo', 'bar'];

    (result as Function)(...args);

    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(...args);
  });

  it('should handle when no valid functions are passed', () => {
    const a: any = undefined;
    const b: any = null;

    const result = combine(a, b);

    expect(result).toBe(undefined);
  });

  it('should handle when no functions are passed', () => {
    const result = combine();

    expect(result).toBe(undefined);
  });
});

describe('compose', () => {
  it('should fire the methods passed composed in the correct order', () => {
    const a = jest.fn().mockImplementation(({ args }) => [...args].reverse());
    const b = jest.fn().mockImplementation(args => ({
      args,
    }));
    const c = jest.fn().mockImplementation(args => args.slice(0, 2));

    const result = compose(
      a,
      b,
      c,
    );

    const args = ['foo', 'bar', 'baz'];

    const value = (result as Function)(args);

    expect(a).toHaveBeenCalledTimes(1);
    expect(a).toHaveBeenCalledWith({
      args: args.slice(0, 2),
    });

    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(args.slice(0, 2));

    expect(c).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledWith(args);

    expect(value).toEqual(args.slice(0, 2).reverse());
  });

  it('should handle only functions passed', () => {
    const a: any = null;
    const b = jest.fn().mockImplementation(args => [...args].reverse());
    const c: any = null;
    const d = jest.fn().mockImplementation(args => args.slice(0, 2));

    const result = compose(
      a,
      b,
      c,
      d,
    );

    const args = ['foo', 'bar', 'baz'];

    const value = (result as Function)(args);

    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(args.slice(0, 2));

    expect(d).toHaveBeenCalledTimes(1);
    expect(d).toHaveBeenCalledWith(args);

    expect(value).toEqual(args.slice(0, 2).reverse());
  });

  it('should handle no valid functions are passed', () => {
    const a: any = undefined;
    const b: any = null;

    const result = compose(
      a,
      b,
    );

    expect(result).toBe(undefined);
  });

  it('should handle no functions are passed', () => {
    const result = compose();

    expect(result).toBe(undefined);
  });
});

describe('findExpirationIndex', () => {
  it('should find the expiration based on the key', () => {
    const key = ['key'];
    const expirations = [
      { expirationMethod() {}, key: ['not key'], timeoutId: 2 },
      { expirationMethod() {}, key, timeoutId: 3 },
    ];

    const result = findExpirationIndex(expirations, key);

    expect(result).toBe(1);
  });

  it('should return the default if it cannot find the expiration based on the key', () => {
    const key = ['key'];
    const expirations = [
      { expirationMethod() {}, key: ['not key'], timeoutId: 2 },
    ];

    const result = findExpirationIndex(expirations, key);

    expect(result).toBe(-1);
  });
});

describe('createFindKeyIndex', () => {
  it('should return the matching key in keys', () => {
    const isEqual = (a: any, b: any) => a === b;

    const key = ['key'];
    const keys = [['not key'], ['key'], ['also not key']];

    const result = createFindKeyIndex(isEqual)(keys, key);

    expect(result).toBe(1);
  });

  it('should return the default when not able to match key in keys based on value', () => {
    const isEqual = (a: any, b: any) => a === b;

    const key = ['key'];
    const keys = [['not key'], ['also not key']];

    const result = createFindKeyIndex(isEqual)(keys, key);

    expect(result).toBe(-1);
  });

  it('should return the default when not able to match key in keys based on length', () => {
    const isEqual = (a: any, b: any) => a === b;

    const key = ['key'];
    const keys = [['not key'], ['key', 'negated'], ['also not key']];

    const result = createFindKeyIndex(isEqual)(keys, key);

    expect(result).toBe(-1);
  });

  it('should return the matching key in keys based on isMatchingKey', () => {
    const isEqual = (a: any, b: any) => a === b;
    const isMatchingKey = (a: any, b: any) => a[0] === b[0];

    const key = ['key'];
    const keys = [['not key'], ['key'], ['also not key']];

    const result = createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

    expect(result).toBe(1);
  });
});

describe('getArrayKey', () => {
  it('should return the key if an array', () => {
    const key = ['key'];

    const result = getArrayKey(key);

    expect(result).toBe(key);
  });

  it('should return the key if a string', () => {
    const key = 'key';

    const result = getArrayKey(key);

    expect(result).not.toBe(key);
    expect(result).toEqual([key]);
  });
});

describe('mergeOptions', () => {
  it('should return the original options if newOptions are the default', () => {
    const originalOptions = {
      isPromise: false,
    };
    const newOptions = DEFAULT_OPTIONS;

    const result = mergeOptions(originalOptions, newOptions);

    expect(result).toBe(originalOptions);
  });

  it('should return the merged options when newOptions is not the default', () => {
    const originalOptions = {
      isPromise: false,
    };
    const newOptions = {
      isPromise: true,
      transformKey: () => 'key',
    };

    const result = mergeOptions(originalOptions, newOptions);

    expect(result).toEqual({
      ...originalOptions,
      ...newOptions,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformArgs: undefined,
    });
  });
});

describe('orderByLru', () => {});
