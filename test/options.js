// test
import test from 'ava';
import sinon from 'sinon';
import {
  deepEqual,
  shallowEqual,
  sameValueZeroEqual
} from 'fast-equals';

// src
import * as options from 'src/options';
import * as serialize from 'src/serialize';

test('if getIsEqual will return equals if passed in options', (t) => {
  const moizeOptions = {
    equals: sinon.spy(),
    isDeepEqual: true,
    isReact: true,
  };

  const result = options.getIsEqual(moizeOptions);

  t.is(result, moizeOptions.equals);
});

test('if getIsEqual will return deepEqual if isDeepEqual is true', (t) => {
  const moizeOptions = {
    equals: undefined,
    isDeepEqual: true,
    isReact: true,
  };

  const result = options.getIsEqual(moizeOptions);

  t.is(result, deepEqual);
});

test('if getIsEqual will return shallowEqual if isReact is true', (t) => {
  const moizeOptions = {
    equals: undefined,
    isDeepEqual: false,
    isReact: true,
  };

  const result = options.getIsEqual(moizeOptions);

  t.is(result, shallowEqual);
});

test('if getIsMatchingKey will return the matchesKey function if passed', (t) => {
  const moizeOptions = {
    isSerialized: true,
    matchesKey: sinon.spy(),
  };

  const result = options.getIsMatchingKey(moizeOptions);

  t.is(result, moizeOptions.matchesKey);
});

test('if getIsMatchingKey will return the default is serialized key equal method when no matchesKey is passed', (t) => {
  const moizeOptions = {
    isSerialized: true,
    matchesKey: null,
  };

  const result = options.getIsMatchingKey(moizeOptions);

  t.is(result, serialize.getIsSerializedKeyEqual);
});

test('if getIsEqual will return sameValueZeroEqual as an ultimate fallback', (t) => {
  const moizeOptions = {
    equals: undefined,
    isDeepEqual: false,
    isReact: false,
  };

  const result = options.getIsEqual(moizeOptions);

  t.is(result, sameValueZeroEqual);
});

test('if getTransformKey will not return a function when not required', (t) => {
  const moizeOptions = {
    isReact: false,
    isSerialized: false,
    maxArgs: undefined,
    transformArgs: undefined,
  };

  const result = options.getTransformKey(moizeOptions);

  t.is(result, undefined);
});

test('if getTransformKey will get the initial args if maxArgs is a number', (t) => {
  const moizeOptions = {
    isReact: false,
    isSerialized: false,
    maxArgs: 1,
    transformArgs: undefined,
  };

  const result = options.getTransformKey(moizeOptions);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), args.slice(0, 1));
});

test('if getTransformKey will get the first two args if isReact is true', (t) => {
  const moizeOptions = {
    isReact: true,
    isSerialized: false,
    maxArgs: undefined,
    transformArgs: undefined,
  };

  const result = options.getTransformKey(moizeOptions);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), args.slice(0, 2));
});

test('if getTransformKey will serialize the args if isSerialized is true', (t) => {
  const moizeOptions = {
    isReact: false,
    isSerialized: true,
    maxArgs: undefined,
    transformArgs: undefined,
  };

  const result = options.getTransformKey(moizeOptions);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), ['|one|two|three|']);
});

test('if getTransformKey will call transformArgs if passed', (t) => {
  const moizeOptions = {
    isReact: false,
    isSerialized: false,
    maxArgs: undefined,
    transformArgs(args) {
      return [...args].reverse();
    },
  };

  const result = options.getTransformKey(moizeOptions);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), [...args].reverse());
});

test('if getTransformKey will compose all transforms in the correct order', (t) => {
  const moizeOptions = {
    isReact: true,
    isSerialized: true,
    maxArgs: 1,
    transformArgs(args) {
      return [
        args[0]
          .split('')
          .reverse()
          .join(''),
      ];
    },
  };

  const result = options.getTransformKey(moizeOptions);

  t.is(typeof result, 'function');

  const args = ['one', 'two', 'three'];

  t.deepEqual(result(args), ['|eno|']);
});
