/* globals afterEach,beforeEach,describe,expect,it,jest */

// src
import {
  createArgumentSerializer,
  customReplacer,
  getIsSerializedKeyEqual,
  getSerializerFunction,
  getStringifiedArgument,
  stringify,
} from '../src/serialize';

describe('customReplacer', () => {
  it('should convert the value to string if it is a function', () => {
    const key = 'foo';
    const value = function bar() {};

    const result = customReplacer(key, value);

    expect(result).toBe(value.toString());
  });

  it('should return the value as-is if it is not a function', () => {
    const key = 'foo';

    const string = 'foo';
    const number = 123;
    const boolean = true;
    const object = {
      foo: 'bar',
    };

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
    const replacer: null = null;

    stringify(value, replacer);

    expect(JSON.stringify).toHaveBeenCalledTimes(1);
    expect(JSON.stringify).toHaveBeenCalledWith(value, replacer);
  });

  it('should call JSON.stringify with the value and replacer passed', () => {
    const value = { foo: 'bar' };
    const replacer = customReplacer;

    stringify(value, replacer);

    expect(JSON.stringify).toHaveBeenCalledTimes(1);
    expect(JSON.stringify).toHaveBeenCalledWith(value, replacer);
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

    const standardResult = stringify(standard, undefined);

    expect(JSON.stringify).toHaveBeenCalledTimes(1);
    expect(JSON.stringify).toHaveBeenCalledWith(standard, undefined);

    expect(standardResult).toBe('{"foo":"bar"}');

    const circularResult = stringify(circular, undefined);

    expect(JSON.stringify).toHaveBeenCalledTimes(3);

    expect(circularResult).toBe('{"foo":{"bar":"baz","baz":"[ref-1]"}}');
  });
});

describe('getStringifiedArgument', () => {
  it('should return the argument if primitive, else returns a JSON.stringified version of it', () => {
    const string = 'foo';
    const number = 123;
    const boolean = true;
    const object = {
      foo: 'bar',
    };

    expect(getStringifiedArgument(string)).toBe(string);
    expect(getStringifiedArgument(number)).toBe(number);
    expect(getStringifiedArgument(boolean)).toBe(boolean);
    expect(getStringifiedArgument(object)).toBe(JSON.stringify(object));
  });

  it('should will stringify the object when it is a complex object', () => {
    const arg = {};
    const replacer: null = null;

    const result = getStringifiedArgument(arg, replacer);

    expect(result).toBe('{}');
  });

  it('should will stringify the object when it is a function', () => {
    const arg = () => {};
    const replacer: null = null;

    const result = getStringifiedArgument(arg, replacer);

    expect(result).toBe(undefined);
  });

  it('should will return the arg directly if it is not a complex object', () => {
    const arg = 123;
    const replacer: null = null;

    const result = getStringifiedArgument(arg, replacer);

    expect(result).toBe(arg);
  });
});

describe('createArgumentSerializer', () => {
  it('should create a method that serializes the args passed without the functions', () => {
    const options = {
      shouldSerializeFunctions: false,
    };

    const argumentSerializer = createArgumentSerializer(options);

    expect(typeof argumentSerializer).toBe('function');

    const args = ['foo', ['bar'], { baz: 'baz' }, () => {}];

    const result = argumentSerializer(args);

    expect(result).toEqual(['|foo|["bar"]|{"baz":"baz"}|undefined|']);
  });

  it('should create a method that serializes the args passed using the custom serializer', () => {
    const options = {
      shouldSerializeFunctions: true,
    };

    const argumentSerializer = createArgumentSerializer(options);

    expect(typeof argumentSerializer).toBe('function');

    const args = ['foo', ['bar'], { baz: 'baz' }, () => {}];

    const result = argumentSerializer(args);

    expect(result).toEqual(['|foo|["bar"]|{"baz":"baz"}|"function () { }"|']);
  });
});

describe('getSerializerFunction', () => {
  it('should return a function that produces a stringified version of the arguments with a separator', () => {
    const options: { serializer: any } = {
      serializer: null,
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

    expect(result).toEqual([
      `|${string}|${number}|${boolean}|undefined|{"bar":"baz"}|`,
    ]);
  });

  it('should uses the serializer passed when it is a function', () => {
    const options = {
      serializer(value: any) {
        return `KEY: ${JSON.stringify(value)}`;
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

describe('getIsSerializedKeyEqual', () => {
  it('should return correctly when the values match', () => {
    expect(getIsSerializedKeyEqual(['key'], ['key'])).toBe(true);
    expect(getIsSerializedKeyEqual(['key'], ['not key'])).toBe(false);
  });
});
