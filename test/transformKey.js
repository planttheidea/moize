// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as transformKey from 'src/transformKey';

test('if getTransformKey will not return a function when not required', (t) => {
  const options = {
    maxArgs: undefined,
    isReact: false,
    isSerialized: false,
    transformArgs: undefined
  };

  const result = transformKey.getTransformKey(options);

  t.is(result, undefined);
});

test('if getTransformKey will get the initial args if maxArgs is a number', (t) => {
  const options = {
    maxArgs: 1,
    isReact: false,
    isSerialized: false,
    transformArgs: undefined
  };

  const result = transformKey.getTransformKey(options);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), args.slice(0, 1));
});

test('if getTransformKey will get the first two args if isReact is true', (t) => {
  const options = {
    maxArgs: undefined,
    isReact: true,
    isSerialized: false,
    transformArgs: undefined
  };

  const result = transformKey.getTransformKey(options);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), args.slice(0, 2));
});

test('if getTransformKey will serialize the args if isSerialized is true', (t) => {
  const options = {
    maxArgs: undefined,
    isReact: false,
    isSerialized: true,
    transformArgs: undefined
  };

  const result = transformKey.getTransformKey(options);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.is(result(args), '|one|two|three|');
});

test('if getTransformKey will call transformArgs if passed', (t) => {
  const options = {
    maxArgs: undefined,
    isReact: false,
    isSerialized: false,
    transformArgs(args) {
      return [...args].reverse();
    }
  };

  const result = transformKey.getTransformKey(options);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), [...args].reverse());
});

test('if getTransformKey will compose all transforms in the correct order', (t) => {
  const options = {
    maxArgs: 1,
    isReact: true,
    isSerialized: true,
    transformArgs(args) {
      return [
        args[0]
          .split('')
          .reverse()
          .join('')
      ];
    }
  };

  const result = transformKey.getTransformKey(options);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), '|eno|');
});
