import type { AnyFn, Memoized, NormalizedOptions } from '../index.d';
import { Cache } from '../src/Cache';
import { isSameValueZero } from '../src/utils';

const has = (object: any, property: string) =>
  Object.prototype.hasOwnProperty.call(object, property);

const mockNormalizedOptions = (options: any) =>
  options as NormalizedOptions<AnyFn>;

describe('create cache', () => {
  it('should create a new cache instance with correct defaults', () => {
    const options = mockNormalizedOptions({});

    const cache = new Cache(options);

    expect(cache.keys).toEqual([]);
    expect(cache.values).toEqual([]);
    expect(cache.getKeyIndex).toEqual(cache._getKeyIndexForSingle);
    expect(cache.canTransformKey).toBe(false);
    expect(cache.shouldCloneArguments).toBe(false);
    expect(cache.shouldUpdateOnAdd).toBe(false);
    expect(cache.shouldUpdateOnChange).toBe(false);
    expect(cache.shouldUpdateOnHit).toBe(false);
  });

  it('should create a new cache instance with correct values when not matching key', () => {
    const options = mockNormalizedOptions({
      maxSize: 5,
      transformKey(): any[] {
        return [];
      },
      onCacheAdd() {},
      onCacheChange() {},
      onCacheHit() {},
    });

    const cache = new Cache(options);

    expect(cache.keys).toEqual([]);
    expect(cache.values).toEqual([]);
    expect(cache.getKeyIndex).toEqual(cache._getKeyIndexForMany);
    expect(cache.canTransformKey).toBe(true);
    expect(cache.shouldCloneArguments).toBe(true);
    expect(cache.shouldUpdateOnAdd).toBe(true);
    expect(cache.shouldUpdateOnChange).toBe(true);
    expect(cache.shouldUpdateOnHit).toBe(true);
  });

  it('should create a new cache instance with correct values when matching key', () => {
    const options = mockNormalizedOptions({
      isMatchingKey() {
        return true;
      },
    });

    const cache = new Cache(options);

    expect(cache.keys).toEqual([]);
    expect(cache.values).toEqual([]);
    expect(cache.getKeyIndex).toEqual(cache._getKeyIndexFromMatchingKey);
    expect(cache.canTransformKey).toBe(false);
    expect(cache.shouldCloneArguments).toBe(true);
    expect(cache.shouldUpdateOnAdd).toBe(false);
    expect(cache.shouldUpdateOnChange).toBe(false);
    expect(cache.shouldUpdateOnHit).toBe(false);
  });
});

describe('cache methods', () => {
  describe('getKeyIndex', () => {
    it('will return -1 if no keys exist', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual });

      const cache = new Cache(options);

      const keyToMatch = ['key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return the index of the match found', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual });

      const cache = new Cache(options);

      cache.keys = [['key']];

      const keyToMatch = ['key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(0);
    });

    it('will return the index of the match found with a larger key', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual });

      const cache = new Cache(options);

      cache.keys = [['key1', 'key2']];

      const keyToMatch = ['key1', 'key2'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(0);
    });

    it('will return -1 if the key length is different', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual });

      const cache = new Cache(options);

      cache.keys = [['key']];

      const keyToMatch = ['some', 'other key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return -1 if no match found', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual });

      const cache = new Cache(options);

      cache.keys = [['key']];

      const keyToMatch = ['other key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return -1 if no match found with a larger key', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual });

      const cache = new Cache(options);

      cache.keys = [['key1', 'key2']];

      const keyToMatch = ['keyA', 'keyB'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return -1 if no keys exist with larger maxSize', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual, maxSize: 2 });

      const cache = new Cache(options);

      const keyToMatch = ['key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return the index of the match found with larger maxSize', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual, maxSize: 2 });

      const cache = new Cache(options);

      cache.keys = [['key'], ['other key']];

      const keyToMatch = ['other key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(1);
    });

    it('will return -1 if the key length is different with larger maxSize', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual, maxSize: 2 });

      const cache = new Cache(options);

      cache.keys = [['key'], ['not other key']];

      const keyToMatch = ['some', 'other key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return -1 if no match found with larger maxSize', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;

      const options = mockNormalizedOptions({ isEqual, maxSize: 2 });

      const cache = new Cache(options);

      cache.keys = [['key'], ['other key']];

      const keyToMatch = ['not present key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will use the isMatchingKey method is passed', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;
      const isMatchingKey = (o1: any, o2: any) => {
        const existingKey = o1[0];
        const key = o2[0];

        return (
          has(existingKey, 'foo') &&
          has(key, 'foo') &&
          (existingKey.bar === 'bar' || key.bar === 'baz')
        );
      };

      const options = mockNormalizedOptions({
        isEqual,
        isMatchingKey,
      });

      const cache = new Cache(options);

      cache.keys = [
        [
          {
            bar: 'bar',
            foo: 'foo',
          },
        ],
      ];

      const keyToMatch = [
        {
          bar: 'baz',
          foo: 'bar',
        },
      ];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(0);
    });

    it('will use the isMatchingKey method is passed and maxSize is greater than 1', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;
      const isMatchingKey = (o1: any, o2: any) => {
        const existingKey = o1[0];
        const key = o2[0];

        return (
          has(existingKey, 'foo') &&
          has(key, 'foo') &&
          (existingKey.bar === 'bar' || key.bar === 'baz')
        );
      };

      const options = mockNormalizedOptions({
        isEqual,
        isMatchingKey,
        maxSize: 2,
      });

      const cache = new Cache(options);

      cache.keys = [
        [
          {
            bar: 'baz',
            baz: 'quz',
          },
        ],
        [
          {
            bar: 'bar',
            foo: 'foo',
          },
        ],
      ];
      const keyToMatch = [
        {
          bar: 'baz',
          foo: 'bar',
        },
      ];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(1);
    });

    it('will return -1 if the isMatchingKey method is passed and there are no keys', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;
      const isMatchingKey = (o1: any, o2: any) => {
        const existingKey = o1[0];
        const key = o2[0];

        return (
          has(existingKey, 'foo') &&
          has(key, 'foo') &&
          (existingKey.bar === 'bar' || key.bar === 'baz')
        );
      };

      const options = mockNormalizedOptions({
        isEqual,
        isMatchingKey,
      });

      const cache = new Cache(options);

      const keyToMatch = ['key'];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return -1 if the isMatchingKey method is passed and no match is found', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;
      const isMatchingKey = (o1: any, o2: any) => {
        const existingKey = o1[0];
        const key = o2[0];

        return (
          has(existingKey, 'foo') &&
          has(key, 'foo') &&
          (existingKey.bar === 'bar' || key.bar === 'baz')
        );
      };

      const options = mockNormalizedOptions({
        isEqual,
        isMatchingKey,
      });

      const cache = new Cache(options);

      cache.keys = [
        [
          {
            bar: 'baz',
            baz: 'quz',
          },
        ],
      ];

      const keyToMatch = [
        {
          bar: 'baz',
          foo: 'bar',
        },
      ];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });

    it('will return -1 if the isMatchingKey method is passed and no match is found with a larger maxSize', () => {
      const isEqual = (o1: any, o2: any) => o1 === o2;
      const isMatchingKey = (o1: any, o2: any) => {
        const existingKey = o1[0];
        const key = o2[0];

        return (
          has(existingKey, 'foo') &&
          has(key, 'foo') &&
          (existingKey.bar === 'bar' || key.bar === 'baz')
        );
      };

      const options = mockNormalizedOptions({
        isEqual,
        isMatchingKey,
        maxSize: 2,
      });

      const cache = new Cache(options);

      cache.keys = [
        [
          {
            bar: 'baz',
            baz: 'quz',
          },
          {
            baz: 'quz',
            quz: 'blah',
          },
        ],
      ];

      const keyToMatch = [
        {
          bar: 'baz',
          foo: 'bar',
        },
      ];

      const result = cache.getKeyIndex(keyToMatch);

      expect(result).toEqual(-1);
    });
  });

  describe('orderByLru', () => {
    it('will do nothing if the itemIndex is 0', () => {
      const options = mockNormalizedOptions({
        maxSize: 3,
      });

      const cache = new Cache(options);

      cache.keys = [['first'], ['second'], ['third']];
      cache.values = ['first', 'second', 'third'];

      const itemIndex = 0;
      const key = cache.keys[itemIndex]!;
      const value = cache.values[itemIndex];

      cache.orderByLru(key, value, itemIndex);

      expect(cache.snapshot).toEqual({
        keys: [['first'], ['second'], ['third']],
        size: 3,
        values: ['first', 'second', 'third'],
      });
    });

    it('will place the itemIndex first in order when non-zero', () => {
      const options = mockNormalizedOptions({ maxSize: 3 });

      const cache = new Cache(options);

      cache.keys = [['first'], ['second'], ['third']];
      cache.values = ['first', 'second', 'third'];

      const itemIndex = 1;
      const key = cache.keys[itemIndex]!;
      const value = cache.values[itemIndex];

      cache.orderByLru(key, value, itemIndex);

      expect(cache.snapshot).toEqual({
        keys: [['second'], ['first'], ['third']],
        size: 3,
        values: ['second', 'first', 'third'],
      });
    });

    it('will add the new item to the array and remove the last when the itemIndex is the array length', () => {
      const options = mockNormalizedOptions({ maxSize: 10 });

      const cache = new Cache(options);

      cache.keys = [['first'], ['second'], ['third']];
      cache.values = ['first', 'second', 'third'];

      const itemIndex = cache.keys.length;
      const key = ['key'];
      const value = 'new';

      cache.orderByLru(key, value, itemIndex);

      expect(cache.snapshot).toEqual({
        keys: [key, ['first'], ['second'], ['third']],
        size: 4,
        values: [value, 'first', 'second', 'third'],
      });
    });

    it('will truncate the cache to the max size if too large by manual additions', () => {
      const options = mockNormalizedOptions({ maxSize: 2 });

      const cache = new Cache(options);

      cache.keys = [['first'], ['second'], ['third']];
      cache.values = ['first', 'second', 'third'];

      const itemIndex = cache.keys.length;
      const key = ['key'];
      const value = 'new';

      cache.orderByLru(key, value, itemIndex);

      expect(cache.snapshot).toEqual({
        keys: [key, ['first']],
        size: 2,
        values: [value, 'first'],
      });
    });
  });

  describe('updateAsyncCache', () => {
    it('will handle being settled', async () => {
      const timeout = 200;

      const fn = async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, timeout);
        });

        return 'resolved';
      };
      const key = ['foo'];
      const memoized = (() => {}) as unknown as Memoized<AnyFn>;

      const value = fn();

      const options = mockNormalizedOptions({
        isEqual: isSameValueZero,
        isPromise: true,
      });

      const cache = new Cache(options);

      cache.keys = [key];
      cache.values = [value];

      cache.updateAsyncCache(memoized);

      // this is just to prevent the unhandled rejection noise
      cache.values[0].catch(() => {});

      expect(cache.snapshot).toEqual({
        keys: [key],
        size: 1,
        values: [value],
      });

      await new Promise((resolve) => {
        setTimeout(resolve, timeout + 50);
      });

      expect(cache.snapshot).toEqual({
        keys: [key],
        size: 1,
        values: [value],
      });
    });

    it('will fire cache callbacks if resolved', async () => {
      const timeout = 200;

      const fn = async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, timeout);
        });

        return 'resolved';
      };
      const key = ['foo'];
      const memoized = (() => {}) as unknown as Memoized<AnyFn>;

      const value = fn();

      const options = mockNormalizedOptions({
        isEqual: isSameValueZero,
        isPromise: true,
        onCacheChange: jest.fn(),
        onCacheHit: jest.fn(),
      });

      const cache = new Cache(options);

      cache.keys = [key];
      cache.values = [value];

      cache.updateAsyncCache(memoized);

      // this is just to prevent the unhandled rejection noise
      cache.values[0].catch(() => {});

      expect(cache.snapshot).toEqual({
        keys: [key],
        size: 1,
        values: [value],
      });

      await new Promise((resolve) => {
        setTimeout(resolve, timeout + 50);
      });

      expect(cache.snapshot).toEqual({
        keys: [key],
        size: 1,
        values: [value],
      });

      expect(options.onCacheHit).toHaveBeenCalledTimes(1);
      expect(options.onCacheHit).toHaveBeenCalledWith(cache, options, memoized);

      expect(options.onCacheChange).toHaveBeenCalledTimes(1);
      expect(options.onCacheChange).toHaveBeenCalledWith(
        cache,
        options,
        memoized,
      );
    });

    it('will remove the key from cache when the promise is rejected', async () => {
      const timeout = 200;

      const fn = async () => {
        await new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('boom')), timeout);
        });
      };
      const key = ['foo'];
      const value = fn();

      const options = mockNormalizedOptions({
        isEqual: isSameValueZero,
        isPromise: true,
        onCacheChange: jest.fn(),
        onCacheHit: jest.fn(),
      });

      const cache = new Cache(options);

      cache.keys = [key];
      cache.values = [value];

      const memoized = (() => {}) as unknown as Memoized<AnyFn>;

      cache.updateAsyncCache(memoized);

      const catcher = jest.fn();

      cache.values[0].catch(catcher);

      expect(cache.snapshot).toEqual({
        keys: [key],
        size: 1,
        values: [value],
      });

      await new Promise((resolve) => {
        setTimeout(resolve, timeout + 50);
      });

      expect(catcher).toHaveBeenCalledTimes(1);

      expect(cache.snapshot).toEqual({
        keys: [],
        size: 0,
        values: [],
      });

      expect(options.onCacheHit).toHaveBeenCalledTimes(0);
      expect(options.onCacheChange).toHaveBeenCalledTimes(0);
    });

    it('will not remove the key from cache when the promise is rejected but the key no longer exists', async () => {
      const timeout = 200;

      const fn = async () => {
        await new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('boom')), timeout);
        });
      };
      const key = ['foo'];
      const value = fn();

      const options = mockNormalizedOptions({
        isEqual: isSameValueZero,
        isPromise: true,
        onCacheChange: jest.fn(),
        onCacheHit: jest.fn(),
      });

      const cache = new Cache(options);

      cache.keys = [key];
      cache.values = [value];

      const memoized = (() => {}) as unknown as Memoized<AnyFn>;

      cache.updateAsyncCache(memoized);

      const newValue = cache.values[0];

      const catcher = jest.fn();

      newValue.catch(catcher);

      expect(cache.snapshot).toEqual({
        keys: [key],
        size: 1,
        values: [value],
      });

      cache.keys = [['bar']];

      cache.values = [Promise.resolve('baz')];

      await new Promise((resolve) => {
        setTimeout(resolve, timeout + 50);
      });

      expect(catcher).toHaveBeenCalledTimes(1);

      expect(options.onCacheHit).toHaveBeenCalledTimes(0);
      expect(options.onCacheChange).toHaveBeenCalledTimes(0);
    });
  });
});
