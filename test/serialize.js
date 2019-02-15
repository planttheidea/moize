// test
import sinon from 'sinon';

// src
import * as serialize from 'src/serialize';

test('if customReplacer will convert the value to string if it is a function', () => {
  const key = 'foo';
  const value = function bar() {};

  const result = serialize.customReplacer(key, value);

  expect(result).toBe(value.toString());
});

test('if customReplacer will return the value as-is if it is not a function', () => {
  const key = 'foo';

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar',
  };

  expect(serialize.customReplacer(key, string)).toBe(string);
  expect(serialize.customReplacer(key, number)).toBe(number);
  expect(serialize.customReplacer(key, boolean)).toBe(boolean);
  expect(serialize.customReplacer(key, object)).toBe(object);
});

test('if stringify will call JSON.stringify with the value passed', () => {
  const value = {foo: 'bar'};
  const replacer = null;

  const spy = sinon.spy(JSON, 'stringify');

  serialize.stringify(value, replacer);

  expect(spy.calledOnce).toBe(true);
  expect(spy.calledWith(value, replacer)).toBe(true);

  spy.restore();
});

test('if stringify will call JSON.stringify with the value and replacer passed', () => {
  const value = {foo: 'bar'};
  const replacer = serialize.customReplacer;

  const spy = sinon.spy(JSON, 'stringify');

  serialize.stringify(value, replacer);

  expect(spy.calledOnce).toBe(true);
  expect(spy.calledWith(value, replacer)).toBe(true);

  spy.restore();
});

test(
  'if stringify will call stringifySafe on the object when it cannot be handled by JSON.stringify',
  () => {
    const standard = {
      foo: 'bar',
    };
    const circular = {
      foo: {
        bar: 'baz',
      },
    };

    circular.foo.baz = circular.foo;

    const standardResult = serialize.stringify(standard, undefined);

    expect(standardResult).toBe('{"foo":"bar"}');

    const circularResult = serialize.stringify(circular, undefined);

    expect(circularResult).toBe('{"foo":{"bar":"baz","baz":"[ref-1]"}}');
  }
);

test('if getStringifiedArgument returns the argument if primitive, else returns a JSON.stringified version of it', () => {
  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar',
  };

  expect(serialize.getStringifiedArgument(string)).toBe(string);
  expect(serialize.getStringifiedArgument(number)).toBe(number);
  expect(serialize.getStringifiedArgument(boolean)).toBe(boolean);
  expect(serialize.getStringifiedArgument(object)).toBe(JSON.stringify(object));
});

test('if getStringifiedArgument will stringify the object when it is a complex object', () => {
  const arg = {};
  const replacer = null;

  const result = serialize.getStringifiedArgument(arg, replacer);

  expect(result).toBe('{}');
});

test('if getStringifiedArgument will stringify the object when it is a function', () => {
  const arg = () => {};
  const replacer = null;

  const result = serialize.getStringifiedArgument(arg, replacer);

  expect(result).toBe(undefined);
});

test('if getStringifiedArgument will return the arg directly if it is not a complex object', () => {
  const arg = 123;
  const replacer = null;

  const result = serialize.getStringifiedArgument(arg, replacer);

  expect(result).toBe(arg);
});

test('if createArgumentSerializer will create a method that serializes the args passed without the functions', () => {
  const options = {
    shouldSerializeFunctions: false,
  };

  const argumentSerializer = serialize.createArgumentSerializer(options);

  expect(typeof argumentSerializer).toBe('function');

  const args = ['foo', ['bar'], {baz: 'baz'}, () => {}];

  const result = argumentSerializer(args);

  expect(result).toEqual(['|foo|["bar"]|{"baz":"baz"}|undefined|']);
});

test('if createArgumentSerializer will create a method that serializes the args passed using the custom serializer', () => {
  const options = {
    shouldSerializeFunctions: true,
  };

  const argumentSerializer = serialize.createArgumentSerializer(options);

  expect(typeof argumentSerializer).toBe('function');

  const args = ['foo', ['bar'], {baz: 'baz'}, () => {}];

  const result = argumentSerializer(args);

  expect(result).toEqual(['|foo|["bar"]|{"baz":"baz"}|"function () {}"|']);
});

test('if getSerializerFunction returns a function that produces a stringified version of the arguments with a separator', () => {
  const options = {
    serializer: null,
  };
  const serializeArguments = serialize.getSerializerFunction(options);

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

  expect(result).toEqual([`|${string}|${number}|${boolean}|undefined|{"bar":"baz"}|`]);
});

test('if getSerializerFunction uses the serializer passed when it is a function', () => {
  const options = {
    serializer(value) {
      return `KEY: ${JSON.stringify(value)}`;
    },
  };
  const serializeArguments = serialize.getSerializerFunction(options);

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

test('if getIsSerializedKeyEqual will return correctly when the values match', () => {
  expect(serialize.getIsSerializedKeyEqual(['key'], ['key'])).toBe(true);
  expect(serialize.getIsSerializedKeyEqual(['key'], ['not key'])).toBe(false);
});
