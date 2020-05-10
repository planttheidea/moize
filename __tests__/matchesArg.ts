import moize from '../src';

const method = jest.fn(function (one: string, two?: string) {
    return { one, two };
});

function argMatcher(cacheKeyArg: string, keyArg: string) {
    return cacheKeyArg === 'foo' || keyArg === 'foo';
}

const memoized = moize.matchesArg(argMatcher)(method);

const foo = 'foo';
const bar = 'bar';

describe('moize.matchesArg', () => {
    it('performs a custom equality check of specific args in the key', () => {
        const resultA = memoized(foo, bar);
        const resultB = memoized(bar, foo);

        expect(resultA).toEqual({ one: foo, two: bar });
        expect(resultB).toBe(resultA);

        expect(method).toHaveBeenCalledTimes(1);
    });
});
