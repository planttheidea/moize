/* eslint-disable @typescript-eslint/no-empty-function */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { moize, startCollectingStats, stopCollectingStats } from '../index.js';

const foo = 'foo';
const bar = 'bar';
const _default = 'default';

const method = vi.fn(function (one: string, two: string) {
    return { one, two };
});

const methodDefaulted = vi.fn(function (one: string, two = _default) {
    return { one, two };
});

const memoized = moize(method);
const memoizedDefaulted = moize(methodDefaulted);

afterEach(() => {
    vi.clearAllMocks();

    memoized.cache.clear();
    memoized.clearStats();

    memoizedDefaulted.cache.clear();
    memoizedDefaulted.clearStats();

    stopCollectingStats();
});

describe('main', () => {
    test('should handle a standard use-case', () => {
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

    test('should handle default parameters', () => {
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

    test('should handle a curried call of options creation', () => {
        const moizer = moize({ serialize: true })({ maxSize: 5 })({
            expires: 1000,
        });

        expect(moizer).toBeInstanceOf(Function);

        const moized = moizer(vi.fn());

        expect(moized.options).toEqual(
            expect.objectContaining({
                serialize: true,
                expires: 1000,
                maxSize: 5,
            }),
        );
    });

    test('should handle moizing an already-moized function with additional options', () => {
        const moized = moize(memoized, { maxSize: 5 });

        expect(moized.fn).toBe(memoized.fn);
        expect(moized.options).toEqual({
            ...memoized.options,
            maxSize: 5,
        });
    });

    test('should copy static properties from the source function', () => {
        const fn = (a: any, b: any) => [a, b];

        fn.foo = 'bar';

        const memoized = moize(fn);

        expect(memoized.foo).toBe(fn.foo);
    });
});

describe('cache manipulation', () => {
    test('should add an entry to cache if it does not exist', () => {
        memoized(foo, bar);

        const value = { one: 'something', two: 'else' };

        memoized.cache.set([bar, foo], value);

        expect(memoized.cache.snapshot).toEqual({
            entries: [[[bar, foo], value]],
            keys: [[bar, foo]],
            size: 1,
            values: [value],
        });
    });

    test('should add an entry to cache and remove the oldest one', () => {
        const singleMemoized = moize(method);

        singleMemoized(foo, bar);

        const value = { one: 'something', two: 'else' };

        singleMemoized.cache.set([bar, foo], value);

        expect(singleMemoized.cache.snapshot).toEqual({
            entries: [[[bar, foo], value]],
            keys: [[bar, foo]],
            size: 1,
            values: [value],
        });
    });

    test('should notify of cache manipulation when adding', () => {
        const withNotifiers = moize(memoized);

        const onAddSpy = vi.fn();
        const onDeleteSpy = vi.fn();

        withNotifiers.cache.on('add', onAddSpy);
        withNotifiers.cache.on('delete', onDeleteSpy);

        withNotifiers(foo, bar);

        const value = { one: 'something', two: 'else' };

        withNotifiers.cache.set([bar, foo], value);

        expect(withNotifiers.cache.snapshot).toEqual({
            entries: [[[bar, foo], value]],
            keys: [[bar, foo]],
            size: 1,
            values: [value],
        });

        expect(onAddSpy).toHaveBeenNthCalledWith(1, {
            cache: withNotifiers.cache,
            key: ['foo', 'bar'],
            reason: undefined,
            type: 'add',
            value: { one: 'foo', two: 'bar' },
        });
        expect(onAddSpy).toHaveBeenNthCalledWith(2, {
            cache: withNotifiers.cache,
            key: ['bar', 'foo'],
            reason: 'explicit set',
            type: 'add',
            value: { one: 'something', two: 'else' },
        });
        expect(onDeleteSpy).toHaveBeenCalledTimes(1);
        expect(onDeleteSpy).toHaveBeenCalledWith({
            cache: withNotifiers.cache,
            key: ['foo', 'bar'],
            reason: 'evicted',
            type: 'delete',
            value: { one: 'foo', two: 'bar' },
        });
    });

    test('should update an entry to cache if it exists', () => {
        memoized(foo, bar);

        const value = { one: 'something', two: 'else' };

        memoized.cache.set([foo, bar], value);

        expect(memoized.cache.snapshot).toEqual({
            entries: [[[foo, bar], value]],
            keys: [[foo, bar]],
            size: 1,
            values: [value],
        });
    });

    test('should notify of cache manipulation when updating', () => {
        const withNotifiers = moize(memoized);

        const onUpdateSpy = vi.fn();
        withNotifiers.cache.on('update', onUpdateSpy);

        withNotifiers(foo, bar);

        const value = { one: 'something', two: 'else' };

        withNotifiers.cache.set([foo, bar], value);

        expect(withNotifiers.cache.snapshot).toEqual({
            entries: [[[foo, bar], value]],
            keys: [[foo, bar]],
            size: 1,
            values: [value],
        });

        expect(onUpdateSpy).toHaveBeenCalledWith({
            cache: withNotifiers.cache,
            key: [foo, bar],
            reason: 'explicit set',
            type: 'update',
            value: { one: 'something', two: 'else' },
        });
    });

    test('should get the entry in cache if it exists', () => {
        const result = memoized(foo, bar);

        expect(memoized.cache.get([foo, bar])).toBe(result);
        expect(memoized.cache.get([bar, foo])).toBe(undefined);
    });

    test('should correctly identify the entry in cache if it exists', () => {
        memoized(foo, bar);

        expect(memoized.cache.has([foo, bar])).toBe(true);
        expect(memoized.cache.has([bar, foo])).toBe(false);
    });

    test('should remove the entry in cache if it exists', () => {
        memoized(foo, bar);

        expect(memoized.cache.has([foo, bar])).toBe(true);

        const result = memoized.cache.delete([foo, bar]);

        expect(memoized.cache.has([foo, bar])).toBe(false);
        expect(result).toBe(true);
    });

    test('should not remove the entry in cache if does not exist', () => {
        memoized(foo, bar);

        expect(memoized.cache.has([bar, foo])).toBe(false);

        const result = memoized.cache.delete([bar, foo]);

        expect(memoized.cache.has([bar, foo])).toBe(false);
        expect(memoized.cache.has([foo, bar])).toBe(true);
        expect(result).toBe(false);
    });

    test('should notify of cache change on removal and clear the expiration', () => {
        const expiringMemoized = moize(method, { expires: 2000 });

        const onDeleteSpy = vi.fn();
        expiringMemoized.cache.on('delete', onDeleteSpy);

        expiringMemoized(foo, bar);

        expect(expiringMemoized.cache.has([foo, bar])).toBe(true);
        expect(expiringMemoized.expirationManager?.size).toBe(1);

        const result = expiringMemoized.cache.delete([foo, bar]);

        expect(expiringMemoized.cache.has([foo, bar])).toBe(false);
        expect(result).toBe(true);

        expect(onDeleteSpy).toHaveBeenCalledWith({
            cache: expiringMemoized.cache,
            key: [foo, bar],
            reason: 'explicit delete',
            type: 'delete',
            value: { one: 'foo', two: 'bar' },
        });

        expect(expiringMemoized.expirationManager?.size).toBe(0);
    });

    test('should clear the cache', () => {
        memoized(foo, bar);

        expect(memoized.cache.has([foo, bar])).toBe(true);

        memoized.cache.clear();

        expect(memoized.cache.size).toBe(0);

        expect(memoized.cache.has([foo, bar])).toBe(false);
    });

    test('should notify of the cache change on clear', () => {
        const changeMemoized = moize(method);

        const onDeleteSpy = vi.fn();
        changeMemoized.cache.on('delete', onDeleteSpy);

        changeMemoized(foo, bar);

        expect(changeMemoized.cache.has([foo, bar])).toBe(true);

        changeMemoized.cache.clear();

        expect(memoized.cache.size).toBe(0);

        expect(changeMemoized.cache.has([foo, bar])).toBe(false);

        expect(onDeleteSpy).toHaveBeenCalledWith({
            cache: changeMemoized.cache,
            key: [foo, bar],
            reason: 'explicit clear',
            type: 'delete',
            value: { one: 'foo', two: 'bar' },
        });
    });

    test('should allow stats management of the method', () => {
        startCollectingStats();

        const profiled = moize(memoized, { statsName: 'profiled' });

        profiled(foo, bar);
        profiled(foo, bar);
        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 4,
            hits: 3,
            name: 'profiled',
            usage: '75.0000%',
        });

        profiled.clearStats();

        expect(profiled.getStats()).toEqual({
            calls: 0,
            hits: 0,
            name: 'profiled',
            usage: '0.0000%',
        });
    });
});

describe('properties', () => {
    test('should have cache', () => {
        memoized(foo, bar);

        expect(memoized.cache.size).toBe(1);
    });

    test('should have expirations', () => {
        const expiringMemoized = moize(method, {
            expires: 2000,
        });

        expiringMemoized(foo, bar);

        const timeout = setTimeout(() => {}, 0);

        expect(
            Array.from(expiringMemoized.expirationManager?.e.entries() || []),
        ).toEqual([[[foo, bar], expect.any(timeout.constructor)]]);
    });

    test('should have the original function', () => {
        expect(memoized.fn).toBe(method);
    });
});

describe('edge cases', () => {
    test('should wrap the original function name', () => {
        function myNamedFunction() {}

        const memoized = moize(myNamedFunction);

        expect(memoized.name).toBe('moized(myNamedFunction)');
    });

    test('should use the `statsName` when owne name is not provided', () => {
        const memoized = moize(function () {}, {
            statsName: 'custom profile name',
        });

        expect(memoized.name).toBe('moized(custom profile name)');
    });

    test('should have an ultimate fallback for an anonymous function', () => {
        const memoized = moize(() => {});

        expect(memoized.name).toBe('moized(anonymous)');
    });
});
