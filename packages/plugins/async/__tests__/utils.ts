import type { AnyFn, NormalizedOptions } from '../index.d';
import { getCustomOptions, isSameValueZero, mergeOptions } from '../src/utils';

describe('getCustomOptions', () => {
  it('will return the custom options and no default options', () => {
    const options = {
      maxSize: 10,
      foo: 'bar',
    };

    const result = getCustomOptions(options);

    expect(result).toEqual({ foo: options.foo });
  });
});

describe('isSameValueZero', () => {
  it('will return true when the objects are equal', () => {
    const object1 = {};
    const object2 = object1;

    expect(isSameValueZero(object1, object2)).toEqual(true);
  });

  it('will return true when the objects are NaN', () => {
    const object1 = NaN;
    const object2 = NaN;

    expect(isSameValueZero(object1, object2)).toEqual(true);
  });

  it('will return false when the objects are different', () => {
    const object1 = {};
    const object2 = {};

    expect(isSameValueZero(object1, object2)).toEqual(false);
  });
});

describe('mergeOptions', () => {
  it('will merge the extra and provided options into a new object', () => {
    const extraOptions = {
      extra: 'options',
    };
    const providedOptions = {
      isPromise: true,
    };

    const result = mergeOptions(
      extraOptions as unknown as NormalizedOptions<AnyFn>,
      providedOptions,
    );

    expect(result).not.toBe(extraOptions);
    expect(result).not.toBe(providedOptions);
    expect(result).toEqual({ ...extraOptions, ...providedOptions });
  });
});
