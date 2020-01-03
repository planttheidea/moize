import moize, { Moized } from '../src/index';

const foo = 'foo';
const bar = 'bar';
const _default = 'default';

const method = jest.fn(function(one: string, two: string) {
  return { one, two };
});

const methodDefaulted = jest.fn(function(one: string, two = _default) {
  return { one, two };
});

const memoized = moize.infinite(method);
const memoizedDefaulted = moize.infinite(methodDefaulted);

describe('moize', () => {
  afterEach(() => {
    jest.clearAllMocks();

    memoized.clear();
    memoized.clearStats();

    memoizedDefaulted.clear();
    memoizedDefaulted.clearStats();

    moize.collectStats(false);
  });

  describe('main', () => {
    it('should handle a standard use-case', () => {
      const result = memoized(foo, bar);

      expect(result).toEqual({ one: foo, two: bar });

      expect(method).toHaveBeenCalled();

      method.mockClear();

      let newResult;

      for (let index = 0; index < 10; index++) {
        newResult = memoized(foo, bar);

        expect(newResult).toEqual({ one: foo, two: bar });
        expect(method).not.toHaveBeenCalled();
      }
    });

    it('should handle default parameters', () => {
      const result = memoizedDefaulted(foo);

      expect(result).toEqual({ one: foo, two: _default });

      expect(methodDefaulted).toHaveBeenCalled();

      methodDefaulted.mockClear();

      let newResult;

      for (let index = 0; index < 10; index++) {
        newResult = memoizedDefaulted(foo);

        expect(newResult).toEqual({ one: foo, two: _default });
        expect(methodDefaulted).not.toHaveBeenCalled();
      }
    });

    it('should handle a curried call of options creation', () => {
      const moizer = moize({ isSerialized: true })({ maxSize: 5 })({ maxAge: 1000 });

      expect(moizer).toBeInstanceOf(Function);

      const moized = moizer(jest.fn());

      expect(moized.options).toEqual(
        expect.objectContaining({
          isSerialized: true,
          maxAge: 1000,
          maxSize: 5,
        })
      );
    });

    it('should handle moizing an already-moized function with additional options', () => {
      const moized = moize(memoized, { maxSize: 5 });

      expect(moized.originalFunction).toBe(memoized.originalFunction);
      expect(moized.options).toEqual({
        ...memoized.options,
        maxSize: 5,
      });
    });
  });

  describe('cache manipulation', () => {
    it('should add an entry to cache if it does not exist', () => {
      memoized(foo, bar);

      const value = 'something else';

      memoized.set([bar, foo], value);

      expect(memoized.cacheSnapshot).toEqual({
        keys: [
          [bar, foo],
          [foo, bar],
        ],
        size: 2,
        values: [value, { one: foo, two: bar }],
      });
    });

    it('should notify of cache manipulation when adding', () => {
      // eslint-disable-next-line prefer-const
      let withNotifiers: Moized;

      const onCacheOperation = jest.fn(function(cache, options, moized) {
        expect(cache).toBe(withNotifiers.cache);
        expect(options).toBe(withNotifiers.options);
        expect(moized).toBe(withNotifiers);
      });

      withNotifiers = moize(memoized, {
        onCacheAdd: onCacheOperation,
        onCacheChange: onCacheOperation,
      });

      withNotifiers(foo, bar);

      const value = 'something else';

      withNotifiers.set([bar, foo], value);

      expect(withNotifiers.cacheSnapshot).toEqual({
        keys: [
          [bar, foo],
          [foo, bar],
        ],
        size: 2,
        values: [value, { one: foo, two: bar }],
      });

      expect(withNotifiers.options.onCacheAdd).toHaveBeenCalled();
      expect(withNotifiers.options.onCacheChange).toHaveBeenCalled();
    });

    it('should update an entry to cache if it exists', () => {
      memoized(foo, bar);

      const value = 'something else';

      memoized.set([foo, bar], value);

      expect(memoized.cacheSnapshot).toEqual({
        keys: [[foo, bar]],
        size: 1,
        values: [value],
      });
    });

    it('should order the cache by LRU when updating', () => {
      memoized(foo, bar);
      memoized(bar, foo);

      expect(memoized.cacheSnapshot).toEqual({
        keys: [
          [bar, foo],
          [foo, bar],
        ],
        size: 2,
        values: [
          { one: bar, two: foo },
          { one: foo, two: bar },
        ],
      });

      const value = 'something else';

      memoized.set([foo, bar], value);

      expect(memoized.cacheSnapshot).toEqual({
        keys: [
          [foo, bar],
          [bar, foo],
        ],
        size: 2,
        values: [value, { one: bar, two: foo }],
      });
    });

    it('should notify of cache manipulation when updating', () => {
      const withNotifiers = moize(memoized, {
        onCacheChange: jest.fn(function(cache, options, moized) {
          expect(cache).toBe(withNotifiers.cache);
          expect(options).toBe(withNotifiers.options);
          expect(moized).toBe(withNotifiers);
        }),
      });

      withNotifiers(foo, bar);

      const value = 'something else';

      withNotifiers.set([foo, bar], value);

      expect(withNotifiers.cacheSnapshot).toEqual({
        keys: [[foo, bar]],
        size: 1,
        values: [value],
      });

      expect(withNotifiers.options.onCacheChange).toHaveBeenCalled();
    });

    it('should get the entry in cache if it exists', () => {
      const result = memoized(foo, bar);

      expect(memoized.get([foo, bar])).toBe(result);
      expect(memoized.get([bar, foo])).toBe(undefined);
    });

    it('should correctly identify the entry in cache if it exists', () => {
      memoized(foo, bar);

      expect(memoized.has([foo, bar])).toBe(true);
      expect(memoized.has([bar, foo])).toBe(false);
    });

    it('should have the keys and values from cache', () => {
      memoized(foo, bar);

      const cache = memoized.cacheSnapshot;

      expect(memoized.keys()).toEqual(cache.keys);
      expect(memoized.values()).toEqual(cache.values);
    });

    it('should allow stats management of the method', () => {
      moize.collectStats();

      const profiled = moize(memoized, { profileName: 'profiled' });

      profiled(foo, bar);
      profiled(foo, bar);
      profiled(foo, bar);
      profiled(foo, bar);

      expect(profiled.getStats()).toEqual({
        calls: 4,
        hits: 3,
        usage: '75.0000%',
      });

      profiled.clearStats();

      expect(profiled.getStats()).toEqual({
        calls: 0,
        hits: 0,
        usage: '0.0000%',
      });
    });
  });
});
