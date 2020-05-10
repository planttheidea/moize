import moize from '../src';

const method = jest.fn(function (one: string, two: string) {
    return { one, two };
});

describe('moize.isMoized', () => {
    it('should validate if the function passed is moized', () => {
        const memoized = moize(method);

        expect(moize.isMoized(method)).toBe(false);
        expect(moize.isMoized(memoized)).toBe(true);
    });

    it('should handle random data types', () => {
        const types = [undefined, null, 'string', 123, [], {}];

        types.forEach((type) => {
            expect(moize.isMoized(type)).toBe(false);
        });
    });
});
