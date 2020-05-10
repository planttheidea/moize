import moize from '../src';

const foo = 'foo';
const bar = 'bar';

const method = jest.fn(function (one: string, two: string) {
    return { one, two };
});

describe('moize.compose', () => {
    it('should compose the moize methods into a new method with options combined', async () => {
        const maxSize = moize.maxSize(5);
        const maxAge = moize.maxAge(500);
        const serialize = moize.serialize;

        const composedMoizer = moize.compose(maxSize, maxAge, serialize);
        const composed = composedMoizer(method);

        expect(composed.options).toEqual(
            expect.objectContaining({
                maxAge: 500,
                maxSize: 5,
                isSerialized: true,
            })
        );

        composed(foo, bar);

        expect(composed.cache.keys).toEqual([['|foo|bar|']]);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(composed.cache.size).toBe(0);
    });
});
