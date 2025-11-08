import { expect, test, vi } from 'vitest';
import { moize } from '../index.js';

test('it transforms the args memoized via option', () => {
    const method = (one: string, two: string, three: string) => ({
        one,
        two,
        three,
    });
    const fn = vi.fn(method);
    const memoized = moize(fn, {
        transformKey: (key) => key.slice(1),
    });

    const resultA = memoized('foo', 'bar', 'baz');
    const resultB = memoized('ignored', 'bar', 'baz');

    expect(resultA).toEqual({ one: 'foo', two: 'bar', three: 'baz' });
    expect(resultB).toBe(resultA);

    expect(fn).toHaveBeenCalledTimes(1);
});
