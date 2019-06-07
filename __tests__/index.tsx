// test
import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
import React from 'react';
import ReactDOM from 'react-dom';

// src
import moize from '../src/index';

import { createOnCacheOperation } from '../src/cache';
import { getMaxAgeOptions } from '../src/maxAge';
import { createGetInitialArgs } from '../src/maxArgs';
import { DEFAULT_OPTIONS, getMicroMemoizeOptions } from '../src/options';
import { getSerializerFunction, getStringifiedArgs, stringify } from '../src/serialize';
import { collectStats, getStats, getStatsCache, getStatsOptions } from '../src/stats';
import { combine, compose } from '../src/utils';

import { Moize } from '../src/types';

const { hasOwnProperty } = Object.prototype;

type CacheHandler = (cache: Moize.Cache, options: Moize.Options, memoized: Moize.Moized<Moize.Moizable>) => void;

function getOptions(
  options: Moize.Options,
  profileName: string,
  type: keyof typeof DEFAULT_OPTIONS = '__global__',
): Moize.Options {
  const merged = {
    ...DEFAULT_OPTIONS[type],
    ...options,
  };
  const maxAgeOptions = getMaxAgeOptions(merged);
  const statsOptions = getStatsOptions(merged);

  const onCacheAdd = createOnCacheOperation(
    combine(merged.onCacheAdd, maxAgeOptions.onCacheAdd, statsOptions.onCacheAdd),
  );
  const onCacheChange = createOnCacheOperation(merged.onCacheChange);
  const onCacheHit = createOnCacheOperation(
    combine(merged.onCacheHit, maxAgeOptions.onCacheHit, statsOptions.onCacheHit),
  );

  return {
    ...merged,
    _mm: getMicroMemoizeOptions(merged, onCacheAdd, onCacheChange, onCacheHit),
    profileName,
  };
}

const isMoizedFunction = (fn: Moize.Moized<Moize.Moizable>, options: Moize.Options) => {
  expect(hasOwnProperty.call(fn, 'cache')).toBe(true);
  expect(fn.cache.snapshot).toEqual({
    keys: [],
    size: 0,
    values: [],
  });

  expect(hasOwnProperty.call(fn.cache, 'expirations')).toBe(true);
  expect(fn.cache.expirations).toEqual([]);

  expect(hasOwnProperty.call(fn, 'options')).toBe(true);
  expect(hasOwnProperty.call(fn.options, '_mm')).toBe(true);

  // expect(fn.options).toEqual(options);
  expect(stringify(fn.options)).toEqual(stringify(options));
};

const isStrictEqual = (a: any, b: any) => a === b;

describe('moize', () => {
  it('should handle the standard use-case', () => {
    const fn = jest.fn();

    const moized = moize(fn);

    isMoizedFunction(moized, getOptions({}, 'mockConstructor 1'));

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

    isMoizedFunction(moized, getOptions(options, 'mockConstructor 2'));

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

    isMoizedFunction(moized, getOptions(options, 'mockConstructor 3'));

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
    const fn = jest.fn().mockImplementation(() => Promise.resolve('done'));
    const options = {
      isPromise: true,
    };

    const moized = moize(fn, options);

    isMoizedFunction(moized, getOptions(options, 'mockConstructor 4'));

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

  it('should handle React components correctly when global', () => {
    const Fn = jest.fn().mockImplementation(function FakeComponent(props) {
      return <div>{JSON.stringify(props)}</div>;
    }) as Moize.Moizable;

    Fn.contextTypes = {};
    Fn.displayName = 'Custom';
    Fn.defaultProps = {};
    Fn.propTypes = {};

    const options = {
      isReact: true,
      isReactGlobal: true,
    };

    const Moized = moize(Fn, options);

    isMoizedFunction(Moized, getOptions(options, 'Custom 1'));

    const { transformKey } = Moized.options._mm;

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
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 5'));

      const fnArg = () => {};

      const args = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg];

      const { transformKey } = moized.options._mm;

      expect(transformKey(args)).toEqual(getStringifiedArgs(args));

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
        [`{"foo":"foo"}|{"bar":"bar"}|{"baz":"baz"}|"${fnArg.toString()}"`],
      ]);
    });

    it('should handle serialization of keys correctly when a custom serializer is used', () => {
      const fn = jest.fn();
      const options = {
        isSerialized: true,
        serializer: jest.fn((args: any[]): [string] => [JSON.stringify(args)]),
      };

      const moized = moize(fn, options);
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 6'));

      const fnArg = () => {};

      const args = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }, fnArg];

      const { transformKey } = moized.options._mm;

      expect(transformKey(args)).toEqual(options.serializer(args));

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
      const maxAgeOptions = getMaxAgeOptions({
        ...options,
        updateExpire: true
      });

      const moized = moize(fn, options);
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 7'));

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
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 8'));

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
      
      const { transformKey } = moized.options._mm;

      expect(transformKey(args)).toEqual(
        createGetInitialArgs(options.maxArgs)(args),
      );
    });

    it('should handle limiting of cache size via maxSize correctly', () => {
      const fn = jest.fn();
      const options = {
        maxSize: 2,
      };

      const moized = moize(fn, options);
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 9'));

      const args = ['foo', 'bar', 'baz', 'quz'];
      const reverseArgs = [...args].reverse();

      moized(...args);
      moized(...reverseArgs);
      moized(...args);
      moized(...reverseArgs);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, ...args);
      expect(fn).toHaveBeenNthCalledWith(2, ...reverseArgs);

      expect(moized.keys()).toEqual([reverseArgs, args]);
    });

    it('should handle an onCacheAdd method correctly', () => {
      const fn = jest.fn();
      const options = {
        onCacheAdd: jest.fn(),
      };

      const moized = moize(fn, options);
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 10'));

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
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 11'));

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
  
      isMoizedFunction(moized, getOptions(options, 'mockConstructor 12'));

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

  //   it('should handle an onExpire method for cache expiration correctly', async () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxAge: 100,
  //       onExpire: jest.fn(),
  //     };

  //     const moized = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       maxAge: options.maxAge,
  //       onExpire: options.onExpire,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     const { onCacheAdd, ..._microMemoizeOptions } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);

  //     expect(moized.cache.keys.length).toBe(1);

  //     await new Promise((resolve: Function) => {
  //       setTimeout(resolve, options.maxAge + 50);
  //     });

  //     expect(moized.cache.keys.length).toBe(0);

  //     expect(options.onExpire).toHaveBeenCalledTimes(1);
  //   });

  //   it('should handle a custom profileName for stats collection correctly', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       profileName: 'custom',
  //     };

  //     const moized = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       profileName: options.profileName,
  //     });

  //     expect(moized.options._mm).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });
  //   });

  //   it('should handle a custom transformArgs method correctly', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       transformArgs(args: any[]) {
  //         return [...args].reverse();
  //       },
  //     };

  //     const moized = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //       transformArgs: options.transformArgs,
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);

  //     const transformer = options.transformArgs;

  //     if (typeof transformer !== 'function') {
  //       throw new TypeError('should be a function');
  //     }

  //     expect(transformKey.toString()).toBe(transformer.toString());
  //     expect(transformKey(args)).toEqual(transformer(args));
  //   });

  //   it('should handle an updateExpire method for cache expiration correctly', async () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxAge: 100,
  //       updateExpire: true,
  //     };

  //     const moized = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       maxAge: options.maxAge,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //       updateExpire: options.updateExpire,
  //     });

  //     const {
  //       onCacheAdd,
  //       onCacheHit,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     const _clearTimeout = global.clearTimeout;

  //     global.clearTimeout = jest.fn();

  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);

  //     expect(moized.cache.keys.length).toBe(1);

  //     expect(global.clearTimeout).toHaveBeenCalledTimes(6);

  //     global.clearTimeout = _clearTimeout;

  //     await new Promise((resolve: Function) => {
  //       setTimeout(resolve, options.maxAge + 50);
  //     });

  //     expect(moized.cache.keys.length).toBe(0);
  //   });

  //   it('should handle additional custom options correctly', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       customOption: 'value',
  //     };

  //     const moized = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       customOption: 'value',
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     expect(moized.options._mm).toEqual({
  //       customOption: 'value',
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);
  //   });

  //   it('should handle a curried options implementation correctly', () => {
  //     const fn = jest.fn();
  //     const firstOptions = {
  //       isDeepEqual: true,
  //     };
  //     const secondOptions = {
  //       transformArgs(args: any[]) {
  //         return [...args].reverse();
  //       },
  //     };

  //     const moized = moize(firstOptions)(secondOptions)(fn);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isDeepEqual: true,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //       transformArgs: secondOptions.transformArgs,
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: deepEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);

  //     const transformer = secondOptions.transformArgs;

  //     if (typeof transformer !== 'function') {
  //       throw new TypeError('should be a function');
  //     }

  //     expect(transformKey.toString()).toBe(transformer.toString());
  //     expect(transformKey(args)).toEqual(transformer(args));
  //   });

  //   it('should handle a curried options implementation correctly when the final call has options', () => {
  //     const fn = jest.fn();
  //     const firstOptions = {
  //       isDeepEqual: true,
  //     };
  //     const secondOptions = {
  //       transformArgs(args: any[]) {
  //         return [...args].reverse();
  //       },
  //     };

  //     const moized = moize(firstOptions)(fn, secondOptions);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isDeepEqual: true,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //       transformArgs: secondOptions.transformArgs,
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: deepEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);
  //     moized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);

  //     const transformer = secondOptions.transformArgs;

  //     if (typeof transformer !== 'function') {
  //       throw new TypeError('should be a function');
  //     }

  //     expect(transformKey.toString()).toBe(transformer.toString());
  //     expect(transformKey(args)).toEqual(transformer(args));
  //   });

  //   it('should handle moizing a previously-moized function correctly', () => {
  //     const fn = jest.fn();
  //     const firstOptions = {
  //       isDeepEqual: true,
  //     };

  //     const firstMoized = moize(fn, firstOptions);

  //     const secondOptions = {
  //       transformArgs(args: any[]) {
  //         return [...args].reverse();
  //       },
  //     };

  //     const secondMoized = moize(firstMoized, secondOptions);

  //     isMoizedFunction(secondMoized);

  //     expect(secondMoized.options).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isDeepEqual: true,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //       transformArgs: secondOptions.transformArgs,
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = secondMoized._microMemoizeOptions;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: deepEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });

  //     const args = ['foo', 'bar', 'baz', 'quz'];

  //     secondMoized(...args);
  //     secondMoized(...args);
  //     secondMoized(...args);
  //     secondMoized(...args);
  //     secondMoized(...args);
  //     secondMoized(...args);
  //     secondMoized(...args);

  //     expect(fn).toHaveBeenCalledTimes(1);
  //     expect(fn).toHaveBeenCalledWith(...args);

  //     const transformer = secondOptions.transformArgs;

  //     if (typeof transformer !== 'function') {
  //       throw new TypeError('should be a function');
  //     }

  //     expect(transformKey.toString()).toBe(transformer.toString());
  //     expect(transformKey(args)).toEqual(transformer(args));
  //   });

  //   it('should not call onExpire for removed cache items', async () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxAge: 500,
  //       onExpire: jest.fn(),
  //     };

  //     const moized = moize(fn, options);

  //     const args = ['foo', 'bar'];

  //     moized(...args);

  //     expect(moized.cache.keys.length).toBe(1);

  //     moized.remove(args);

  //     expect(moized.cache.keys.length).toBe(0);

  //     moized(...args);

  //     expect(moized.cache.keys.length).toBe(1);

  //     await new Promise((resolve: Function) => {
  //       setTimeout(resolve, options.maxAge * 2);
  //     });

  //     expect(options.onExpire).toHaveBeenCalledTimes(1);
  //   });

  //   it('should throw an error when no arguments passed', () => {
  //     // @ts-ignore
  //     expect(() => moize()).toThrow();
  //   });

  //   it('should throw an error when the first argument is neither function nor object', () => {
  //     // @ts-ignore
  //     expect(() => moize('foo')).toThrow();
  //   });
  // });

  // describe('moize.collectStats', () => {
  //   it('is the collectStats method in stats', () => {
  //     expect(moize.collectStats).toBe(collectStats);
  //   });
  // });

  // describe('moize.compose', () => {
  //   it('should call the internal compose and returns the composed function', () => {
  //     const functions = [jest.fn(value => value), jest.fn(value => value)];

  //     const result = moize.compose(...functions);

  //     expect(typeof result).toBe('function');

  //     const arg = {};

  //     result(arg);

  //     functions.forEach((fn: jest.Mock) => {
  //       expect(fn).toHaveBeenCalledTimes(1);
  //       expect(fn).toHaveBeenCalledWith(arg);
  //     });
  //   });

  //   it('should call the internal compose and returns moize itself when undefined', () => {
  //     const functions = [null, false];

  //     const result = moize.compose(...functions);

  //     expect(result).toBe(moize);
  //   });
  // });

  // describe('moize.deep', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       isDeepEqual: true,
  //     };

  //     const moized = moize.deep(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isDeepEqual: true,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     expect(moized.options._mm).toEqual({
  //       isEqual: deepEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //     });
  //   });
  // });

  // describe('moize.getStats', () => {
  //   it('is the getStats method in stats', () => {
  //     expect(moize.getStats).toBe(getStats);
  //   });
  // });

  // describe('moize.infinite', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxSize: Infinity,
  //     };

  //     const moized = moize.infinite(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       maxSize: options.maxSize,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     expect(moized.options._mm).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: options.maxSize,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });
  //   });
  // });

  // describe('moize.isCollectingStas', () => {
  //   it('returns isCollectingStats in the statsCache', () => {
  //     const result = moize.isCollectingStats();

  //     expect(result).toBe(getStatsCache().isCollectingStats);
  //   });
  // });

  // describe('moize.isMemoized', () => {
  //   it('should return false if the object passed is not a function', () => {
  //     const object = 'foo';

  //     expect(moize.isMemoized(object)).toBe(false);
  //   });

  //   it('should return false if the object passed is not a moized function', () => {
  //     const object = () => {};

  //     expect(moize.isMemoized(object)).toBe(false);
  //   });

  //   it('should return true if the object passed is a moized function', () => {
  //     const object = moize(() => {});

  //     expect(moize.isMemoized(object)).toBe(true);
  //   });
  // });

  // describe('moize.maxAge', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxAge: 1000,
  //     };

  //     const moized = moize.maxAge(options.maxAge)(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       maxAge: 1000,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     const { onCacheAdd, ..._microMemoizeOptions } = moized.options._mm;

  //     const fakeOnCacheOperation = createOnCacheOperation(moized);

  //     if (typeof fakeOnCacheOperation !== 'function') {
  //       throw new TypeError('should be a function');
  //     }

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });
  //   });

  //   it('should throw if maxAge is a negative number', () => {
  //     expect(() => moize(() => {}, { maxAge: -1 })).toThrow();
  //   });

  //   it('should throw if maxAge is a NaN', () => {
  //     expect(() => moize(() => {}, { maxAge: NaN })).toThrow();
  //   });

  //   it('should throw if maxAge is a decimal', () => {
  //     expect(() => moize(() => {}, { maxAge: 1.23 })).toThrow();
  //   });
  // });

  // describe('moize.maxArgs', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxArgs: 1,
  //     };

  //     const moized = moize.maxArgs(options.maxArgs)(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       maxArgs: options.maxArgs,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });

  //     expect(transformKey.toString()).toBe(
  //       createGetInitialArgs(options.maxArgs).toString(),
  //     );
  //   });

  //   it('should throw if maxArgs is a negative number', () => {
  //     expect(() => moize(() => {}, { maxArgs: -1 })).toThrow();
  //   });

  //   it('should throw if maxArgs is a NaN', () => {
  //     expect(() => moize(() => {}, { maxArgs: NaN })).toThrow();
  //   });

  //   it('should throw if maxArgs is a decimal', () => {
  //     expect(() => moize(() => {}, { maxArgs: 1.23 })).toThrow();
  //   });
  // });

  // describe('moize.maxSize', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       maxSize: 1,
  //     };

  //     const moized = moize.maxSize(options.maxSize)(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       maxSize: options.maxSize,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     expect(moized.options._mm).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: options.maxSize,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });
  //   });

  //   it('should throw if maxSize is a negative number', () => {
  //     expect(() => moize(() => {}, { maxSize: -1 })).toThrow();
  //   });

  //   it('should throw if maxSize is a NaN', () => {
  //     expect(() => moize(() => {}, { maxSize: NaN })).toThrow();
  //   });

  //   it('should throw if maxSize is a decimal', () => {
  //     expect(() => moize(() => {}, { maxSize: 1.23 })).toThrow();
  //   });
  // });

  // describe('moize.promise', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       isPromise: true,
  //     };

  //     const moized = moize.promise(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //       updateExpire: true,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isPromise: options.isPromise,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //       updateExpire: true,
  //     });

  //     expect(moized.options._mm).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isMatchingKey: undefined,
  //       isPromise: options.isPromise,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });
  //   });
  // });

  // describe('moize.react', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       isReact: true,
  //     };

  //     const moized = moize.react(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isReact: options.isReact,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: shallowEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });

  //     expect(transformKey.toString()).toBe(createGetInitialArgs(2).toString());
  //   });
  // });

  // describe('moize.reactGlobal', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       isReact: true,
  //       isReactGlobal: true
  //     };

  //     const moized = moize.react(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isReact: options.isReact,
  //       isReactGlobal: options.isReactGlobal,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: shallowEqual,
  //       isMatchingKey: undefined,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });

  //     expect(transformKey.toString()).toBe(createGetInitialArgs(2).toString());
  //   });
  // });

  // describe('moize.serialize', () => {
  //   it('should produce the correct moized function options', () => {
  //     const fn = jest.fn();
  //     const options = {
  //       isSerialized: true,
  //     };

  //     const moized = moize.serialize(fn);
  //     const moizedStandard = moize(fn, options);

  //     isMoizedFunction(moized);

  //     expect(moized.options.snapshot).toEqual({
  //       ...moizedStandard.options,
  //     });

  //     expect(moized.options.snapshot).toEqual({
  //       ...DEFAULT_OPTIONS,
  //       isSerialized: options.isSerialized,
  //       profileName: 'mockConstructor at new Promise (<anonymous>)',
  //     });

  //     const {
  //       transformKey,
  //       ..._microMemoizeOptions
  //     } = moized.options._mm;

  //     expect(_microMemoizeOptions).toEqual({
  //       isEqual: sameValueZeroEqual,
  //       isPromise: false,
  //       maxSize: Infinity,
  //       onCacheAdd: undefined,
  //       onCacheChange: undefined,
  //       onCacheHit: undefined,
  //       transformKey: undefined,
  //     });

  //     const serializer = getSerializerFunction(options);

  //     if (typeof serializer !== 'function') {
  //       throw new TypeError('should be a function');
  //     }

  //     expect(transformKey.toString()).toBe(serializer.toString());
  //   });
});
