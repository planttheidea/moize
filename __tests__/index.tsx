/* globals describe,document,expect,it,jest */

// test
import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
import React from 'react';
import ReactDOM from 'react-dom';

// src
import moize from '../src/index';
import { DEFAULT_OPTIONS } from '../src/constants';
import {
  createOnCacheAddSetExpiration,
  createOnCacheHitResetExpiration,
} from '../src/maxAge';
import { createGetInitialArgs } from '../src/maxArgs';
import { createOnCacheOperation } from '../src/options';
import {
  getIsSerializedKeyEqual,
  getSerializerFunction,
} from '../src/serialize';
import { collectStats, getStats, statsCache } from '../src/stats';
import { compose, getArrayKey } from '../src/utils';

const { hasOwnProperty } = Object.prototype;

const isMoizedFunction = (fn: Moize.Moized) => {
  expect(hasOwnProperty.call(fn, 'cache')).toBe(true);
  expect(fn.cache).toEqual({
    keys: [],
    size: 0,
    values: [],
  });

  expect(hasOwnProperty.call(fn, 'expirations')).toBe(true);
  expect(fn.expirations).toEqual([]);

  expect(hasOwnProperty.call(fn, 'options')).toBe(true);
  expect(hasOwnProperty.call(fn, '_microMemoizeOptions')).toBe(true);
};

const isStrictEqual = (a: any, b: any) => a === b;

describe('moize', () => {
  it('should handle the standard use-case', () => {
    const fn = jest.fn();

    const moized = moize(fn);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);
  });

  it('should handle a custom equals function correctly', () => {
    const fn = jest.fn();
    const options = {
      equals: isStrictEqual,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      equals: options.equals,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: options.equals,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);
  });

  it('should handle deep equals correctly', () => {
    const fn = jest.fn();
    const options = {
      isDeepEqual: true,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isDeepEqual: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: deepEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const fnArg = () => {};

    const args = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg];

    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);
  });

  it('should handle promises correctly', () => {
    const fn = jest.fn(() => Promise.resolve('done'));
    const options = {
      isPromise: true,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isPromise: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: true,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);
  });

  it('should handle React components correctly', () => {
    const Fn: React.ComponentClass = jest
      .fn()
      .mockImplementation(function FakeComponent(props) {
        return <div>{JSON.stringify(props)}</div>;
      });

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
      profileName: 'Custom at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = Moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: shallowEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    expect(transformKey.toString()).toBe(createGetInitialArgs(2).toString());

    const args = [{ foo: 'bar' }, { bar: 'baz' }, 'trimmed', 'also trimmed'];

    expect(transformKey(args)).toEqual(createGetInitialArgs(2)(args));

    const div = document.createElement('div');

    ReactDOM.render(<Moized {...args[0]} />, div);
    ReactDOM.render(<Moized {...args[0]} />, div);
    ReactDOM.render(<Moized {...args[0]} />, div);
    ReactDOM.render(<Moized {...args[0]} />, div);
    ReactDOM.render(<Moized {...args[0]} />, div);
    ReactDOM.render(<Moized {...args[0]} />, div);
    ReactDOM.render(<Moized {...args[0]} />, div);

    expect(Fn).toHaveBeenCalledTimes(1);
    expect(Fn).toHaveBeenCalledWith(args[0], {});
  });

  it('should handle serialization of keys correctly', () => {
    const fn = jest.fn();
    const options = {
      isSerialized: true,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isSerialized: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: getIsSerializedKeyEqual,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const serializer = getSerializerFunction(options);

    if (typeof serializer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(serializer.toString());

    const fnArg = () => {};

    const args = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg];

    expect(transformKey(args)).toEqual(serializer(args));

    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(moized.cache.keys).toEqual([
      ['|{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|undefined|'],
    ]);
  });

  it('should handle serialization of keys correctly when functions should be serialized', () => {
    const fn = jest.fn();
    const options = {
      isSerialized: true,
      shouldSerializeFunctions: true,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isSerialized: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      shouldSerializeFunctions: true,
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: getIsSerializedKeyEqual,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const serializer = getSerializerFunction(options);

    if (typeof serializer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(serializer.toString());

    const fnArg = () => {};

    const args = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg];

    expect(transformKey(args)).toEqual(serializer(args));

    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(moized.cache.keys).toEqual([
      [`|{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|"${fnArg.toString()}"|`],
    ]);
  });

  it('should handle serialization of keys correctly when a custom serializer is used', () => {
    const fn = jest.fn();
    const options = {
      isSerialized: true,
      serializer: jest.fn(args => [JSON.stringify(args)]),
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isSerialized: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      serializer: options.serializer,
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: getIsSerializedKeyEqual,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const serializer = getSerializerFunction(options);

    if (typeof serializer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(serializer.toString());

    const fnArg = () => {};

    const args = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg];

    expect(transformKey(args)).toEqual(serializer(args));

    options.serializer.mockClear();

    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);
    moized({ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(options.serializer).toHaveBeenCalledTimes(5);
    expect(options.serializer).toHaveBeenCalledWith(args);

    expect(moized.cache.keys).toEqual([
      ['[{"foo":"foo"},{"bar":"bar"},{"baz":"baz"},null]'],
    ]);
  });

  it('should handle expiration of items in cache via maxAge correctly', async () => {
    const fn = jest.fn();
    const options = {
      maxAge: 100,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxAge: options.maxAge,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const { onCacheAdd, ..._microMemoizeOptions } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const onAdd = createOnCacheOperation(
      createOnCacheAddSetExpiration(
        moized.expirations,
        options,
        _microMemoizeOptions.isEqual,
      ),
    );

    if (typeof onAdd !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(onCacheAdd.toString()).toBe(onAdd.toString());

    expect(moized.cache.keys.length).toBe(1);

    await new Promise((resolve: Function) => {
      setTimeout(resolve, options.maxAge + 50);
    });

    expect(moized.cache.keys.length).toBe(0);
  });

  it('should handle limiting of arguments via maxArgs passed correctly', () => {
    const fn = jest.fn();
    const options = {
      maxArgs: 1,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxArgs: 1,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(transformKey.toString()).toBe(
      createGetInitialArgs(options.maxArgs).toString(),
    );
    expect(transformKey(args)).toEqual(
      createGetInitialArgs(options.maxArgs)(args),
    );
  });

  it('should handle limiting of cache size via maxSize correctly', () => {
    const fn = jest.fn();
    const options = {
      maxSize: 1,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxSize: 1,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: 1,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];
    const reverseArgs = [...args].reverse();

    moized(...args);
    moized(...reverseArgs);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, ...args);
    expect(fn).toHaveBeenNthCalledWith(2, ...reverseArgs);

    expect(moized.cacheSnapshot.keys).toEqual([reverseArgs]);
  });

  it('should handle an onCacheAdd method correctly', () => {
    const fn = jest.fn();
    const options = {
      onCacheAdd: jest.fn(),
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      onCacheAdd: options.onCacheAdd,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      onCacheAdd: onCacheAddIgnored,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(options.onCacheAdd).toHaveBeenCalledTimes(1);
    expect(options.onCacheAdd).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should handle an onCacheChange method correctly', () => {
    const fn = jest.fn();
    const options = {
      onCacheChange: jest.fn(),
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      onCacheChange: options.onCacheChange,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      onCacheChange: onCacheChangeIgnored,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(options.onCacheChange).toHaveBeenCalledTimes(1);
    expect(options.onCacheChange).toHaveBeenCalledWith(
      moized.cache,
      moized.options,
      moized,
    );
  });

  it('should handle an onCacheHit method correctly', () => {
    const fn = jest.fn();
    const options = {
      onCacheHit: jest.fn(),
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      onCacheHit: options.onCacheHit,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      onCacheHit: onCacheHitIgnored,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    expect(options.onCacheHit).toHaveBeenCalledTimes(6);

    for (let callIndex = 1; callIndex < 7; callIndex++) {
      expect(options.onCacheHit).toHaveBeenNthCalledWith(
        callIndex,
        moized.cache,
        moized.options,
        moized,
      );
    }
  });

  it('should handle an onExpire method for cache expiration correctly', async () => {
    const fn = jest.fn();
    const options = {
      maxAge: 100,
      onExpire: jest.fn(),
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxAge: options.maxAge,
      onExpire: options.onExpire,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const { onCacheAdd, ..._microMemoizeOptions } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const onAdd = createOnCacheOperation(
      createOnCacheAddSetExpiration(
        moized.expirations,
        options,
        _microMemoizeOptions.isEqual,
      ),
    );

    if (typeof onAdd !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(onCacheAdd.toString()).toBe(onAdd.toString());

    expect(moized.cache.keys.length).toBe(1);

    await new Promise((resolve: Function) => {
      setTimeout(resolve, options.maxAge + 50);
    });

    expect(moized.cache.keys.length).toBe(0);

    expect(options.onExpire).toHaveBeenCalledTimes(1);
  });

  it('should handle a custom profileName for stats collection correctly', () => {
    const fn = jest.fn();
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
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });
  });

  it('should handle a custom transformArgs method correctly', () => {
    const fn = jest.fn();
    const options = {
      transformArgs(args: any[]) {
        return [...args].reverse();
      },
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      transformArgs: options.transformArgs,
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const transformer = compose(
      getArrayKey,
      options.transformArgs,
    );

    if (typeof transformer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(transformer.toString());
    expect(transformKey(args)).toEqual(transformer(args));
  });

  it('should handle an updateExpire method for cache expiration correctly', async () => {
    const fn = jest.fn();
    const options = {
      maxAge: 100,
      updateExpire: true,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxAge: options.maxAge,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      updateExpire: options.updateExpire,
    });

    const {
      onCacheAdd,
      onCacheHit,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    const _clearTimeout = global.clearTimeout;

    global.clearTimeout = jest.fn();

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const onAdd = createOnCacheOperation(
      createOnCacheAddSetExpiration(
        moized.expirations,
        options,
        _microMemoizeOptions.isEqual,
      ),
    );

    if (typeof onAdd !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(onCacheAdd.toString()).toBe(onAdd.toString());

    const onHit = createOnCacheOperation(
      createOnCacheHitResetExpiration(moized.expirations, options),
    );

    if (typeof onHit !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(onCacheHit.toString()).toBe(onHit.toString());

    expect(moized.cache.keys.length).toBe(1);

    expect(global.clearTimeout).toHaveBeenCalledTimes(6);

    global.clearTimeout = _clearTimeout;

    await new Promise((resolve: Function) => {
      setTimeout(resolve, options.maxAge + 50);
    });

    expect(moized.cache.keys.length).toBe(0);
  });

  it('should handle additional custom options correctly', () => {
    const fn = jest.fn();
    const options = {
      customOption: 'value',
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      customOption: 'value',
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      customOption: 'value',
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);
  });

  it('should handle a curried options implementation correctly', () => {
    const fn = jest.fn();
    const firstOptions = {
      isDeepEqual: true,
    };
    const secondOptions = {
      transformArgs(args: any[]) {
        return [...args].reverse();
      },
    };

    const moized = moize(firstOptions)(secondOptions)(fn);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isDeepEqual: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      transformArgs: secondOptions.transformArgs,
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: deepEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const transformer = compose(
      getArrayKey,
      secondOptions.transformArgs,
    );

    if (typeof transformer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(transformer.toString());
    expect(transformKey(args)).toEqual(transformer(args));
  });

  it('should handle a curried options implementation correctly when the final call has options', () => {
    const fn = jest.fn();
    const firstOptions = {
      isDeepEqual: true,
    };
    const secondOptions = {
      transformArgs(args: any[]) {
        return [...args].reverse();
      },
    };

    const moized = moize(firstOptions)(fn, secondOptions);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isDeepEqual: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      transformArgs: secondOptions.transformArgs,
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: deepEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);
    moized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const transformer = compose(
      getArrayKey,
      secondOptions.transformArgs,
    );

    if (typeof transformer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(transformer.toString());
    expect(transformKey(args)).toEqual(transformer(args));
  });

  it('should handle moizing a previously-moized function correctly', () => {
    const fn = jest.fn();
    const firstOptions = {
      isDeepEqual: true,
    };

    const firstMoized = moize(fn, firstOptions);

    const secondOptions = {
      transformArgs(args: any[]) {
        return [...args].reverse();
      },
    };

    const secondMoized = moize(firstMoized, secondOptions);

    isMoizedFunction(secondMoized);

    expect(secondMoized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isDeepEqual: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      transformArgs: secondOptions.transformArgs,
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = secondMoized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: deepEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });

    const args = ['foo', 'bar', 'baz', 'quz'];

    secondMoized(...args);
    secondMoized(...args);
    secondMoized(...args);
    secondMoized(...args);
    secondMoized(...args);
    secondMoized(...args);
    secondMoized(...args);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(...args);

    const transformer = compose(
      getArrayKey,
      secondOptions.transformArgs,
    );

    if (typeof transformer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(transformer.toString());
    expect(transformKey(args)).toEqual(transformer(args));
  });

  it('should not call onExpire for removed cache items', async () => {
    const fn = jest.fn();
    const options = {
      maxAge: 500,
      onExpire: jest.fn(),
    };

    const moized = moize(fn, options);

    const args = ['foo', 'bar'];

    moized(...args);

    expect(moized.cache.keys.length).toBe(1);

    moized.remove(args);

    expect(moized.cache.keys.length).toBe(0);

    moized(...args);

    expect(moized.cache.keys.length).toBe(1);

    await new Promise((resolve: Function) => {
      setTimeout(resolve, options.maxAge * 2);
    });

    expect(options.onExpire).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when no arguments passed', () => {
    // @ts-ignore
    expect(() => moize()).toThrow();
  });

  it('should throw an error when the first argument is neither function nor object', () => {
    // @ts-ignore
    expect(() => moize('foo')).toThrow();
  });
});

describe('moize.collectStats', () => {
  it('is the collectStats method in stats', () => {
    expect(moize.collectStats).toBe(collectStats);
  });
});

describe('moize.compose', () => {
  it('should call the internal compose and returns the composed function', () => {
    const functions = [jest.fn(value => value), jest.fn(value => value)];

    const result = moize.compose(...functions);

    expect(typeof result).toBe('function');

    const arg = {};

    result(arg);

    functions.forEach((fn: jest.Mock) => {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(arg);
    });
  });

  it('should call the internal compose and returns moize itself when undefined', () => {
    const functions = [null, false];

    const result = moize.compose(...functions);

    expect(result).toBe(moize);
  });
});

describe('moize.deep', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      isDeepEqual: true,
    };

    const moized = moize.deep(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isDeepEqual: true,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: deepEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
    });
  });
});

describe('moize.getStats', () => {
  it('is the getStats method in stats', () => {
    expect(moize.getStats).toBe(getStats);
  });
});

describe('moize.isCollectingStas', () => {
  it('returns isCollectingStats in the statsCache', () => {
    const result = moize.isCollectingStats();

    expect(result).toBe(statsCache.isCollectingStats);
  });
});

describe('moize.isMoized', () => {
  it('should return false if the object passed is not a function', () => {
    const object = 'foo';

    expect(moize.isMoized(object)).toBe(false);
  });

  it('should return false if the object passed is not a moized function', () => {
    const object = () => {};

    expect(moize.isMoized(object)).toBe(false);
  });

  it('should return true if the object passed is a moized function', () => {
    const object = moize(() => {});

    expect(moize.isMoized(object)).toBe(true);
  });
});

describe('moize.maxAge', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      maxAge: 1000,
    };

    const moized = moize.maxAge(options.maxAge)(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxAge: 1000,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const { onCacheAdd, ..._microMemoizeOptions } = moized._microMemoizeOptions;

    const fakeOnCacheOperation = createOnCacheOperation(moized);

    if (typeof fakeOnCacheOperation !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });

    const onAdd = createOnCacheOperation(
      createOnCacheAddSetExpiration(
        moized.expirations,
        options,
        _microMemoizeOptions.isEqual,
      ),
    );

    if (typeof onAdd !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(onCacheAdd.toString()).toBe(fakeOnCacheOperation.toString());
  });

  it('should throw if maxAge is a negative number', () => {
    expect(() => moize(() => {}, { maxAge: -1 })).toThrow();
  });

  it('should throw if maxAge is a NaN', () => {
    expect(() => moize(() => {}, { maxAge: NaN })).toThrow();
  });

  it('should throw if maxAge is a decimal', () => {
    expect(() => moize(() => {}, { maxAge: 1.23 })).toThrow();
  });
});

describe('moize.maxArgs', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      maxArgs: 1,
    };

    const moized = moize.maxArgs(options.maxArgs)(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxArgs: options.maxArgs,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });

    expect(transformKey.toString()).toBe(
      createGetInitialArgs(options.maxArgs).toString(),
    );
  });

  it('should throw if maxArgs is a negative number', () => {
    expect(() => moize(() => {}, { maxArgs: -1 })).toThrow();
  });

  it('should throw if maxArgs is a NaN', () => {
    expect(() => moize(() => {}, { maxArgs: NaN })).toThrow();
  });

  it('should throw if maxArgs is a decimal', () => {
    expect(() => moize(() => {}, { maxArgs: 1.23 })).toThrow();
  });
});

describe('moize.maxSize', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      maxSize: 1,
    };

    const moized = moize.maxSize(options.maxSize)(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxSize: options.maxSize,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: options.maxSize,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });
  });

  it('should throw if maxSize is a negative number', () => {
    expect(() => moize(() => {}, { maxSize: -1 })).toThrow();
  });

  it('should throw if maxSize is a NaN', () => {
    expect(() => moize(() => {}, { maxSize: NaN })).toThrow();
  });

  it('should throw if maxSize is a decimal', () => {
    expect(() => moize(() => {}, { maxSize: 1.23 })).toThrow();
  });
});

describe('moize.promise', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      isPromise: true,
    };

    const moized = moize.promise(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
      updateExpire: true,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isPromise: options.isPromise,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
      updateExpire: true,
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: options.isPromise,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });
  });
});

describe('moize.react', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      isReact: true,
    };

    const moized = moize.react(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isReact: options.isReact,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: shallowEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });

    expect(transformKey.toString()).toBe(createGetInitialArgs(2).toString());
  });
});

describe('moize.reactSimple', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      isReact: true,
      maxSize: 1,
    };

    const moized = moize.reactSimple(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isReact: options.isReact,
      maxSize: options.maxSize,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: shallowEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: options.maxSize,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });

    expect(transformKey.toString()).toBe(createGetInitialArgs(2).toString());
  });
});

describe('moize.serialize', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      isSerialized: true,
    };

    const moized = moize.serialize(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      isSerialized: options.isSerialized,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    const {
      transformKey,
      ..._microMemoizeOptions
    } = moized._microMemoizeOptions;

    expect(_microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: getIsSerializedKeyEqual,
      isPromise: false,
      maxSize: Infinity,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });

    const serializer = getSerializerFunction(options);

    if (typeof serializer !== 'function') {
      throw new TypeError('should be a function');
    }

    expect(transformKey.toString()).toBe(serializer.toString());
  });
});

describe('moize.simple', () => {
  it('should produce the correct moized function options', () => {
    const fn = jest.fn();
    const options = {
      maxSize: 1,
    };

    const moized = moize.simple(fn);
    const moizedStandard = moize(fn, options);

    isMoizedFunction(moized);

    expect(moized.options).toEqual({
      ...moizedStandard.options,
    });

    expect(moized.options).toEqual({
      ...DEFAULT_OPTIONS,
      maxSize: options.maxSize,
      profileName: 'mockConstructor at new Promise (<anonymous>)',
    });

    expect(moized._microMemoizeOptions).toEqual({
      isEqual: sameValueZeroEqual,
      isMatchingKey: undefined,
      isPromise: false,
      maxSize: options.maxSize,
      onCacheAdd: undefined,
      onCacheChange: undefined,
      onCacheHit: undefined,
      transformKey: undefined,
    });
  });
});
