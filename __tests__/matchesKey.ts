import moize from '../src';

import type { Key } from '../index.d';

const method = jest.fn(function (one: string, two?: string, three?: string) {
    return { one, two, three };
});

function keyMatcher(cacheKey: Key, key: Key) {
    return key.includes('foo') && !key.includes('quz');
}

const memoized = moize.matchesKey(keyMatcher)(method);

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

describe('moize.matchesKey', () => {
    it('performs a custom equality check of the key', () => {
        const resultA = memoized(foo, bar, baz);
        const resultB = memoized(foo);

        expect(resultA).toEqual({ one: foo, two: bar, three: baz });
        expect(resultB).toBe(resultA);

        expect(method).toHaveBeenCalledTimes(1);
    });
});
