import { deepEqual } from 'fast-equals';
import memoize from '../src';
import { isSameValueZero } from '../src/utils';

const has = (object: any, property: string) =>
  Object.prototype.hasOwnProperty.call(object, property);

describe('memoize', () => {
  it('will return the memoized function', () => {
    let callCount = 0;

    const fn = (one: any, two: any) => {
      callCount++;

      return {
        one,
        two,
      };
    };

    const memoized = memoize(fn);

    expect(memoized.cache.snapshot).toEqual({
      keys: [],
      size: 0,
      values: [],
    });
    expect(memoized.cache.snapshot).toEqual({
      keys: [],
      size: 0,
      values: [],
    });

    expect(memoized.isMemoized).toEqual(true);

    expect(memoized.options).toEqual({
      isEqual: isSameValueZero,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: 1,
      transformKey: undefined,
    });

    new Array(1000).fill('z').forEach(() => {
      const result = memoized('one', 'two');

      expect(result).toEqual({
        one: 'one',
        two: 'two',
      });
    });

    expect(callCount).toEqual(1);

    expect(memoized.cache.snapshot).toEqual({
      keys: [['one', 'two']],
      size: 1,
      values: [
        {
          one: 'one',
          two: 'two',
        },
      ],
    });
  });

  it('will return the memoized function that can have multiple cached key => value pairs', () => {
    let callCount = 0;

    const fn = (one: any, two: any) => {
      callCount++;

      return {
        one,
        two,
      };
    };
    const maxSize = 3;

    const memoized = memoize(fn, { maxSize });

    expect(memoized.cache.snapshot).toEqual({
      keys: [],
      size: 0,
      values: [],
    });

    expect(memoized.cache.snapshot).toEqual({
      keys: [],
      size: 0,
      values: [],
    });

    expect(memoized.isMemoized).toEqual(true);

    expect(memoized.options.maxSize).toEqual(maxSize);

    expect(memoized('one', 'two')).toEqual({
      one: 'one',
      two: 'two',
    });
    expect(memoized('two', 'three')).toEqual({
      one: 'two',
      two: 'three',
    });
    expect(memoized('three', 'four')).toEqual({
      one: 'three',
      two: 'four',
    });
    expect(memoized('four', 'five')).toEqual({
      one: 'four',
      two: 'five',
    });
    expect(memoized('two', 'three')).toEqual({
      one: 'two',
      two: 'three',
    });
    expect(memoized('three', 'four')).toEqual({
      one: 'three',
      two: 'four',
    });

    expect(callCount).toEqual(4);

    expect(memoized.cache.snapshot).toEqual({
      keys: [
        ['three', 'four'],
        ['two', 'three'],
        ['four', 'five'],
      ],
      size: 3,
      values: [
        {
          one: 'three',
          two: 'four',
        },
        {
          one: 'two',
          two: 'three',
        },
        {
          one: 'four',
          two: 'five',
        },
      ],
    });
  });

  it('will return the memoized function that will use the custom isEqual method', () => {
    let callCount = 0;

    const fn = (one: any, two: any) => {
      callCount++;

      return {
        one,
        two,
      };
    };

    const memoized = memoize(fn, { isEqual: deepEqual });

    expect(memoized.options.isEqual).toBe(deepEqual);

    expect(
      memoized(
        { deep: { value: 'value' } },
        { other: { deep: { value: 'value' } } },
      ),
    ).toEqual({
      one: { deep: { value: 'value' } },
      two: { other: { deep: { value: 'value' } } },
    });

    expect(
      memoized(
        { deep: { value: 'value' } },
        { other: { deep: { value: 'value' } } },
      ),
    ).toEqual({
      one: { deep: { value: 'value' } },
      two: { other: { deep: { value: 'value' } } },
    });

    expect(callCount).toEqual(1);

    expect(memoized.cache.snapshot).toEqual({
      keys: [
        [{ deep: { value: 'value' } }, { other: { deep: { value: 'value' } } }],
      ],
      size: 1,
      values: [
        {
          one: { deep: { value: 'value' } },
          two: { other: { deep: { value: 'value' } } },
        },
      ],
    });
  });

  it('will return the memoized function that will use the transformKey method', () => {
    let callCount = 0;

    const fn = (one: any, two: any) => {
      callCount++;

      return {
        one,
        two,
      };
    };
    const transformKey = function (args: any[]) {
      return [JSON.stringify(args)];
    };

    const memoized = memoize(fn, { transformKey });

    expect(memoized.options.transformKey).toBe(transformKey);

    const fnArg1 = () => {};
    const fnArg2 = () => {};
    const fnArg3 = () => {};

    expect(memoized({ one: 'one' }, fnArg1)).toEqual({
      one: { one: 'one' },
      two: fnArg1,
    });
    expect(memoized({ one: 'one' }, fnArg2)).toEqual({
      one: { one: 'one' },
      two: fnArg1,
    });
    expect(memoized({ one: 'one' }, fnArg3)).toEqual({
      one: { one: 'one' },
      two: fnArg1,
    });

    expect(callCount).toEqual(1);

    expect(memoized.cache.snapshot).toEqual({
      keys: [['[{"one":"one"},null]']],
      size: 1,
      values: [
        {
          one: { one: 'one' },
          two: fnArg1,
        },
      ],
    });
  });

  it('will return the memoized function that will use the transformKey method with a custom isEqual', () => {
    let callCount = 0;

    const fn = (one: any, two: any) => {
      callCount++;

      return {
        one,
        two,
      };
    };
    const isEqual = function (key1: any, key2: any) {
      return key1.args === key2.args;
    };
    const transformKey = function (args: any[]) {
      return [
        {
          args: JSON.stringify(args),
        },
      ];
    };

    const memoized = memoize(fn, {
      isEqual,
      transformKey,
    });

    expect(memoized.options.isEqual).toBe(isEqual);
    expect(memoized.options.transformKey).toBe(transformKey);

    const fnArg1 = () => {};
    const fnArg2 = () => {};
    const fnArg3 = () => {};

    expect(memoized({ one: 'one' }, fnArg1)).toEqual({
      one: { one: 'one' },
      two: fnArg1,
    });
    expect(memoized({ one: 'one' }, fnArg2)).toEqual({
      one: { one: 'one' },
      two: fnArg1,
    });
    expect(memoized({ one: 'one' }, fnArg3)).toEqual({
      one: { one: 'one' },
      two: fnArg1,
    });

    expect(callCount).toEqual(1);

    expect(memoized.cache.snapshot).toEqual({
      keys: [
        [
          {
            args: '[{"one":"one"},null]',
          },
        ],
      ],
      size: 1,
      values: [
        {
          one: { one: 'one' },
          two: fnArg1,
        },
      ],
    });
  });

  it('will return a memoized method that will auto-remove the key from cache if isPromise is true and the promise is rejected', async () => {
    const timeout = 200;

    const error = new Error('boom');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fn = async (_ignored: string) => {
      await new Promise((resolve) => {
        setTimeout(resolve, timeout);
      });

      throw error;
    };
    const isPromise = true;

    const memoized = memoize(fn, { isPromise });

    expect(memoized.options.isPromise).toEqual(isPromise);

    const spy = jest.fn();

    memoized('foo').catch(spy);

    expect(memoized.cache.snapshot.keys.length).toEqual(1);
    expect(memoized.cache.snapshot.values.length).toEqual(1);

    await new Promise((resolve) => {
      setTimeout(resolve, timeout + 50);
    });

    expect(memoized.cache.snapshot).toEqual({
      keys: [],
      size: 0,
      values: [],
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(error);
  });

  it('will fire the onCacheChange method passed with the cache when it is added to', () => {
    const fn = (one: string, two: string) => ({ one, two });
    const onCacheChange = jest.fn();

    const memoized = memoize(fn, { onCacheChange });

    expect(memoized.options.onCacheChange).toBe(onCacheChange);

    memoized('foo', 'bar');

    expect(onCacheChange).toHaveBeenCalledTimes(1);
    expect(onCacheChange).toHaveBeenCalledWith(
      memoized.cache,
      {
        onCacheChange,
        isEqual: isSameValueZero,
        isMatchingKey: undefined,
        isPromise: false,
        maxSize: 1,
        transformKey: undefined,
      },
      memoized,
    );
  });

  it('will fire the onCacheChange method passed with the cache when it is updated', () => {
    const fn = (one: string, two: string) => ({ one, two });
    const onCacheChange = jest.fn();
    const maxSize = 2;

    const memoized = memoize(fn, {
      maxSize,
      onCacheChange,
    });

    expect(memoized.options.onCacheChange).toBe(onCacheChange);

    memoized('foo', 'bar');

    expect(onCacheChange).toHaveBeenCalledTimes(1);
    expect(onCacheChange).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheChange.mockReset();

    memoized('bar', 'foo');

    expect(onCacheChange).toHaveBeenCalledTimes(1);
    expect(onCacheChange).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheChange.mockReset();

    memoized('bar', 'foo');

    expect(onCacheChange).toHaveBeenCalledTimes(0);

    onCacheChange.mockReset();

    memoized('foo', 'bar');

    expect(onCacheChange).toHaveBeenCalledTimes(1);
    expect(onCacheChange).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheChange.mockReset();

    memoized('foo', 'bar');

    expect(onCacheChange).toHaveBeenCalledTimes(0);
  });

  it('will not fire the onCacheHit method passed with the cache when it is added to', () => {
    const fn = (one: string, two: string) => ({ one, two });
    const onCacheHit = jest.fn();

    const memoized = memoize(fn, { onCacheHit });

    expect(memoized.options.onCacheHit).toBe(onCacheHit);

    memoized('foo', 'bar');

    expect(onCacheHit).toHaveBeenCalledTimes(0);
  });

  it('will fire the onCacheHit method passed with the cache when it is updated', () => {
    const fn = (one: any, two: any) => ({
      one,
      two,
    });
    const onCacheHit = jest.fn();
    const maxSize = 2;

    const memoized = memoize(fn, {
      maxSize,
      onCacheHit,
    });

    expect(memoized.options.onCacheHit).toBe(onCacheHit);

    memoized('foo', 'bar');

    expect(onCacheHit).toHaveBeenCalledTimes(0);

    memoized('bar', 'foo');

    expect(onCacheHit).toHaveBeenCalledTimes(0);

    memoized('bar', 'foo');

    expect(onCacheHit).toHaveBeenCalledTimes(1);
    expect(onCacheHit).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheHit.mockReset();

    memoized('foo', 'bar');

    expect(onCacheHit).toHaveBeenCalledTimes(1);
    expect(onCacheHit).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheHit.mockReset();

    memoized('foo', 'bar');

    expect(onCacheHit).toHaveBeenCalledTimes(1);
    expect(onCacheHit).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );
  });

  it('will fire the onCacheAdd method passed with the cache when it is added but not when hit', () => {
    const fn = (one: any, two: any) => ({
      one,
      two,
    });
    const onCacheAdd = jest.fn();

    const memoized = memoize(fn, { onCacheAdd });

    expect(memoized.options.onCacheAdd).toBe(onCacheAdd);

    memoized('foo', 'bar');

    expect(onCacheAdd).toHaveBeenCalledTimes(1);

    memoized('foo', 'bar');

    expect(onCacheAdd).toHaveBeenCalledTimes(1);
  });

  it('will fire the onCacheAdd method passed with the cache when it is added but never again', () => {
    const fn = (one: any, two: any) => ({
      one,
      two,
    });
    const onCacheAdd = jest.fn();
    const maxSize = 2;

    const memoized = memoize(fn, {
      maxSize,
      onCacheAdd,
    });

    expect(memoized.options.onCacheAdd).toBe(onCacheAdd);

    memoized('foo', 'bar');

    expect(onCacheAdd).toHaveBeenCalledTimes(1);
    expect(onCacheAdd).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheAdd.mockReset();

    memoized('bar', 'foo');

    expect(onCacheAdd).toHaveBeenCalledTimes(1);
    expect(onCacheAdd).toHaveBeenCalledWith(
      memoized.cache,
      memoized.options,
      memoized,
    );

    onCacheAdd.mockReset();

    memoized('bar', 'foo');

    expect(onCacheAdd).toHaveBeenCalledTimes(0);

    onCacheAdd.mockReset();

    memoized('foo', 'bar');

    expect(onCacheAdd).toHaveBeenCalledTimes(0);

    memoized('foo', 'bar');

    expect(onCacheAdd).toHaveBeenCalledTimes(0);
  });

  type Dictionary<Type> = {
    [key: string]: Type;
  };

  test('if recursive calls to self will be respected at runtime', () => {
    const calc = memoize(
      (
        object: { [key: string]: any },
        metadata: { c: number },
      ): Dictionary<any> =>
        Object.keys(object).reduce((totals: { [key: string]: number }, key) => {
          if (Array.isArray(object[key])) {
            totals[key] = object[key].map(
              (subObject: { [key: string]: number }) =>
                calc(subObject, metadata),
            );
          } else {
            totals[key] = object[key].a + object[key].b + metadata.c;
          }

          return totals;
        }, {}),
      {
        maxSize: 10,
      },
    );

    const data = {
      fifth: {
        a: 4,
        b: 5,
      },
      first: [
        {
          second: {
            a: 1,
            b: 2,
          },
        },
        {
          third: [
            {
              fourth: {
                a: 2,
                b: 3,
              },
            },
          ],
        },
      ],
    };
    const metadata = {
      c: 6,
    };

    const result1 = calc(data, metadata);
    const result2 = calc(data, metadata);

    expect(result1).toEqual(result2);
  });

  it('will re-memoize the function with merged options if already memoized', () => {
    const fn = () => {};

    const maxSize = 5;
    const isEqual = () => true;

    const memoized = memoize(fn, { maxSize });

    const reMemoized = memoize(memoized, { isEqual });

    expect(reMemoized).not.toBe(memoized);
    expect(reMemoized.options.maxSize).toBe(maxSize);
    expect(reMemoized.options.isEqual).toBe(isEqual);
  });

  it('will throw an error if not a function', () => {
    const fn = 123;

    expect(() => memoize(fn as any)).toThrow();
  });

  describe('documentation examples', () => {
    it('matches simple usage', () => {
      const assembleToObject = (one: string, two: string) => ({ one, two });

      const memoized = memoize(assembleToObject);

      const result1 = memoized('one', 'two');
      const result2 = memoized('one', 'two');

      expect(result1).toEqual({ one: 'one', two: 'two' });
      expect(result2).toBe(result1);
    });

    it('matches for option `isEqual`', () => {
      type ContrivedObject = {
        deep: string;
      };

      const deepObject = (object: {
        foo: ContrivedObject;
        bar: ContrivedObject;
        baz?: any;
      }) => ({
        foo: object.foo,
        bar: object.bar,
      });

      const memoizedDeepObject = memoize(deepObject, { isEqual: deepEqual });

      const result1 = memoizedDeepObject({
        foo: {
          deep: 'foo',
        },
        bar: {
          deep: 'bar',
        },
        baz: {
          deep: 'baz',
        },
      });
      const result2 = memoizedDeepObject({
        foo: {
          deep: 'foo',
        },
        bar: {
          deep: 'bar',
        },
        baz: {
          deep: 'baz',
        },
      });

      expect(result1).toEqual({
        foo: { deep: 'foo' },
        bar: { deep: 'bar' },
      });
      expect(result2).toBe(result1);
    });

    it('matches for option `isMatchingKey`', () => {
      type ContrivedObject = { foo: string; bar: number; baz: string };

      const deepObject = (object: ContrivedObject) => ({
        foo: object.foo,
        bar: object.bar,
      });

      const memoizedShape = memoize(deepObject, {
        // receives the full key in cache and the full key of the most recent call
        isMatchingKey(key1, key2) {
          const object1 = key1[0];
          const object2 = key2[0];

          return (
            has(object1, 'foo') &&
            has(object2, 'foo') &&
            object1.bar === object2.bar
          );
        },
      });

      const result1 = memoizedShape({ foo: 'foo', bar: 123, baz: 'baz' });
      const result2 = memoizedShape({ foo: 'foo', bar: 123, baz: 'baz' });

      expect(result1).toEqual({ foo: 'foo', bar: 123 });
      expect(result2).toBe(result1);
    });

    it('matches for option `isPromise`', (done) => {
      const fn = async (one: string, two: string) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(JSON.stringify({ one, two })));
          }, 500);
        });
      };

      const memoized = memoize(fn, { isPromise: true });

      const call = memoized('one', 'two');

      expect(memoized.cache.snapshot.keys).toEqual([['one', 'two']]);
      expect(memoized.cache.snapshot.values).toEqual([expect.any(Promise)]);

      call.catch((error) => {
        expect(memoized.cache.snapshot.keys).toEqual([]);
        expect(memoized.cache.snapshot.values).toEqual([]);

        expect(error).toEqual(new Error('{"one":"one","two":"two"}'));

        done();
      });
    });

    it('matches for option `maxSize`', () => {
      const manyPossibleArgs = jest.fn((one: string, two: string) => [
        one,
        two,
      ]);

      const memoized = memoize(manyPossibleArgs, { maxSize: 3 });

      memoized('one', 'two');
      memoized('two', 'three');
      memoized('three', 'four');

      expect(manyPossibleArgs).toHaveBeenCalledTimes(3);

      expect(memoized.cache.snapshot.keys).toEqual([
        ['three', 'four'],
        ['two', 'three'],
        ['one', 'two'],
      ]);
      expect(memoized.cache.snapshot.values).toEqual([
        ['three', 'four'],
        ['two', 'three'],
        ['one', 'two'],
      ]);

      manyPossibleArgs.mockClear();

      memoized('one', 'two');
      memoized('two', 'three');
      memoized('three', 'four');

      expect(manyPossibleArgs).not.toHaveBeenCalled();

      memoized('four', 'five');

      expect(manyPossibleArgs).toHaveBeenCalled();
    });

    it('matches for option `onCacheAdd`', () => {
      const fn = (one: string, two: string) => [one, two];
      const options = {
        maxSize: 2,
        onCacheAdd: jest.fn(),
      };

      const memoized = memoize(fn, options);

      memoized('foo', 'bar'); // cache has been added to
      memoized('foo', 'bar');
      memoized('foo', 'bar');

      expect(options.onCacheAdd).toHaveBeenCalledTimes(1);

      memoized('bar', 'foo'); // cache has been added to
      memoized('bar', 'foo');
      memoized('bar', 'foo');

      expect(options.onCacheAdd).toHaveBeenCalledTimes(2);

      memoized('foo', 'bar');
      memoized('foo', 'bar');
      memoized('foo', 'bar');

      expect(options.onCacheAdd).toHaveBeenCalledTimes(2);
    });

    it('matches for option `onCacheChange`', () => {
      const fn = (one: string, two: string) => [one, two];
      const options = {
        maxSize: 2,
        onCacheChange: jest.fn(),
      };

      const memoized = memoize(fn, options);

      memoized('foo', 'bar');
      memoized('foo', 'bar');
      memoized('foo', 'bar');

      expect(options.onCacheChange).toHaveBeenCalledTimes(1);

      memoized('bar', 'foo');
      memoized('bar', 'foo');
      memoized('bar', 'foo');

      expect(options.onCacheChange).toHaveBeenCalledTimes(2);

      memoized('foo', 'bar');
      memoized('foo', 'bar');
      memoized('foo', 'bar');

      expect(options.onCacheChange).toHaveBeenCalledTimes(3);
    });

    it('matches for option `onCacheHit`', () => {
      const fn = (one: string, two: string) => [one, two];
      const options = {
        maxSize: 2,
        onCacheHit: jest.fn(),
      };

      const memoized = memoize(fn, options);

      memoized('foo', 'bar');
      memoized('foo', 'bar');
      memoized('foo', 'bar');

      expect(options.onCacheHit).toHaveBeenCalledTimes(2);

      memoized('bar', 'foo');
      memoized('bar', 'foo');
      memoized('bar', 'foo');

      expect(options.onCacheHit).toHaveBeenCalledTimes(4);

      memoized('foo', 'bar');
      memoized('foo', 'bar');
      memoized('foo', 'bar');

      expect(options.onCacheHit).toHaveBeenCalledTimes(7);
    });

    it('matches for option `transformKey`', () => {
      const ignoreFunctionArg = jest.fn((one: string, two: () => void) => [
        one,
        two,
      ]);

      const memoized = memoize(ignoreFunctionArg, {
        isMatchingKey: (key1, key2) => key1[0] === key2[0],
        // Cache based on the serialized first parameter
        transformKey: (args) => [JSON.stringify(args[0])],
      });

      memoized('one', () => {});
      memoized('one', () => {});

      expect(ignoreFunctionArg).toHaveBeenCalledTimes(1);
    });
  });
});
