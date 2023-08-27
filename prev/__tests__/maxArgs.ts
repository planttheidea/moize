import moize from '../src';

const method = jest.fn(function (one: string, two: string) {
    return { one, two };
});

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';
const qux = 'qux';
const quz = 'quz';

describe('moize.maxArgs', () => {
    afterEach(jest.clearAllMocks);

    [1, 2, 3, 4].forEach((limit) => {
        it(`limits the args to ${limit}`, () => {
            const memoized = moize.maxArgs(limit)(method);

            const args = [foo, bar, baz, qux, quz];
            const limitedArgs = args.slice(0, limit);

            const resultA = memoized.apply(null, args);
            const resultB = memoized.apply(null, limitedArgs);

            expect(resultA).toEqual({ one: foo, two: bar });
            expect(resultB).toBe(resultA);

            expect(method).toHaveBeenCalledTimes(1);
        });
    });

    it('will always return from cache if 0', () => {
        const memoized = moize.maxArgs(0)(method);

        const result = memoized(foo, bar);

        expect(result).toEqual({ one: foo, two: bar });

        // @ts-ignore - allow bunk
        memoized(baz);
        // @ts-ignore - allow bunk
        memoized(123);
        // @ts-ignore - allow bunk
        memoized({});
        // @ts-ignore - allow bunk
        memoized();

        expect(method).toHaveBeenCalledTimes(1);
    });

    it('will use the args passed if less than the size limited', () => {
        const memoized = moize.maxArgs(10)(method);

        const args = [foo, bar, baz, qux, quz];

        const resultA = memoized.apply(null, args);
        const resultB = memoized.apply(null, [foo, bar, baz, qux, 'nope']);

        expect(resultA).toEqual({ one: foo, two: bar });
        expect(resultB).not.toBe(resultA);

        expect(method).toHaveBeenCalledTimes(2);
    });
});
