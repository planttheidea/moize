/* eslint-disable @typescript-eslint/no-empty-function */

import cloneDeep from 'lodash/cloneDeep';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { moize } from '../index.js';

interface Arg {
    one: number;
    two: number;
    three: () => void;
    four: symbol;
    five: null;
}

const method = vi.fn(({ one, two, three, four, five }: Arg) => {
    return [one, two, three, four, five];
});

const memoized = moize.serialize(method, { maxSize: 2 });

describe('serialize', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('serializes the args passed by', () => {
        const three = () => {};
        const altThree = () => {};
        const four = Symbol('foo');
        const altFour = Symbol('foo');

        const resultA = memoized({
            one: 1,
            two: 2,
            three,
            four,
            five: null,
        });
        const resultB = memoized({
            one: 1,
            two: 2,
            three: altThree,
            four: altFour,
            five: null,
        });

        expect(resultA).toEqual([1, 2, three, four, null]);
        expect(resultB).toBe(resultA);

        expect(method).toHaveBeenCalledTimes(1);
    });

    test('handles circular objects', () => {
        interface Arg {
            deeply: {
                nested: {
                    circular: Arg | {};
                };
            };
        }

        const circularMethod = vi.fn((arg: Arg) => arg);
        const circularMemoized = moize.serialize(circularMethod);

        const circular: Arg = {
            deeply: {
                nested: {
                    circular: {},
                },
            },
        };

        circular.deeply.nested.circular = circular;

        const resultA = circularMemoized(cloneDeep(circular));
        const resultB = circularMemoized(cloneDeep(circular));

        expect(resultB).toBe(resultA);

        expect(circularMethod).toHaveBeenCalledTimes(1);

        expect(circularMemoized.cache.snapshot.keys).toEqual([
            ['[{"deeply":{"nested":{"circular":"[ref=.0]"}}}]'],
        ]);
    });
});

describe('serializeWith', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('serializes the arguments passed with the custom serializer', () => {
        const withSerializer = moize.serializeWith((args: any[]) => [
            JSON.stringify(args),
        ])(method);

        const three = () => {};
        const altThree = () => {};
        const four = Symbol('foo');
        const altFour = Symbol('foo');

        const resultA = withSerializer({
            one: 1,
            two: 2,
            three,
            four,
            five: null,
        });
        const resultB = withSerializer({
            one: 1,
            two: 2,
            three: altThree,
            four: altFour,
            five: null,
        });

        expect(resultA).toEqual([1, 2, three, four, null]);
        expect(resultB).toBe(resultA);

        expect(method).toHaveBeenCalledTimes(1);
    });
});
