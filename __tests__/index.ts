import moize from '../src/index';

describe('moize', () => {
    describe('main', () => {
        it('should handle a basic use-case', () => {
            const fn = jest.fn((a, b) => [a, b]);
            const moized = moize(fn);

            const a = 'a';
            const b = 'b';

            const result = moized(a, b);

            expect(result).toEqual([a, b]);

            expect(fn).toHaveBeenCalled();

            fn.mockClear();

            let newResult;

            for (let index = 0; index < 10; index++) {
                newResult = moized(a, b);

                expect(newResult).toEqual([a, b]);
                expect(fn).not.toHaveBeenCalled();
            }
        })
    });
});