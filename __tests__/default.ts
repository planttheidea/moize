import { sameValueZeroEqual } from 'fast-equals';
import microMemoize from 'micro-memoize';
import moize, { Moized } from '../src/index';

const foo = 'foo';
const bar = 'bar';
const _default = 'default';

const method = jest.fn(function (one: string, two: string) {
    return { one, two };
});

const methodDefaulted = jest.fn(function (one: string, two = _default) {
    return { one, two };
});

const memoized = moize(method);
const memoizedDefaulted = moize(methodDefaulted);

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
            const moizer = moize({ isSerialized: true })({ maxSize: 5 })({
                maxAge: 1000,
            });

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
                keys: [[bar, foo]],
                size: 1,
                values: [value],
            });
        });

        it('should add an entry to cache and remove the oldest one', () => {
            const singleMemoized = moize(method);

            singleMemoized(foo, bar);

            const value = 'something else';

            singleMemoized.set([bar, foo], value);

            expect(singleMemoized.cacheSnapshot).toEqual({
                keys: [[bar, foo]],
                size: 1,
                values: [value],
            });
        });

        it('should notify of cache manipulation when adding', () => {
            // eslint-disable-next-line prefer-const
            let withNotifiers: Moized;

            const onCacheOperation = jest.fn(function (cache, options, moized) {
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
                keys: [[bar, foo]],
                size: 1,
                values: [value],
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

        it('should notify of cache manipulation when updating', () => {
            const withNotifiers = moize(memoized, {
                onCacheChange: jest.fn(function (cache, options, moized) {
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

        it('should remove the entry in cache if it exists', () => {
            memoized(foo, bar);

            expect(memoized.has([foo, bar])).toBe(true);

            const result = memoized.remove([foo, bar]);

            expect(memoized.has([foo, bar])).toBe(false);
            expect(result).toBe(true);
        });

        it('should not remove the entry in cache if does not exist', () => {
            memoized(foo, bar);

            expect(memoized.has([bar, foo])).toBe(false);

            const result = memoized.remove([bar, foo]);

            expect(memoized.has([bar, foo])).toBe(false);
            expect(memoized.has([foo, bar])).toBe(true);
            expect(result).toBe(false);
        });

        it('should notify of cache change on removal and clear the expiration', () => {
            const expiringMemoized = moize(method, {
                maxAge: 2000,
                onCacheChange: jest.fn(),
            });

            expiringMemoized(foo, bar);

            expect(expiringMemoized.has([foo, bar])).toBe(true);
            expect(expiringMemoized.expirations.length).toBe(1);

            const result = expiringMemoized.remove([foo, bar]);

            expect(expiringMemoized.has([foo, bar])).toBe(false);
            expect(result).toBe(true);

            expect(expiringMemoized.options.onCacheChange).toHaveBeenCalledWith(
                expiringMemoized.cache,
                expiringMemoized.options,
                expiringMemoized
            );

            expect(expiringMemoized.expirations.length).toBe(0);
        });

        it('should clear the cache', () => {
            memoized(foo, bar);

            expect(memoized.has([foo, bar])).toBe(true);

            const result = memoized.clear();

            expect(memoized.cache.size).toBe(0);

            expect(memoized.has([foo, bar])).toBe(false);
            expect(result).toBe(true);
        });

        it('should notify of the cache change on clear', () => {
            const changeMemoized = moize(method, {
                onCacheChange: jest.fn(),
            });

            changeMemoized(foo, bar);

            expect(changeMemoized.has([foo, bar])).toBe(true);

            const result = changeMemoized.clear();

            expect(memoized.cache.size).toBe(0);

            expect(changeMemoized.has([foo, bar])).toBe(false);
            expect(result).toBe(true);

            expect(changeMemoized.options.onCacheChange).toHaveBeenCalledWith(
                changeMemoized.cache,
                changeMemoized.options,
                changeMemoized
            );
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

    describe('properties', () => {
        it('should have the micro-memoize options', () => {
            const mmResult = microMemoize(method, { maxSize: 1 });

            const { isEqual, ...options } = memoized._microMemoizeOptions;
            const {
                isEqual: _isEqualIgnored,
                ...resultOptions
            } = mmResult.options;

            expect(options).toEqual(resultOptions);
            expect(isEqual).toBe(sameValueZeroEqual);
        });

        it('should have cache and cacheSnapshot', () => {
            memoized(foo, bar);

            expect(memoized.cache).toEqual(
                expect.objectContaining({
                    keys: [[foo, bar]],
                    values: [{ one: foo, two: bar }],
                })
            );
            expect(memoized.cache.size).toBe(1);

            expect(memoized.cacheSnapshot).toEqual(
                expect.objectContaining({
                    keys: [[foo, bar]],
                    values: [{ one: foo, two: bar }],
                })
            );
            expect(memoized.cacheSnapshot.size).toBe(1);
        });

        it('should have expirations and expirationsSnapshot', () => {
            const expiringMemoized = moize(method, {
                maxAge: 2000,
            });

            expiringMemoized(foo, bar);

            expect(expiringMemoized.expirations).toEqual([
                expect.objectContaining({
                    expirationMethod: expect.any(Function),
                    key: [foo, bar],
                    timeoutId: expect.any(Number),
                }),
            ]);

            expect(expiringMemoized.expirationsSnapshot).toEqual([
                expect.objectContaining({
                    expirationMethod: expect.any(Function),
                    key: [foo, bar],
                    timeoutId: expect.any(Number),
                }),
            ]);
        });

        it('should have the original function', () => {
            expect(memoized.originalFunction).toBe(method);
        });
    });
});
