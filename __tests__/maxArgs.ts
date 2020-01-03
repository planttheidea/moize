import moize from '../src';

const method = jest.fn(function(one: string, two: string) {
  return { one, two };
});

const memoized = moize.maxArgs(1)(method);

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

describe('moize.maxArgs', () => {
  it('limits the args memoized by', () => {
    const resultA = memoized(foo, bar);
    const resultB = memoized(foo, baz);

    expect(resultA).toEqual({ one: foo, two: bar });
    expect(resultB).toBe(resultA);

    expect(method).toHaveBeenCalledTimes(1);
  });
});
