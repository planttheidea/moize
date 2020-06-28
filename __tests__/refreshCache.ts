import moize from '../src';

type Type = {
    number: number;
};

const method = jest.fn((one: number, two: Type) => one + two.number);
const promiseMethodResolves = jest.fn(
    (one: number, two: Type) =>
        new Promise((resolve) =>
            setTimeout(() => resolve(one + two.number), 1000)
        )
);
const promiseMethodRejects = jest.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (one: number, two: Type) =>
        new Promise((resolve, reject) =>
            setTimeout(() => reject(new Error('boom')), 1000)
        )
);

describe('moize.updateCacheForKey', () => {
    afterEach(jest.clearAllMocks);

    it('will call the underlying method to refresh the cache', () => {
        const moized = moize.maxSize(2)(method, {
            updateCacheForKey(args) {
                return args[1].number % 2 === 0;
            },
        });

        const mutated = { number: 5 };

        const result = moized(6, mutated);

        expect(result).toBe(11);

        mutated.number = 11;

        const mutatedResult = moized(6, mutated);

        // Result was not recalculated because `updateCacheForKey` returned `false` and the values are
        // seen as unchanged.
        expect(mutatedResult).toBe(result);

        mutated.number = 10;

        const refreshedResult = moized(6, mutated);

        // Result was recalculated because `updateCacheForKey` returned `true`.
        expect(refreshedResult).not.toBe(result);
        expect(refreshedResult).toBe(16);

        const { keys, values } = moized.cacheSnapshot;

        expect(keys).toEqual([[6, mutated]]);
        expect(values).toEqual([16]);
    });

    it('will call the underlying method to refresh the cache when a promise', async () => {
        const moized = moize.maxSize(2)(promiseMethodResolves, {
            updateCacheForKey(args) {
                return args[1].number % 2 === 0;
            },
        });

        const mutated = { number: 5 };

        const result = await moized(6, mutated);

        expect(result).toBe(11);

        mutated.number = 11;

        const mutatedResult = await moized(6, mutated);

        // Result was not recalculated because `updateCacheForKey` returned `false` and the values are
        // seen as unchanged.
        expect(mutatedResult).toBe(result);

        mutated.number = 10;

        const refreshedResult = await moized(6, mutated);

        // Result was recalculated because `updateCacheForKey` returned `true`.
        expect(refreshedResult).not.toBe(result);
        expect(refreshedResult).toBe(16);

        const { keys, values } = moized.cacheSnapshot;

        expect(keys).toEqual([[6, mutated]]);
        expect(values).toEqual([Promise.resolve(16)]);
    });

    it('surfaces the error if it rejects', async () => {
        const moized = moize.maxSize(2)(promiseMethodRejects, {
            updateCacheForKey(args) {
                return args[1].number % 2 === 0;
            },
        });

        const mutated = { number: 5 };

        try {
            await moized(6, mutated);

            throw new Error('should fail');
        } catch (error) {
            expect(error).toEqual(new Error('boom'));
        }
    });
});
