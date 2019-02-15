// test
import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
import {onCacheOperation} from 'micro-memoize/lib/utils';
import React from 'react';
import ReactDOM from 'react-dom';
import sinon from 'sinon';

// src
import * as index from 'src/index';
import {DEFAULT_OPTIONS} from 'src/constants';
import * as maxAge from 'src/maxAge';
import * as maxArgs from 'src/maxArgs';
import * as optionsUtils from 'src/options';
import * as serialize from 'src/serialize';
import * as stats from 'src/stats';
import * as utils from 'src/utils';

const moize = index.default;

const isMoizedFunction = (fn) => {
  expect(fn.hasOwnProperty('cache')).toBe(true);
  expect(fn.cache).toEqual({
    keys: [],
    size: 0,
    values: [],
  });

  expect(fn.hasOwnProperty('expirations')).toBe(true);
  expect(fn.expirations).toEqual([]);

  expect(fn.hasOwnProperty('options')).toBe(true);
  expect(fn.hasOwnProperty('_microMemoizeOptions')).toBe(true);
};

test('if collectStats exists as a named export', () => {
  expect(index.collectStats).toBe(stats.collectStats);
});

test('if moize will handle the standard use-case', () => {
  const fn = sinon.spy();

  const moized = moize(fn);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);
});

test('if moize will handle a custom equals function correctly', () => {
  const fn = sinon.spy();
  const options = {
    equals(a, b) {
      return a === b;
    },
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    equals: options.equals,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: options.equals,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);
});

test('if moize will handle deep equals correctly', () => {
  const fn = sinon.spy();
  const options = {
    isDeepEqual: true,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: deepEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);
});

test('if moize will handle promises correctly', () => {
  const fn = sinon.stub().resolves('done');
  const options = {
    isPromise: true,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isPromise: true,
    profileName: 'stub at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: true,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);
});

test('if moize will handle React components correctly', () => {
  const jsdom = require('jsdom-global')();

  const Fn = sinon.stub().callsFake((props) => <div />);

  Fn.contextTypes = {};
  Fn.displayName = 'Custom';
  Fn.defaultProps = {};
  Fn.propTypes = {};

  const options = {
    isReact: true,
  };

  const Moized = moize(Fn, options);

  isMoizedFunction(Moized);

  expect(Moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isReact: true,
    profileName: 'Custom at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = Moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: shallowEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(maxArgs.createGetInitialArgs(2).toString());

  const args = [{foo: 'bar'}, {bar: 'baz'}, 'trimmed', 'also trimmed'];

  expect(transformKey(args)).toEqual(maxArgs.createGetInitialArgs(2)(args));

  const div = document.createElement('div');

  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);

  expect(Fn.calledOnce).toBe(true);
  expect(Fn.calledWith(args[0], {})).toBe(true);

  jsdom();
});

test('if moize will handle serialization of keys correctly', () => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isSerialized: true,
    profileName: 'spy at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: serialize.getIsSerializedKeyEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(serialize.getSerializerFunction(options).toString());

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  expect(transformKey(args)).toEqual(serialize.getSerializerFunction(options)(args));

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(moized.cache.keys).toEqual([['|{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|undefined|']]);
});

test('if moize will handle serialization of keys correctly when functions should be serialized', () => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true,
    shouldSerializeFunctions: true,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isSerialized: true,
    profileName: 'spy at <anonymous>',
    shouldSerializeFunctions: true,
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: serialize.getIsSerializedKeyEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(serialize.getSerializerFunction(options).toString());

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  expect(transformKey(args)).toEqual(serialize.getSerializerFunction(options)(args));

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(moized.cache.keys).toEqual([[`|{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|"${fnArg.toString()}"|`]]);
});

test('if moize will handle serialization of keys correctly when a custom serializer is used', () => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true,
    serializer: sinon.stub().callsFake(JSON.stringify),
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isSerialized: true,
    profileName: 'spy at <anonymous>',
    serializer: options.serializer,
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: serialize.getIsSerializedKeyEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(serialize.getSerializerFunction(options).toString());

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  expect(transformKey(args)).toEqual(serialize.getSerializerFunction(options)(args));

  options.serializer.resetHistory();

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(options.serializer.callCount).toBe(5);
  expect(options.serializer.calledWith(args)).toBe(true);

  expect(moized.cache.keys).toEqual([['[{"foo":"foo"},{"bar":"bar"},{"baz":"baz"},null]']]);
});

test('if moize will handle expiration of items in cache via maxAge correctly', async () => {
  const fn = sinon.spy();
  const options = {
    maxAge: 100,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxAge: options.maxAge,
    profileName: 'spy at new Promise (<anonymous>)',
  });

  const {onCacheAdd, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(onCacheAdd.toString()).toBe(optionsUtils
    .createOnCacheOperation(
      maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
    )
    .toString());

  expect(moized.cache.keys.length).toBe(1);

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge + 50);
  });

  expect(moized.cache.keys.length).toBe(0);
});

test('if moize will handle limiting of arguments via maxArgs passed correctly', () => {
  const fn = sinon.spy();
  const options = {
    maxArgs: 1,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxArgs: 1,
    profileName: 'spy at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(transformKey.toString()).toBe(maxArgs.createGetInitialArgs(options.maxArgs).toString());
  expect(transformKey(args)).toEqual(maxArgs.createGetInitialArgs(options.maxArgs)(args));
});

test('if moize will handle limiting of cache size via maxSize correctly', () => {
  const fn = sinon.spy();
  const options = {
    maxSize: 1,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxSize: 1,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: 1,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];
  const reverseArgs = [...args].reverse();

  moized(...args);
  moized(...reverseArgs);

  expect(fn.calledTwice).toBe(true);
  expect(fn.args).toEqual([args, reverseArgs]);

  expect(moized.cacheSnapshot.keys).toEqual([reverseArgs]);
});

test('if moize will handle an onCacheAdd method correctly', () => {
  const fn = sinon.spy();
  const options = {
    onCacheAdd: sinon.spy(),
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    onCacheAdd: options.onCacheAdd,
    profileName: 'spy at <anonymous>',
  });

  const {onCacheAdd: onCacheAddIgnored, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(options.onCacheAdd.calledOnce).toBe(true);
  expect(options.onCacheAdd.calledWith(moized.cache, moized.options, moized)).toBe(true);
});

test('if moize will handle an onCacheChange method correctly', () => {
  const fn = sinon.spy();
  const options = {
    onCacheChange: sinon.spy(),
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    onCacheChange: options.onCacheChange,
    profileName: 'spy at <anonymous>',
  });

  const {onCacheChange: onCacheChangeIgnored, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(options.onCacheChange.calledOnce).toBe(true);
  expect(options.onCacheChange.calledWith(moized.cache, moized.options, moized)).toBe(true);
});

test('if moize will handle an onCacheHit method correctly', () => {
  const fn = sinon.spy();
  const options = {
    onCacheHit: sinon.spy(),
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    onCacheHit: options.onCacheHit,
    profileName: 'spy at <anonymous>',
  });

  const {onCacheHit: onCacheHitIgnored, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(options.onCacheHit.callCount).toBe(6);

  const expectedArg = {
    keys: moized.cache.keys,
    values: moized.cache.values,
  };

  expect(options.onCacheHit.args).toEqual([
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
  ]);
});

test('if moize will handle an onExpire method for cache expiration correctly', async () => {
  const fn = sinon.spy();
  const options = {
    maxAge: 100,
    onExpire: sinon.spy(),
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxAge: options.maxAge,
    onExpire: options.onExpire,
    profileName: 'spy at new Promise (<anonymous>)',
  });

  const {onCacheAdd, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(onCacheAdd.toString()).toBe(optionsUtils
    .createOnCacheOperation(
      maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
    )
    .toString());

  expect(moized.cache.keys.length).toBe(1);

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge + 50);
  });

  expect(moized.cache.keys.length).toBe(0);

  expect(options.onExpire.calledOnce).toBe(true);
});

test('if moize will handle a custom profileName for stats collection correctly', () => {
  const fn = sinon.spy();
  const options = {
    profileName: 'custom',
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    profileName: options.profileName,
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });
});

test('if moize will handle a custom transformArgs method correctly', () => {
  const fn = sinon.spy();
  const options = {
    transformArgs(args) {
      return [...args].reverse();
    },
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    profileName: 'spy at <anonymous>',
    transformArgs: options.transformArgs,
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(transformKey.toString()).toBe(utils
    .compose(
      utils.getArrayKey,
      options.transformArgs
    )
    .toString());
  expect(transformKey(args)).toEqual(utils.compose(
    utils.getArrayKey,
    options.transformArgs
  )(args));
});

test('if moize will handle an updateExpire method for cache expiration correctly', async () => {
  const fn = sinon.spy();
  const options = {
    maxAge: 100,
    updateExpire: true,
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxAge: options.maxAge,
    profileName: 'spy at new Promise (<anonymous>)',
    updateExpire: options.updateExpire,
  });

  const {onCacheAdd, onCacheHit, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  const clearTimeoutSpy = sinon.spy(global, 'clearTimeout');

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(onCacheAdd.toString()).toBe(optionsUtils
    .createOnCacheOperation(
      maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
    )
    .toString());
  expect(onCacheHit.toString()).toBe(
    optionsUtils.createOnCacheOperation(maxAge.createOnCacheHitResetExpiration(moized.expirations, options)).toString()
  );

  expect(moized.cache.keys.length).toBe(1);

  expect(clearTimeoutSpy.callCount).toBe(6);

  clearTimeoutSpy.restore();

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge + 50);
  });

  expect(moized.cache.keys.length).toBe(0);
});

test('if moize will handle additional custom options correctly', () => {
  const fn = sinon.spy();
  const options = {
    customOption: 'value',
  };

  const moized = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    customOption: 'value',
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    customOption: 'value',
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);
});

test('if moize will handle a curried options implementation correctly', () => {
  const fn = sinon.spy();
  const firstOptions = {
    isDeepEqual: true,
  };
  const secondOptions = {
    transformArgs(args) {
      return [...args].reverse();
    },
  };

  const moized = moize(firstOptions)(secondOptions)(fn);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
    transformArgs: secondOptions.transformArgs,
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: deepEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(transformKey.toString()).toBe(utils
    .compose(
      utils.getArrayKey,
      secondOptions.transformArgs
    )
    .toString());
  expect(transformKey(args)).toEqual(utils.compose(
    utils.getArrayKey,
    secondOptions.transformArgs
  )(args));
});

test('if moize will handle a curried options implementation correctly when the final call has options', () => {
  const fn = sinon.spy();
  const firstOptions = {
    isDeepEqual: true,
  };
  const secondOptions = {
    transformArgs(args) {
      return [...args].reverse();
    },
  };

  const moized = moize(firstOptions)(fn, secondOptions);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
    transformArgs: secondOptions.transformArgs,
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: deepEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(transformKey.toString()).toBe(utils
    .compose(
      utils.getArrayKey,
      secondOptions.transformArgs
    )
    .toString());
  expect(transformKey(args)).toEqual(utils.compose(
    utils.getArrayKey,
    secondOptions.transformArgs
  )(args));
});

test('if moize will handle moizing a previously-moized function correctly', () => {
  const fn = sinon.spy();
  const firstOptions = {
    isDeepEqual: true,
  };

  const firstMoized = moize(fn, firstOptions);

  const secondOptions = {
    transformArgs(args) {
      return [...args].reverse();
    },
  };

  const secondMoized = moize(firstMoized, secondOptions);

  isMoizedFunction(secondMoized);

  expect(secondMoized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
    transformArgs: secondOptions.transformArgs,
  });

  const {transformKey, ..._microMemoizeOptions} = secondMoized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: deepEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);

  expect(fn.calledOnce).toBe(true);
  expect(fn.calledWith(...args)).toBe(true);

  expect(transformKey.toString()).toBe(utils
    .compose(
      utils.getArrayKey,
      secondOptions.transformArgs
    )
    .toString());
  expect(transformKey(args)).toEqual(utils.compose(
    utils.getArrayKey,
    secondOptions.transformArgs
  )(args));
});

test('if moize.compose calls the internal compose and returns the composed function', () => {
  const functions = [sinon.stub().returnsArg(0), sinon.stub().returnsArg(0)];

  const result = moize.compose(...functions);

  expect(typeof result).toBe('function');

  const arg = {};

  result(arg);

  functions.forEach((fn) => {
    expect(fn.calledOnce).toBe(true);
    expect(fn.calledWith(arg)).toBe(true);
  });
});

test('if moize.compose calls the internal compose and returns moize itself when undefined', () => {
  const functions = [null, false];

  const result = moize.compose(...functions);

  expect(result).toBe(moize);
});

test('if moize.deep will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    isDeepEqual: true,
  };

  const moized = moize.deep(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: deepEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });
});

test('if moize.getStats is the getStats method in stats', () => {
  expect(moize.getStats).toBe(stats.getStats);
});

test('if moize.isCollectingStats returns isCollectingStats in the statsCache', () => {
  const result = moize.isCollectingStats();

  expect(result).toBe(stats.statsCache.isCollectingStats);
});

test('if moize.isMoized returns false if the object passed is not a function', () => {
  const object = 'foo';

  expect(moize.isMoized(object)).toBe(false);
});

test('if moize.isMoized returns false if the object passed is not a moized function', () => {
  const object = () => {};

  expect(moize.isMoized(object)).toBe(false);
});

test('if moize.isMoized returns true if the object passed is a moized function', () => {
  const object = moize(() => {});

  expect(moize.isMoized(object)).toBe(true);
});

test('if moize.maxAge will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    maxAge: 1000,
  };

  const moized = moize.maxAge(options.maxAge)(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxAge: 1000,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  const {onCacheAdd, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });

  expect(onCacheAdd.toString()).toBe(optionsUtils
    .createOnCacheOperation(
      maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
    )
    .toString());
});

test('if moize.maxArgs will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    maxArgs: 1,
  };

  const moized = moize.maxArgs(options.maxArgs)(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxArgs: options.maxArgs,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(maxArgs.createGetInitialArgs(options.maxArgs).toString());
});

test('if moize.maxSize will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    maxSize: 1,
  };

  const moized = moize.maxSize(options.maxSize)(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxSize: options.maxSize,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: options.maxSize,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });
});

test('if moize.promise will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    isPromise: true,
  };

  const moized = moize.promise(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    updateExpire: true,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isPromise: options.isPromise,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
    updateExpire: true,
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: options.isPromise,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });
});

test('if moize.react will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    isReact: true,
  };

  const moized = moize.react(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isReact: options.isReact,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: shallowEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(maxArgs.createGetInitialArgs(2).toString());
});

test('if moize.reactSimple will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    isReact: true,
    maxSize: 1,
  };

  const moized = moize.reactSimple(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isReact: options.isReact,
    maxSize: options.maxSize,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: shallowEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: options.maxSize,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(maxArgs.createGetInitialArgs(2).toString());
});

test('if moize.serialize will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true,
  };

  const moized = moize.serialize(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    isSerialized: options.isSerialized,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  expect(_microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: serialize.getIsSerializedKeyEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
  });

  expect(transformKey.toString()).toBe(serialize.getSerializerFunction(options).toString());
});

test('if moize.simple will produce the correct moized function options', () => {
  const fn = sinon.spy();
  const options = {
    maxSize: 1,
  };

  const moized = moize.simple(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(moized);

  expect(moized.options).toEqual({
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
  });

  expect(moized.options).toEqual({
    ...DEFAULT_OPTIONS,
    maxSize: options.maxSize,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy at <anonymous>',
  });

  expect(moized._microMemoizeOptions).toEqual({
    isEqual: sameValueZeroEqual,
    isMatchingKey: undefined,
    isPromise: false,
    maxSize: options.maxSize,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined,
  });
});

test('if moize will not call onExpire for removed cache items', async () => {
  const fn = sinon.spy();
  const options = {
    maxAge: 500,
    onExpire: sinon.spy(),
  };

  const moized = moize(fn, options);

  const args = ['foo', 'bar'];

  moized(...args);

  expect(moized.cache.keys.length).toBe(1);

  moized.remove(args);

  expect(moized.cache.keys.length).toBe(0);

  moized(...args);

  expect(moized.cache.keys.length).toBe(1);

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge * 2);
  });

  expect(options.onExpire.callCount).toBe(1);
});
