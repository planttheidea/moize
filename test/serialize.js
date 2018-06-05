// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as serialize from 'src/serialize';

test('if customReplacer will convert the value to string if it is a function', (t) => {
  const key = 'foo';
  const value = function bar() {};

  const result = serialize.customReplacer(key, value);

  t.is(result, value.toString());
});

test('if customReplacer will return the value as-is if it is not a function', (t) => {
  const key = 'foo';

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar'
  };

  t.is(serialize.customReplacer(key, string), string);
  t.is(serialize.customReplacer(key, number), number);
  t.is(serialize.customReplacer(key, boolean), boolean);
  t.is(serialize.customReplacer(key, object), object);
});

test('if stringify will call JSON.stringify with the value passed', (t) => {
  const value = {foo: 'bar'};
  const replacer = null;

  const spy = sinon.spy(JSON, 'stringify');

  serialize.stringify(value, replacer);

  t.true(spy.calledOnce);
  t.true(spy.calledWith(value, replacer));

  spy.restore();
});

test('if stringify will call JSON.stringify with the value and replacer passed', (t) => {
  const value = {foo: 'bar'};
  const replacer = serialize.customReplacer;

  const spy = sinon.spy(JSON, 'stringify');

  serialize.stringify(value, replacer);

  t.true(spy.calledOnce);
  t.true(spy.calledWith(value, replacer));

  spy.restore();
});

test.serial('if stringify will call stringifySafe on the object when it cannot be handled by JSON.stringify', (t) => {
  const standard = {
    foo: 'bar'
  };
  const circular = {
    foo: {
      bar: 'baz'
    }
  };

  circular.foo.baz = circular.foo;

  const standardResult = serialize.stringify(standard, undefined);

  t.is(standardResult, '{"foo":"bar"}');

  const circularResult = serialize.stringify(circular, undefined);

  t.is(circularResult, '{"foo":{"bar":"baz","baz":"[ref-1]"}}');
});

test('if getStringifiedArgument returns the argument if primitive, else returns a JSON.stringified version of it', (t) => {
  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar'
  };

  t.is(serialize.getStringifiedArgument(string), string);
  t.is(serialize.getStringifiedArgument(number), number);
  t.is(serialize.getStringifiedArgument(boolean), boolean);
  t.is(serialize.getStringifiedArgument(object), JSON.stringify(object));
});

test('if getStringifiedArgument will stringify the object when it is a complex object', (t) => {
  const arg = {};
  const replacer = null;

  const result = serialize.getStringifiedArgument(arg, replacer);

  t.is(result, '{}');
});

test('if getStringifiedArgument will stringify the object when it is a function', (t) => {
  const arg = () => {};
  const replacer = null;

  const result = serialize.getStringifiedArgument(arg, replacer);

  t.is(result, undefined);
});

test('if getStringifiedArgument will return the arg directly if it is not a complex object', (t) => {
  const arg = 123;
  const replacer = null;

  const result = serialize.getStringifiedArgument(arg, replacer);

  t.is(result, arg);
});

test('if createArgumentSerializer will create a method that serializes the args passed without the functions', (t) => {
  const options = {
    shouldSerializeFunctions: false
  };

  const argumentSerializer = serialize.createArgumentSerializer(options);

  t.is(typeof argumentSerializer, 'function');

  const args = ['foo', ['bar'], {baz: 'baz'}, () => {}];

  const result = argumentSerializer(args);

  t.deepEqual(result, ['|foo|["bar"]|{"baz":"baz"}|undefined|']);
});

test('if createArgumentSerializer will create a method that serializes the args passed using the custom serializer', (t) => {
  const options = {
    shouldSerializeFunctions: true
  };

  const argumentSerializer = serialize.createArgumentSerializer(options);

  t.is(typeof argumentSerializer, 'function');

  const args = ['foo', ['bar'], {baz: 'baz'}, () => {}];

  const result = argumentSerializer(args);

  t.deepEqual(result, ['|foo|["bar"]|{"baz":"baz"}|"function () {}"|']);
});

test('if getSerializerFunction returns a function that produces a stringified version of the arguments with a separator', (t) => {
  const options = {
    serializer: null
  };
  const serializeArguments = serialize.getSerializerFunction(options);

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const fn = () => {};
  const object = {
    foo() {},
    bar: 'baz'
  };
  const args = [string, number, boolean, fn, object];

  const result = serializeArguments(args);

  t.deepEqual(result, [`|${string}|${number}|${boolean}|undefined|{"bar":"baz"}|`]);
});

test('if getSerializerFunction uses the serializer passed when it is a function', (t) => {
  const options = {
    serializer(value) {
      return `KEY: ${JSON.stringify(value)}`;
    }
  };
  const serializeArguments = serialize.getSerializerFunction(options);

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const fn = () => {};
  const object = {
    foo() {},
    bar: 'baz'
  };
  const args = [string, number, boolean, fn, object];

  const result = serializeArguments(args);

  t.deepEqual(result, [`KEY: ${JSON.stringify(args)}`]);
});

test('if getIsSerializedKeyEqual will return correctly when the values match', (t) => {
  t.true(serialize.getIsSerializedKeyEqual(['key'], ['key']));
  t.false(serialize.getIsSerializedKeyEqual(['key'], ['not key']));
});
