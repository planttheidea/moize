/* globals describe,expect,jest,it */

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

describe('assignFallback', () => {
  it('should shallowly merge sources into target if objects', () => {
    const o1 = { foo: 'bar' };
    const o2: null = null;
    const o3: void = undefined;
    const o4 = { bar: 'baz' };

    const target = {};

    const result = assignFallback(target, o1, o2, o3, o4);

    expect(result).toBe(target);

    const targetClone = { ...target };

    expect(result).toEqual(Object.assign(targetClone, o1, o2, o3, o4));
  });

  it('should only merge own properties', () => {
    const o1 = Object.create({
      bar: 'baz',
    });

    o1.foo = 'bar';

    const target = {};

    const result = assignFallback(target, o1);

    expect(result).toBe(target);

    expect(result).toEqual({ foo: 'bar' });

    const targetClone = { ...target };

    expect(result).toEqual(Object.assign(targetClone, o1));
  });

  it('should return the target if there are no sources', () => {
    const target = {};

    const result = assignFallback(target);

    expect(result).toBe(target);
  });
});

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

    const _warn = console.warn;

    console.warn = jest.fn();

    const result = getArrayKey(key);

    expect(console.warn).toHaveBeenCalledTimes(1);

    console.warn = _warn;

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

describe('orderByLru', () => {
  it('will do nothing if the itemIndex is 0', () => {
    const cache = {
      keys: [['first'], ['second'], ['third']],
      size: 3,
      values: ['first', 'second', 'third'],
    };
    const itemIndex = 0;
    const key = cache.keys[itemIndex];
    const value = cache.values[itemIndex];
    const maxSize = 3;

    orderByLru(cache, key, value, itemIndex, maxSize);

    expect(cache).toEqual({
      ...cache,
      keys: [['first'], ['second'], ['third']],
      values: ['first', 'second', 'third'],
    });
  });

  it('will place the itemIndex first in order when non-zero', () => {
    const cache = {
      keys: [['first'], ['second'], ['third']],
      size: 3,
      values: ['first', 'second', 'third'],
    };
    const itemIndex = 1;
    const key = cache.keys[itemIndex];
    const value = cache.values[itemIndex];
    const maxSize = 3;

    orderByLru(cache, key, value, itemIndex, maxSize);

    expect(cache).toEqual({
      ...cache,
      keys: [['second'], ['first'], ['third']],
      values: ['second', 'first', 'third'],
    });
  });

  it('will add the new item to the array when the itemIndex is the array length', () => {
    const cache = {
      keys: [['first'], ['second'], ['third']],
      size: 3,
      values: ['first', 'second', 'third'],
    };
    const itemIndex = cache.keys.length;
    const key = ['key'];
    const value = 'new';
    const maxSize = 4;

    orderByLru(cache, key, value, itemIndex, maxSize);

    expect(cache).toEqual({
      ...cache,
      keys: [key, ['first'], ['second'], ['third']],
      values: [value, 'first', 'second', 'third'],
    });
  });

  it('will reduce the size of the array if too long', () => {
    const cache = {
      keys: [['first'], ['second'], ['third']],
      size: 3,
      values: ['first', 'second', 'third'],
    };
    const itemIndex = cache.keys.length;
    const key = ['key'];
    const value = 'new';
    const maxSize = 3;

    orderByLru(cache, key, value, itemIndex, maxSize);

    expect(cache).toEqual({
      ...cache,
      keys: [key, ['first'], ['second']],
      values: [value, 'first', 'second'],
    });
  });
});
