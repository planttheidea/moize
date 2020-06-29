import moize from '../src';

type Type = {
    number: number;
};

const method = (one: number, two: Type) => one + two.number;
const promiseMethodResolves = (one: number, two: Type) =>
    new Promise((resolve) => setTimeout(() => resolve(one + two.number), 1000));
const promiseMethodRejects =
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (one: number, two: Type) =>
        new Promise((resolve, reject) =>
            setTimeout(() => reject(new Error('boom')), 1000)
        );
describe('moize.updateCacheForKey', () => {
    describe('success', () => {
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
                isPromise: true,
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
    });

    describe('fail', () => {
        it('surfaces the error if it rejects', async () => {
            const moized = moize.maxSize(2)(promiseMethodRejects, {
                isPromise: true,
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

        it('should have nothing in cache if rejected and never was present', async () => {
            const moized = moize.maxSize(2)(promiseMethodRejects, {
                isPromise: true,
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

                expect(moized.keys()).toEqual([]);
                expect(moized.values()).toEqual([]);
            }
        });

        it('should have nothing in cache if rejected and was present', async () => {
            const moized = moize.maxSize(2)(promiseMethodRejects, {
                isPromise: true,
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });

            const mutated = { number: 5 };

            moized.set([6, mutated], Promise.resolve(11));

            expect(moized.get([6, mutated])).toEqual(Promise.resolve(11));

            mutated.number = 10;

            try {
                await moized(6, mutated);

                throw new Error('should fail');
            } catch (error) {
                expect(error).toEqual(new Error('boom'));

                expect(moized.keys()).toEqual([]);
                expect(moized.values()).toEqual([]);
            }
        });
    });

    describe('infrastructure', () => {
        it('should have all the static properties of a standard moized method', () => {
            const moized = moize.maxSize(2)(promiseMethodResolves, {
                updateCacheForKey(args) {
                    return args[1].number % 2 === 0;
                },
            });
            const standardMoized = moize.maxSize(2)(promiseMethodResolves);

            expect(Object.getOwnPropertyNames(moized)).toEqual(
                Object.getOwnPropertyNames(standardMoized)
            );
        });
    });
});
