import { describe, expect, test, vi } from 'vitest';
import { moize } from '../index.js';

describe('deep', () => {
    const method = ({ one, two }: { one: number; two: { deep: number } }) => [
        one,
        two.deep,
    ];

    test('memoizes based on the deep values via option', () => {
        const fn = vi.fn(method);
        const memoized = moize(fn, { isKeyItemEqual: 'deep' });

        const resultA = memoized({ one: 1, two: { deep: 2 } });
        const resultB = memoized({ one: 1, two: { deep: 2 } });

        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);

        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('memoizes based on the deep values via convenience method', () => {
        const fn = vi.fn(method);
        const memoized = moize.deep(fn);

        const resultA = memoized({ one: 1, two: { deep: 2 } });
        const resultB = memoized({ one: 1, two: { deep: 2 } });

        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('shallow', () => {
    const method = ({ one, two }: { one: number; two: { deep: number } }) => [
        one,
        two.deep,
    ];

    test('memoizes based on the shallow values via option', () => {
        const fn = vi.fn(method);
        const memoized = moize(fn, { isKeyItemEqual: 'shallow' });

        const two = { deep: 2 };

        const resultA = memoized({ one: 1, two });
        const resultB = memoized({ one: 1, two });

        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);

        expect(fn).toHaveBeenCalledTimes(1);

        const resultC = memoized({ one: 1, two: { ...two } });

        expect(resultC).toEqual(resultA);
        expect(resultC).not.toBe(resultA);

        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('memoizes based on the shallow values via convenience method', () => {
        const fn = vi.fn(method);
        const memoized = moize.shallow(fn);

        const two = { deep: 2 };

        const resultA = memoized({ one: 1, two });
        const resultB = memoized({ one: 1, two });

        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);

        expect(fn).toHaveBeenCalledTimes(1);

        const resultC = memoized({ one: 1, two: { ...two } });

        expect(resultC).toEqual(resultA);
        expect(resultC).not.toBe(resultA);

        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('custom', () => {
    test('memoizes based on the custom comparator via option', () => {
        const method = (one: number, two: { deep: number }) => [one, two.deep];
        const fn = vi.fn(method);
        const memoized = moize(fn, {
            isKeyItemEqual: (prevArg, nextArg) => {
                if (typeof prevArg === 'number') {
                    return prevArg === nextArg;
                }

                if (typeof prevArg === 'object') {
                    return prevArg.deep === nextArg.deep;
                }

                return false;
            },
        });

        const resultA = memoized(1, { deep: 2 });
        const resultB = memoized(1, { deep: 2 });

        expect(resultA).toEqual([1, 2]);
        expect(resultA).toBe(resultB);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});
