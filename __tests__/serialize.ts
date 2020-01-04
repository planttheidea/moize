import moize from '../src';

type Arg = {
  one: number;
  two: number;
  three: () => void;
  four: symbol;
  five: null;
};

const method = jest.fn(function({ one, two, three, four, five }: Arg) {
  return [one, two, three, four, five];
});

const memoized = moize.serialize(method);

describe('moize.serialize', () => {
  afterEach(jest.clearAllMocks);

  it('serializes the args passed by', () => {
    const three = function() {};
    const four = Symbol('foo');

    const resultA = memoized({ one: 1, two: 2, three, four, five: null });
    const resultB = memoized({ one: 1, two: 2, three() {}, four: Symbol('foo'), five: null });

    expect(resultA).toEqual([1, 2, three, four, null]);
    expect(resultB).toBe(resultA);

    expect(method).toHaveBeenCalledTimes(1);
  });
});

describe('moize.serializeWith', () => {
  afterEach(jest.clearAllMocks);

  it('serializes the arguments passed with the custom serializer', () => {
    const withSerializer = moize.serializeWith((args: any[]) => [JSON.stringify(args)])(method);

    const three = function() {};
    const four = Symbol('foo');

    const resultA = withSerializer({ one: 1, two: 2, three, four, five: null });
    const resultB = withSerializer({ one: 1, two: 2, three() {}, four: Symbol('foo'), five: null });

    expect(resultA).toEqual([1, 2, three, four, null]);
    expect(resultB).toBe(resultA);

    expect(method).toHaveBeenCalledTimes(1);
  });
});
