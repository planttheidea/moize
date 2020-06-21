import cloneDeep from 'lodash/cloneDeep';
import moize from '../src';

type Arg = {
    one: number;
    two: number;
    three: () => void;
    four: symbol;
    five: null;
};

const method = jest.fn(function ({ one, two, three, four, five }: Arg) {
    return [one, two, three, four, five];
});

const memoized = moize.serialize(method);

describe('moize.serialize', () => {
    afterEach(jest.clearAllMocks);

    it('serializes the args passed by', () => {
        const three = function () {};
        const four = Symbol('foo');

        const resultA = memoized({ one: 1, two: 2, three, four, five: null });
        const resultB = memoized({
            one: 1,
            two: 2,
            three() {},
            four: Symbol('foo'),
            five: null,
        });

        expect(resultA).toEqual([1, 2, three, four, null]);
        expect(resultB).toBe(resultA);

        expect(method).toHaveBeenCalledTimes(1);
    });

    it('handles circular objects', () => {
        type Arg = {
            deeply: {
                nested: {
                    circular: Arg | {};
                };
            };
        };

        const circularMethod = jest.fn((arg: Arg) => arg);
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

        expect(circularMemoized.cache.keys).toEqual([
            ['|{"deeply":{"nested":{"circular":"[ref=.]"}}}|'],
        ]);
    });
});

describe('moize.serializeWith', () => {
    afterEach(jest.clearAllMocks);

    it('serializes the arguments passed with the custom serializer', () => {
        const withSerializer = moize.serializeWith((args: any[]) => [
            JSON.stringify(args),
        ])(method);

        const three = function () {};
        const four = Symbol('foo');

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
            three() {},
            four: Symbol('foo'),
            five: null,
        });

        expect(resultA).toEqual([1, 2, three, four, null]);
        expect(resultB).toBe(resultA);

        expect(method).toHaveBeenCalledTimes(1);
    });
});
