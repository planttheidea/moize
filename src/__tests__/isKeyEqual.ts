import { expect, test, vi } from 'vitest';
import { moize } from '../index.js';

test('performs a custom equality check of the key via option', () => {
    const method = (one: string, two?: string, three?: string) => ({
        one,
        two,
        three,
    });
    const fn = vi.fn(method);
    const memoized = moize(fn, {
        isKeyEqual: (_prevKey, nextKey) =>
            nextKey.includes('foo') && !nextKey.includes('quz'),
    });

    const resultA = memoized('foo', 'bar', 'baz');
    const resultB = memoized('foo');

    expect(resultA).toEqual({ one: 'foo', two: 'bar', three: 'baz' });
    expect(resultB).toBe(resultA);

    expect(fn).toHaveBeenCalledTimes(1);
});

test('performs a custom equality check of the key via convenience method', () => {
    const method = (one: string, two?: string, three?: string) => ({
        one,
        two,
        three,
    });
    const fn = vi.fn(method);
    const memoized = moize.isKeyEqual(
        (_prevKey, nextKey) =>
            nextKey.includes('foo') && !nextKey.includes('quz'),
    )(fn);

    const resultA = memoized('foo', 'bar', 'baz');
    const resultB = memoized('foo');

    expect(resultA).toEqual({ one: 'foo', two: 'bar', three: 'baz' });
    expect(resultB).toBe(resultA);

    expect(fn).toHaveBeenCalledTimes(1);
});
