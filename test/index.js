// test
import test from 'ava';
import {deepEqual, sameValueZeroEqual, shallowEqual} from 'fast-equals';
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
import {createOnCacheAddIncrementCalls} from '../src/stats';

const moize = index.default;

const isMoizedFunction = (t, fn) => {
  t.true(fn.hasOwnProperty('cache'));
  t.deepEqual(fn.cache, {
    keys: [],
    size: 0,
    values: []
  });

  t.true(fn.hasOwnProperty('expirations'));
  t.deepEqual(fn.expirations, []);

  t.true(fn.hasOwnProperty('options'));
  t.true(fn.hasOwnProperty('_microMemoizeOptions'));
};

test('if collectStats exists as a named export', (t) => {
  t.is(index.collectStats, stats.collectStats);
});

test('if moize will handle the standard use-case', (t) => {
  const fn = sinon.spy();

  const moized = moize(fn);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));
});

test('if moize will handle a custom equals function correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    equals(a, b) {
      return a === b;
    }
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    equals: options.equals,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: options.equals,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));
});

test('if moize will handle deep equals correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    isDeepEqual: true
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: true,
    isEqual: deepEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
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

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));
});

test('if moize will handle promises correctly', (t) => {
  const fn = sinon.stub().resolves('done');
  const options = {
    isPromise: true
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isPromise: true,
    profileName: 'stub'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: true,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));
});

test.serial('if moize will handle React components correctly', (t) => {
  const jsdom = require('jsdom-global')();

  const Fn = sinon.stub().callsFake((props) => {
    return <div />;
  });

  Fn.contextTypes = {};
  Fn.displayName = 'Custom';
  Fn.defaultProps = {};
  Fn.propTypes = {};

  const options = {
    isReact: true
  };

  const Moized = moize(Fn, options);

  isMoizedFunction(t, Moized);

  t.deepEqual(Moized.options, {
    ...DEFAULT_OPTIONS,
    isReact: true,
    profileName: 'Custom'
  });

  const {transformKey, ..._microMemoizeOptions} = Moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: shallowEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), maxArgs.createGetInitialArgs(2).toString());

  const args = [{foo: 'bar'}, {bar: 'baz'}, 'trimmed', 'also trimmed'];

  t.deepEqual(transformKey(args), maxArgs.createGetInitialArgs(2)(args));

  const div = document.createElement('div');

  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);
  ReactDOM.render(<Moized {...args[0]} />, div);

  t.true(Fn.calledOnce);
  t.true(Fn.calledWith(args[0], {}));

  jsdom();
});

test('if moize will handle serialization of keys correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isSerialized: true,
    profileName: 'spy'
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), serialize.getSerializerFunction(options).toString());

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  t.deepEqual(transformKey(args), serialize.getSerializerFunction(options)(args));

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.deepEqual(moized.cache.keys, [['|{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|undefined|']]);
});

test('if moize will handle serialization of keys correctly when functions should be serialized', (t) => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true,
    shouldSerializeFunctions: true
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isSerialized: true,
    profileName: 'spy',
    shouldSerializeFunctions: true
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), serialize.getSerializerFunction(options).toString());

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  t.deepEqual(transformKey(args), serialize.getSerializerFunction(options)(args));

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.deepEqual(moized.cache.keys, [[`|{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|"${fnArg.toString()}"|`]]);
});

test('if moize will handle serialization of keys correctly when a custom serializer is used', (t) => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true,
    serializer: sinon.stub().callsFake(JSON.stringify)
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isSerialized: true,
    profileName: 'spy',
    serializer: options.serializer
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), serialize.getSerializerFunction(options).toString());

  const fnArg = () => {};

  const args = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg];

  t.deepEqual(transformKey(args), serialize.getSerializerFunction(options)(args));

  options.serializer.resetHistory();

  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);
  moized({foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}, fnArg);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(options.serializer.callCount, 5);
  t.true(options.serializer.calledWith(args));

  t.deepEqual(moized.cache.keys, [['[{"foo":"foo"},{"bar":"bar"},{"baz":"baz"},null]']]);
});

test('if moize will handle expiration of items in cache via maxAge correctly', async (t) => {
  const fn = sinon.spy();
  const options = {
    maxAge: 100
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxAge: options.maxAge,
    profileName: 'spy at new Promise (<anonymous>)'
  });

  const {onCacheAdd, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(
    onCacheAdd.toString(),
    optionsUtils
      .createOnCacheOperation(
        maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
      )
      .toString()
  );

  t.is(moized.cache.keys.length, 1);

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge + 50);
  });

  t.is(moized.cache.keys.length, 0);
});

test('if moize will handle limiting of arguments via maxArgs passed correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    maxArgs: 1
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxArgs: 1,
    profileName: 'spy'
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(transformKey.toString(), maxArgs.createGetInitialArgs(options.maxArgs).toString());
  t.deepEqual(transformKey(args), maxArgs.createGetInitialArgs(options.maxArgs)(args));
});

test('if moize will handle limiting of cache size via maxSize correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    maxSize: 1
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxSize: 1,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: 1,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];
  const reverseArgs = [...args].reverse();

  moized(...args);
  moized(...reverseArgs);

  t.true(fn.calledTwice);
  t.deepEqual(fn.args, [args, reverseArgs]);

  t.deepEqual(moized.cacheSnapshot.keys, [reverseArgs]);
});

test('if moize will handle an onCacheAdd method correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    onCacheAdd: sinon.spy()
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    onCacheAdd: options.onCacheAdd,
    profileName: 'spy'
  });

  const {onCacheAdd: onCacheAddIgnored, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.true(options.onCacheAdd.calledOnce);
  t.true(options.onCacheAdd.calledWith(moized.cache, moized.options, moized));
});

test('if moize will handle an onCacheChange method correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    onCacheChange: sinon.spy()
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    onCacheChange: options.onCacheChange,
    profileName: 'spy'
  });

  const {onCacheChange: onCacheChangeIgnored, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.true(options.onCacheChange.calledOnce);
  t.true(options.onCacheChange.calledWith(moized.cache, moized.options, moized));
});

test('if moize will handle an onCacheHit method correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    onCacheHit: sinon.spy()
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    onCacheHit: options.onCacheHit,
    profileName: 'spy'
  });

  const {onCacheHit: onCacheHitIgnored, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(options.onCacheHit.callCount, 6);

  const expectedArg = {
    keys: moized.cache.keys,
    values: moized.cache.values
  };

  t.deepEqual(options.onCacheHit.args, [
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized],
    [moized.cache, moized.options, moized]
  ]);
});

test('if moize will handle an onExpire method for cache expiration correctly', async (t) => {
  const fn = sinon.spy();
  const options = {
    maxAge: 100,
    onExpire: sinon.spy()
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxAge: options.maxAge,
    onExpire: options.onExpire,
    profileName: 'spy at new Promise (<anonymous>)'
  });

  const {onCacheAdd, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(
    onCacheAdd.toString(),
    optionsUtils
      .createOnCacheOperation(
        maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
      )
      .toString()
  );

  t.is(moized.cache.keys.length, 1);

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge + 50);
  });

  t.is(moized.cache.keys.length, 0);

  t.true(options.onExpire.calledOnce);
});

test('if moize will handle a custom profileName for stats collection correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    profileName: 'custom'
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    profileName: options.profileName
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });
});

test('if moize will handle a custom transformArgs method correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    transformArgs(args) {
      return [...args].reverse();
    }
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    profileName: 'spy',
    transformArgs: options.transformArgs
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(transformKey.toString(), utils.compose(utils.getArrayKey, options.transformArgs).toString());
  t.deepEqual(transformKey(args), utils.compose(utils.getArrayKey, options.transformArgs)(args));
});

test('if moize will handle an updateExpire method for cache expiration correctly', async (t) => {
  const fn = sinon.spy();
  const options = {
    maxAge: 100,
    updateExpire: true
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxAge: options.maxAge,
    profileName: 'spy at new Promise (<anonymous>)',
    updateExpire: options.updateExpire
  });

  const {onCacheAdd, onCacheHit, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    transformKey: undefined
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

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(
    onCacheAdd.toString(),
    optionsUtils
      .createOnCacheOperation(
        maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
      )
      .toString()
  );
  t.is(
    onCacheHit.toString(),
    optionsUtils.createOnCacheOperation(maxAge.createOnCacheHitResetExpiration(moized.expirations, options)).toString()
  );

  t.is(moized.cache.keys.length, 1);

  t.is(clearTimeoutSpy.callCount, 6);

  clearTimeoutSpy.restore();

  await new Promise((resolve) => {
    setTimeout(resolve, options.maxAge + 50);
  });

  t.is(moized.cache.keys.length, 0);
});

test('if moize will handle additional custom options correctly', (t) => {
  const fn = sinon.spy();
  const options = {
    customOption: 'value'
  };

  const moized = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    customOption: 'value',
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    customOption: 'value',
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));
});

test('if moize will handle a curried options implementation correctly', (t) => {
  const fn = sinon.spy();
  const firstOptions = {
    isDeepEqual: true
  };
  const secondOptions = {
    transformArgs(args) {
      return [...args].reverse();
    }
  };

  const moized = moize(firstOptions)(secondOptions)(fn);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy',
    transformArgs: secondOptions.transformArgs
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: true,
    isEqual: deepEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(transformKey.toString(), utils.compose(utils.getArrayKey, secondOptions.transformArgs).toString());
  t.deepEqual(transformKey(args), utils.compose(utils.getArrayKey, secondOptions.transformArgs)(args));
});

test('if moize will handle a curried options implementation correctly when the final call has options', (t) => {
  const fn = sinon.spy();
  const firstOptions = {
    isDeepEqual: true
  };
  const secondOptions = {
    transformArgs(args) {
      return [...args].reverse();
    }
  };

  const moized = moize(firstOptions)(fn, secondOptions);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy',
    transformArgs: secondOptions.transformArgs
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: true,
    isEqual: deepEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);
  moized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(transformKey.toString(), utils.compose(utils.getArrayKey, secondOptions.transformArgs).toString());
  t.deepEqual(transformKey(args), utils.compose(utils.getArrayKey, secondOptions.transformArgs)(args));
});

test('if moize will handle moizing a previously-moized function correctly', (t) => {
  const fn = sinon.spy();
  const firstOptions = {
    isDeepEqual: true
  };

  const firstMoized = moize(fn, firstOptions);

  const secondOptions = {
    transformArgs(args) {
      return [...args].reverse();
    }
  };

  const secondMoized = moize(firstMoized, secondOptions);

  isMoizedFunction(t, secondMoized);

  t.deepEqual(secondMoized.options, {
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy',
    transformArgs: secondOptions.transformArgs
  });

  const {transformKey, ..._microMemoizeOptions} = secondMoized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: true,
    isEqual: deepEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  const args = ['foo', 'bar', 'baz', 'quz'];

  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);
  secondMoized(...args);

  t.true(fn.calledOnce);
  t.true(fn.calledWith(...args));

  t.is(transformKey.toString(), utils.compose(utils.getArrayKey, secondOptions.transformArgs).toString());
  t.deepEqual(transformKey(args), utils.compose(utils.getArrayKey, secondOptions.transformArgs)(args));
});

test('if moize.compose calls the internal compose and returns the composed function', (t) => {
  const functions = [sinon.stub().returnsArg(0), sinon.stub().returnsArg(0)];

  const result = moize.compose(...functions);

  t.is(typeof result, 'function');

  const arg = {};

  result(arg);

  functions.forEach((fn) => {
    t.true(fn.calledOnce);
    t.true(fn.calledWith(arg));
  });
});

test('if moize.compose calls the internal compose and returns moize itself when undefined', (t) => {
  const functions = [null, false];

  const result = moize.compose(...functions);

  t.is(result, moize);
});

test('if moize.deep will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    isDeepEqual: true
  };

  const moized = moize.deep(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isDeepEqual: true,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: true,
    isEqual: deepEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });
});

test('if moize.getStats is the getStats method in stats', (t) => {
  t.is(moize.getStats, stats.getStats);
});

test('if moize.isCollectingStats returns isCollectingStats in the statsCache', (t) => {
  const result = moize.isCollectingStats();

  t.is(result, stats.statsCache.isCollectingStats);
});

test('if moize.isMoized returns false if the object passed is not a function', (t) => {
  const object = 'foo';

  t.false(moize.isMoized(object));
});

test('if moize.isMoized returns false if the object passed is not a moized function', (t) => {
  const object = () => {};

  t.false(moize.isMoized(object));
});

test('if moize.isMoized returns true if the object passed is a moized function', (t) => {
  const object = moize(() => {});

  t.true(moize.isMoized(object));
});

test('if moize.maxAge will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    maxAge: 1000
  };

  const moized = moize.maxAge(options.maxAge)(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxAge: 1000,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  const {onCacheAdd, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });

  t.is(
    onCacheAdd.toString(),
    optionsUtils
      .createOnCacheOperation(
        maxAge.createOnCacheAddSetExpiration(moized.expirations, options, _microMemoizeOptions.isEqual)
      )
      .toString()
  );
});

test('if moize.maxArgs will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    maxArgs: 1
  };

  const moized = moize.maxArgs(options.maxArgs)(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxArgs: options.maxArgs,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), maxArgs.createGetInitialArgs(options.maxArgs).toString());
});

test('if moize.maxSize will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    maxSize: 1
  };

  const moized = moize.maxSize(options.maxSize)(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxSize: options.maxSize,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: options.maxSize,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });
});

test('if moize.promise will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    isPromise: true
  };

  const moized = moize.promise(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    updateExpire: true
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isPromise: options.isPromise,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy',
    updateExpire: true
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: options.isPromise,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });
});

test('if moize.react will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    isReact: true
  };

  const moized = moize.react(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isReact: options.isReact,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: shallowEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), maxArgs.createGetInitialArgs(2).toString());
});

test('if moize.reactSimple will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    isReact: true,
    maxSize: 1
  };

  const moized = moize.reactSimple(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isReact: options.isReact,
    maxSize: options.maxSize,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: shallowEqual,
    isPromise: false,
    maxSize: options.maxSize,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), maxArgs.createGetInitialArgs(2).toString());
});

test('if moize.serialize will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    isSerialized: true
  };

  const moized = moize.serialize(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    isSerialized: options.isSerialized,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  const {transformKey, ..._microMemoizeOptions} = moized._microMemoizeOptions;

  t.deepEqual(_microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: Infinity,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation
  });

  t.is(transformKey.toString(), serialize.getSerializerFunction(options).toString());
});

test('if moize.simple will produce the correct moized function options', (t) => {
  const fn = sinon.spy();
  const options = {
    maxSize: 1
  };

  const moized = moize.simple(fn);
  const moizedStandard = moize(fn, options);

  isMoizedFunction(t, moized);

  t.deepEqual(moized.options, {
    ...moizedStandard.options,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined
  });

  t.deepEqual(moized.options, {
    ...DEFAULT_OPTIONS,
    maxSize: options.maxSize,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    profileName: 'spy'
  });

  t.deepEqual(moized._microMemoizeOptions, {
    isDeepEqual: false,
    isEqual: sameValueZeroEqual,
    isPromise: false,
    maxSize: options.maxSize,
    onCacheAdd: onCacheOperation,
    onCacheChange: onCacheOperation,
    onCacheHit: onCacheOperation,
    transformKey: undefined
  });
});
