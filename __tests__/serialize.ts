/* globals afterEach,beforeEach,describe,expect,it,jest */

// src
import {
  customReplacer,
  isMatchingSerializedKey,
  getSerializerFunction,
  stringify,
} from '../src/serialize';

describe('customReplacer', () => {
  it('should convert the value to string if it is a function', () => {
    const key = 'foo';
    const value = function bar() {};

    const result = customReplacer(key, value);

    expect(result).toBe(value.toString());
  });

  it('should convert the value to string if it is a Symbol', () => {
    const key = 'foo';
    const value = Symbol('bar');

    const result = customReplacer(key, value);

    expect(result).toBe(value.toString());
  });

  it('should convert the value to string if it is a RegExp', () => {
    const key = 'foo';
    const value = /bar/;

    const result = customReplacer(key, value);

    expect(result).toBe(value.toString());
  });

  it('should return the value as-is if it is anything else', () => {
    const key = 'foo';

    const string = 'foo';
    const number = 123;
    const boolean = true;
    const object = { foo: 'bar' };

    expect(customReplacer(key, string)).toBe(string);
    expect(customReplacer(key, number)).toBe(number);
    expect(customReplacer(key, boolean)).toBe(boolean);
    expect(customReplacer(key, object)).toBe(object);
  });
});

describe('stringify', () => {
  const _stringify = JSON.stringify;
  const fakeStringify = jest.fn().mockImplementation(_stringify);

  beforeEach(() => {
    JSON.stringify = fakeStringify;
  });

  afterEach(() => {
    fakeStringify.mockReset();
    fakeStringify.mockImplementation(_stringify);

    JSON.stringify = _stringify;
  });

  it('should call JSON.stringify with the value passed', () => {
    const value = { foo: 'bar' };

    stringify(value);

    expect(JSON.stringify).toHaveBeenCalledTimes(1);
    expect(JSON.stringify).toHaveBeenCalledWith(value, customReplacer);
  });

  it('should call JSON.stringify with the value and replacer passed', () => {
    const value = { foo: 'bar' };

    stringify(value);

    expect(JSON.stringify).toHaveBeenCalledTimes(1);
    expect(JSON.stringify).toHaveBeenCalledWith(value, customReplacer);
  });

  it('should call stringifySafe on the object when it cannot be handled by JSON.stringify', () => {
    const standard = {
      foo: 'bar',
    };
    const circular: { foo: { bar: string; baz?: any } } = {
      foo: {
        bar: 'baz',
      },
    };

    circular.foo.baz = circular.foo;

    const standardResult = stringify(standard);

    expect(JSON.stringify).toHaveBeenCalledTimes(1);
    expect(JSON.stringify).toHaveBeenCalledWith(standard, customReplacer);

    expect(standardResult).toEqual('{"foo":"bar"}');

    const circularResult = stringify(circular);

    expect(JSON.stringify).toHaveBeenCalledTimes(3);

    expect(circularResult).toEqual('{"foo":{"bar":"baz","baz":"[ref-1]"}}');
  });
});

describe('getSerializerFunction', () => {
  it('should return a function that produces a stringified version of the arguments with a separator', () => {
    const options: { serializer: any } = {
      serializer: null,
    };
    const serialize = getSerializerFunction(options);

    if (typeof serialize !== 'function') {
      throw new Error('serializeArguments should be a function');
    }

    const undef: void = undefined;
    const nil: void = null;
    const string = 'foo';
    const number = 123;
    const boolean = true;
    const fn = () => {};
    const object = {
      bar: 'baz',
      foo() {},
    };
    const symbol = Symbol('quz');
    const regexp = /blah/;

    const args = [undef, nil, string, number, boolean, fn, object, symbol, regexp];

    const result = serialize(args);

    expect(result).toEqual([
      `undefined|null|foo|123|true|"${fn.toString()}"|{"bar":"baz","foo":"${object.foo.toString()}"}|"${symbol.toString()}"|"${regexp.toString()}"`,
    ]);
  });

  it('should uses the serializer passed when it is a function', () => {
    const options = {
      serializer(value: any[]): [string] {
        return [`KEY: ${JSON.stringify(value)}`];
      },
    };
    const serializeArguments = getSerializerFunction(options);

    if (typeof serializeArguments !== 'function') {
      throw new Error('serializeArguments should be a function');
    }

    const string = 'foo';
    const number = 123;
    const boolean = true;
    const fn = () => {};
    const object = {
      bar: 'baz',
      foo() {},
    };
    const args = [string, number, boolean, fn, object];

    const result = serializeArguments(args);

    expect(result).toEqual([`KEY: ${JSON.stringify(args)}`]);
  });
});

describe('isMatchingSerializedKey', () => {
  it('should return correctly when the values match', () => {
    expect(isMatchingSerializedKey(['key'], ['key'])).toBe(true);
    expect(isMatchingSerializedKey(['key'], ['not key'])).toBe(false);
  });
});
