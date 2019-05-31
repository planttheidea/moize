/* globals describe,expect,jest,it */

import {
  assignFallback,
  combine,
  compose,
  getValidHandlers,
  isMemoized,
  makeCallable,
} from '../src/utils';

describe('assignFallback', () => {
  it('should shallowly merge sources into target if objects', () => {
    const o1 = { foo: 'bar' };
    const o2: null = null;
    const o3: void = undefined;
    const o4 = { bar: 'baz' };

    const target = {};

    const result = assignFallback(target, o1, o2, o3, o4);

    expect(result).toBe(target);

    const targetClone = { ...target };

    expect(result).toEqual(Object.assign(targetClone, o1, o2, o3, o4));
  });

  it('should only merge own properties', () => {
    const o1 = Object.create({
      bar: 'baz',
    });

    o1.foo = 'bar';

    const target = {};

    const result = assignFallback(target, o1);

    expect(result).toBe(target);

    expect(result).toEqual({ foo: 'bar' });

    const targetClone = { ...target };

    expect(result).toEqual(Object.assign(targetClone, o1));
  });

  it('should return the target if there are no sources', () => {
    const target = {};

    const result = assignFallback(target);

    expect(result).toBe(target);
  });
});

describe('combine', () => {
  it('should fire all functions passed', () => {
    const a: any = null;
    const b = jest.fn();
    const c: any = null;
    const d = jest.fn();

    const result = combine(a, b, c, d);

    const args = ['foo', 'bar'];

    (result as Function)(...args);

    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(...args);
  });

  it('should handle when no valid functions are passed', () => {
    const a: any = undefined;
    const b: any = null;

    const result = combine(a, b);

    expect(result).toBe(undefined);
  });

  it('should handle when no functions are passed', () => {
    const result = combine();

    expect(result).toBe(undefined);
  });
});

describe('compose', () => {
  it('should fire the methods passed composed in the correct order', () => {
    const a = jest.fn().mockImplementation(({ args }) => [...args].reverse());
    const b = jest.fn().mockImplementation(args => ({
      args,
    }));
    const c = jest.fn().mockImplementation(args => args.slice(0, 2));

    const result = compose(
      a,
      b,
      c,
    );

    const args = ['foo', 'bar', 'baz'];

    const value = (result as Function)(args);

    expect(a).toHaveBeenCalledTimes(1);
    expect(a).toHaveBeenCalledWith({
      args: args.slice(0, 2),
    });

    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(args.slice(0, 2));

    expect(c).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledWith(args);

    expect(value).toEqual(args.slice(0, 2).reverse());
  });

  it('should handle only functions passed', () => {
    const a: any = null;
    const b = jest.fn().mockImplementation(args => [...args].reverse());
    const c: any = null;
    const d = jest.fn().mockImplementation(args => args.slice(0, 2));

    const result = compose(
      a,
      b,
      c,
      d,
    );

    const args = ['foo', 'bar', 'baz'];

    const value = (result as Function)(args);

    expect(b).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledWith(args.slice(0, 2));

    expect(d).toHaveBeenCalledTimes(1);
    expect(d).toHaveBeenCalledWith(args);

    expect(value).toEqual(args.slice(0, 2).reverse());
  });

  it('should handle no valid functions are passed', () => {
    const a: any = undefined;
    const b: any = null;

    const result = compose(
      a,
      b,
    );

    expect(result).toBe(undefined);
  });

  it('should handle no functions are passed', () => {
    const result = compose();

    expect(result).toBe(undefined);
  });
});

describe('getValidHandlers', () => {
  it('should return only the items that are valid handlers', () => {
    const possibleHandlers: any[] = ['foo', () => {}, 123, function () {}];

    const validHandlers = getValidHandlers(possibleHandlers);

    expect(validHandlers).toEqual([possibleHandlers[1], possibleHandlers[3]]);
  });
});

describe('isMemoized', () => {
  it('should return false if the value is not a function', () => {
    const value = 123;

    expect(isMemoized(value)).toBe(false);
  });

  it('should return false if the value is not a memoized function', () => {
    const value = () => {};

    expect(isMemoized(value)).toBe(false);
  });

  it('should return true if the value is a memoized function', () => {
    const value = () => {};

    value.isMemoized = true;

    expect(isMemoized(value)).toBe(true);
  });
});

describe('makeCallable', () => {
  it('should convert a prototype method to be directly callable', () => {
    const rawMethod = Object.prototype.hasOwnProperty;

    const object = { foo: 'bar' };

    // @ts-ignore
    expect(() => rawMethod(object, 'foo')).toThrow();

    const method = makeCallable(rawMethod);

    expect(method(object, 'foo')).toBe(true);
  });
});
