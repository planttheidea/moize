import { describe, expect, test, vi } from 'vitest';
import { moize } from '../index.js';

// Have `vitest` ignore any rejection it sees.
process.on('unhandledRejection', () => undefined);

interface Type {
    number: number;
}

const method = (one: number, two: Type) => one + two.number;
const promiseMethodResolves = (one: number, two: Type) =>
    new Promise((resolve) =>
        setTimeout(() => {
            resolve(one + two.number);
        }, 100),
    );
const promiseMethodRejects =
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (one: number, two: Type) =>
        new Promise((resolve, reject) =>
            setTimeout(() => {
                reject(new Error('boom'));
            }, 100),
        );

describe('success', () => {
    test('will refresh the cache', () => {
        const moized = moize.maxSize(2)(method, {
            forceUpdate: (args) => args[1].number % 2 === 0,
        });

        const mutated = { number: 5 };

        const result = moized(6, mutated);

        expect(result).toBe(11);

        mutated.number = 11;

        const mutatedResult = moized(6, mutated);

        // Result was not recalculated because `forceUpdate` returned `false` and the values are
        // seen as unchanged.
        expect(mutatedResult).toBe(result);

        mutated.number = 10;

        const refreshedResult = moized(6, mutated);

        // Result was recalculated because `forceUpdate` returned `true`.
        expect(refreshedResult).not.toBe(result);
        expect(refreshedResult).toBe(16);

        const { keys, values } = moized.cache.snapshot;

        expect(keys).toEqual([[6, mutated]]);
        expect(values).toEqual([16]);
    });

    test('will refresh the cache based on external values', async () => {
        const mockMethod = vi.fn(method);

        let lastUpdate = Date.now();

        const moized = moize.maxSize(2)(mockMethod, {
            forceUpdate() {
                const now = Date.now();
                const last = lastUpdate;

                lastUpdate = now;

                return last + 100 < now;
            },
        });

        const mutated = { number: 5 };

        moized(6, mutated);
        moized(6, mutated);
        moized(6, mutated);

        expect(mockMethod).toHaveBeenCalledTimes(1);

        await new Promise((resolve) => setTimeout(resolve, 200));

        moized(6, mutated);

        expect(mockMethod).toHaveBeenCalledTimes(2);
    });

    test('will refresh the cache when used with promises', async () => {
        const moized = moize.maxSize(2)(promiseMethodResolves, {
            async: true,
            forceUpdate: (args) => args[1].number % 2 === 0,
        });

        const mutated = { number: 5 };

        const result = await moized(6, mutated);

        expect(result).toBe(11);

        mutated.number = 11;

        const mutatedResult = await moized(6, mutated);

        // Result was not recalculated because `forceUpdate` returned `false` and the values are
        // seen as unchanged.
        expect(mutatedResult).toBe(result);

        mutated.number = 10;

        const refreshedResult = await moized(6, mutated);

        // Result was recalculated because `forceUpdate` returned `true`.
        expect(refreshedResult).not.toBe(result);
        expect(refreshedResult).toBe(16);

        const cachedItem = moized.cache.get([6, mutated]);

        expect(cachedItem).toEqual(Promise.resolve(16));
    });

    test('will refresh the cache when used with custom key transformers', () => {
        interface ConditionalIncrement {
            force?: boolean;
        }

        let count = 0;

        const increment = (_?: ConditionalIncrement) => ++count;

        const moized = moize.maxSize(2)(increment, {
            forceUpdate: (args) => args[0]?.force === true,
            serialize: () => ['always same'],
        });

        expect(moized()).toBe(1);
        expect(moized()).toBe(1);
        expect(moized({ force: true })).toBe(2);
        expect(moized()).toBe(2);
    });

    test('will refresh the cache with shorthand', () => {
        const moized = moize.forceUpdate((args) => args[1].number % 2 === 0)(
            method,
        );

        const mutated = { number: 5 };

        const result = moized(6, mutated);

        expect(result).toBe(11);

        mutated.number = 11;

        const mutatedResult = moized(6, mutated);

        // Result was not recalculated because `forceUpdate` returned `false` and the values are
        // seen as unchanged.
        expect(mutatedResult).toBe(result);

        mutated.number = 10;

        const refreshedResult = moized(6, mutated);

        // Result was recalculated because `forceUpdate` returned `true`.
        expect(refreshedResult).not.toBe(result);
        expect(refreshedResult).toBe(16);

        const { keys, values } = moized.cache.snapshot;

        expect(keys).toEqual([[6, mutated]]);
        expect(values).toEqual([16]);
    });

    test('will refresh the cache with composed shorthand', () => {
        const moizer = moize({
            forceUpdate: (args) => args[1].number % 2 === 0,
            maxSize: 2,
        });
        const moized = moizer(method);

        const mutated = { number: 5 };

        const result = moized(6, mutated);

        expect(result).toBe(11);

        mutated.number = 11;

        const mutatedResult = moized(6, mutated);

        // Result was not recalculated because `forceUpdate` returned `false` and the values are
        // seen as unchanged.
        expect(mutatedResult).toBe(result);

        mutated.number = 10;

        const refreshedResult = moized(6, mutated);

        // Result was recalculated because `forceUpdate` returned `true`.
        expect(refreshedResult).not.toBe(result);
        expect(refreshedResult).toBe(16);

        const { keys, values } = moized.cache.snapshot;

        expect(keys).toEqual([[6, mutated]]);
        expect(values).toEqual([16]);
    });
});

describe('fail', () => {
    test('surfaces the error if the function fails', () => {
        const moized = moize.maxSize(2)(
            (_1: number, _2: Type) => {
                throw new Error('boom');
            },
            { forceUpdate: (args) => args[1].number % 2 === 0 },
        );

        expect(() => moized(6, { number: 5 })).toThrow(new Error('boom'));
    });

    test('surfaces the error if the promise rejects', async () => {
        const moized = moize.maxSize(2)(promiseMethodRejects, {
            async: true,
            forceUpdate: (args) => args[1].number % 2 === 0,
        });

        await expect(moized(6, { number: 5 })).rejects.toEqual(
            new Error('boom'),
        );
    });

    test('should have nothing in cache if promise is rejected and key was never present', async () => {
        const moized = moize.maxSize(2)(promiseMethodRejects, {
            async: true,
            forceUpdate: (args) => args[1].number % 2 === 0,
        });

        await expect(moized(6, { number: 5 })).rejects.toEqual(
            new Error('boom'),
        );

        expect(moized.cache.snapshot.keys).toEqual([]);
        expect(moized.cache.snapshot.values).toEqual([]);
    });

    test('should have nothing in cache if promise is rejected and key was present', async () => {
        const moized = moize.maxSize(2)(promiseMethodRejects, {
            async: true,
            forceUpdate: (args) => args[1].number % 2 === 0,
        });

        const mutated = { number: 5 };
        const error = new Error('boom');

        try {
            const rejection = Promise.reject(error);

            moized.cache.set([6, mutated], rejection);

            expect(moized.cache.get([6, mutated])).toEqual(rejection);

            await rejection;
        } catch (e) {
            expect(e).toBe(error);
        }

        expect(moized.cache.snapshot.keys).toEqual([]);
        expect(moized.cache.snapshot.values).toEqual([]);
    });
});

describe('infrastructure', () => {
    test('should have all the static properties of a standard moized method', () => {
        const moized = moize.maxSize(2)(promiseMethodResolves, {
            forceUpdate: (args) => args[1].number % 2 === 0,
        });
        const standardMoized = moize.maxSize(2)(promiseMethodResolves);

        expect(Object.getOwnPropertyNames(moized)).toEqual(
            Object.getOwnPropertyNames(standardMoized),
        );
    });
});

describe('edge cases', () => {
    test('should retain the original function name', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        function myNamedFunction() {}

        const memoized = moize(myNamedFunction, {
            forceUpdate: () => false,
        });

        expect(memoized.name).toBe('moized(myNamedFunction)');
    });
});
