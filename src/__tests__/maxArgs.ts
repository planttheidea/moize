import { expect, test, vi } from 'vitest';
import { moize } from '../index.js';

const args = [1, 2, 3, 4];

test.each(args)('limits the args to %d via option', (limit) => {
    const method = (
        one: string,
        two: string,
        three?: string,
        four?: string,
        five?: string,
    ) => ({ one, two, three, four, five });
    const fn = vi.fn(method);
    const memoized = moize.maxArgs(limit)(fn);

    const args = ['foo', 'bar', 'baz', 'qux', 'quz'];
    const limitedArgs = args.slice(0, limit);

    const resultA = memoized('foo', 'bar', 'baz', 'qux', 'quz');
    // @ts-expect-error - Allow testing weird case.
    // eslint-disable-next-line prefer-spread
    const resultB = memoized.apply(null, limitedArgs);

    expect(resultA).toEqual({
        one: 'foo',
        two: 'bar',
        three: 'baz',
        four: 'qux',
        five: 'quz',
    });
    expect(resultB).toBe(resultA);

    expect(fn).toHaveBeenCalledTimes(1);
});

test.each(args)('limits the args to %d via convenience method', (limit) => {
    const method = (
        one: string,
        two: string,
        three?: string,
        four?: string,
        five?: string,
    ) => ({ one, two, three, four, five });
    const fn = vi.fn(method);
    const memoized = moize.maxArgs(limit)(fn);

    const args = ['foo', 'bar', 'baz', 'qux', 'quz'];
    const limitedArgs = args.slice(0, limit);

    const resultA = memoized('foo', 'bar', 'baz', 'qux', 'quz');
    // @ts-expect-error - Allow testing weird case.
    // eslint-disable-next-line prefer-spread
    const resultB = memoized.apply(null, limitedArgs);

    expect(resultA).toEqual({
        one: 'foo',
        two: 'bar',
        three: 'baz',
        four: 'qux',
        five: 'quz',
    });
    expect(resultB).toBe(resultA);

    expect(fn).toHaveBeenCalledTimes(1);
});

test('will always return from cache if 0 via option', () => {
    const method = (
        one: string,
        two: string,
        three?: string,
        four?: string,
        five?: string,
    ) => ({ one, two, three, four, five });
    const fn = vi.fn(method);
    const memoized = moize.maxArgs(0)(fn);

    const result = memoized('foo', 'bar');

    expect(result).toEqual({ one: 'foo', two: 'bar' });

    // @ts-expect-error - allow bunk
    memoized('baz');
    // @ts-expect-error - allow bunk
    memoized(123);
    // @ts-expect-error - allow bunk
    memoized({});
    // @ts-expect-error - allow bunk
    memoized();

    expect(fn).toHaveBeenCalledTimes(1);
});

test('will always return from cache if 0 via convenience method', () => {
    const method = (
        one: string,
        two: string,
        three?: string,
        four?: string,
        five?: string,
    ) => ({ one, two, three, four, five });
    const fn = vi.fn(method);
    const memoized = moize(fn, { maxArgs: 0 });

    const result = memoized('foo', 'bar');

    expect(result).toEqual({ one: 'foo', two: 'bar' });

    // @ts-expect-error - allow bunk
    memoized('baz');
    // @ts-expect-error - allow bunk
    memoized(123);
    // @ts-expect-error - allow bunk
    memoized({});
    // @ts-expect-error - allow bunk
    memoized();

    expect(fn).toHaveBeenCalledTimes(1);
});

test('will use the args passed if less than the size limited via option', () => {
    const method = (
        one: string,
        two: string,
        three?: string,
        four?: string,
        five?: string,
    ) => ({ one, two, three, four, five });
    const fn = vi.fn(method);
    const memoized = moize.maxArgs(10)(fn);

    const resultA = memoized('foo', 'bar', 'baz', 'qux', 'quz');
    const resultB = memoized.apply(null, ['foo', 'bar', 'baz', 'qux', 'nope']);

    expect(resultA).toEqual({
        one: 'foo',
        two: 'bar',
        three: 'baz',
        four: 'qux',
        five: 'quz',
    });
    expect(resultB).not.toBe(resultA);
    expect(resultB).toEqual({
        one: 'foo',
        two: 'bar',
        three: 'baz',
        four: 'qux',
        five: 'nope',
    });

    expect(fn).toHaveBeenCalledTimes(2);
});
