/* eslint-disable */

import { shallowEqual } from 'fast-equals';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { STATIC_METHODS, STATIC_VALUES, createMoized } from '../src/moized';

import { DEFAULT_OPTIONS } from '../src/options';
import moize from '../src';
import * as maxAge from '../src/maxAge';
import { getStatsCache, getUsagePercentage, getStats } from '../src/stats';
import * as Types from '../src/types';

describe('createMoized', () => {
  describe('MoizedComponent (per instance)', () => {
    const options = {
      ...DEFAULT_OPTIONS,
      _mm: {
        isEqual: shallowEqual,
        maxArgs: 2,
        maxSize: DEFAULT_OPTIONS.maxSize,
      },
      isReact: true,
    };

    it('should create a Moized component that is cached per-instance', () => {
      let fooCount = 0;
      let barCount = 0;

      function Foo(props: Types.Dictionary<any>) {
        fooCount++;

        return <div {...props} />;
      }

      function Bar(props: Types.Dictionary<any>) {
        barCount++;

        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      const div = document.createElement('div');

      const length = 10;

      for (let index = 0; index < length; index++) {
        ReactDOM.render(
          <div>
            <Moized foo="bar" />
            <Moized foo="bar" />
            <Bar baz="quz" />
          </div>,
          div,
        );
      }

      expect(fooCount).toEqual(2);
      expect(barCount).toEqual(length);
    });

    it('should create a moized function with the extra values', () => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      Foo.displayName = 'Foo';

      Foo.propTypes = {
        bar: PropTypes.string,
      };

      Foo.defaultProps = {
        bar: 'baz',
      };

      Foo.staticFn = () => {};

      const Moized = createMoized(moize, Foo, options);

      expect(Moized.options).toBe(options);
      expect(Moized.fn).toBe(Foo);

      expect(Moized.displayName).toEqual(`Moized(${Foo.displayName})`);
      expect(Moized.propTypes).toBe(Foo.propTypes);
      expect(Moized.defaultProps).toBe(Foo.defaultProps);
      expect(Moized.staticFn).toBe(Foo.staticFn);
    });

    it('should allow access to static methods and values on the moized instance ref', done => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      class App extends React.Component {
        getRef(ref: { Moized: typeof Moized }) {
          const { Moized: MemoizedComponent } = ref;

          STATIC_METHODS.forEach(method => {
            expect(() =>
              MemoizedComponent[method](['foo', 'bar']),
            ).not.toThrow();
          });

          STATIC_VALUES.forEach(value => {
            expect(() => MemoizedComponent[value]).not.toThrow();
          });

          done();
        }

        render() {
          return <Moized ref={this.getRef} {...this.props} />;
        }
      }

      const div = document.createElement('div');

      ReactDOM.render(<App />, div);
    });

    it('should throw errors if attempting to access normal moized methods on the component class', () => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_METHODS.forEach(method => {
        expect(() => Moized[method]()).toThrow();
      });
    });

    it('should throw errors if attempting to access normal moized values on the component class', () => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_VALUES.forEach(value => {
        expect(() => Moized[value]).toThrow();
      });
    });
  });

  describe('MoizedComponent (global)', () => {
    const options = {
      ...DEFAULT_OPTIONS,
      _mm: {
        isEqual: shallowEqual,
        maxArgs: 2,
        maxSize: DEFAULT_OPTIONS.maxSize,
      },
      isReact: true,
      isReactGlobal: true,
    };

    it('should create a Moized component that is cached globally', () => {
      let fooCount = 0;
      let barCount = 0;

      function Foo(props: Types.Dictionary<any>) {
        fooCount++;

        return <div {...props} />;
      }

      function Bar(props: Types.Dictionary<any>) {
        barCount++;

        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      const div = document.createElement('div');

      const length = 10;

      for (let index = 0; index < length; index++) {
        ReactDOM.render(
          <div>
            <Moized foo="bar" />
            <Moized foo="bar" />
            <Bar baz="quz" />
          </div>,
          div,
        );
      }

      expect(fooCount).toEqual(1);
      expect(barCount).toEqual(length);
    });

    it('should create a moized function with the extra values', () => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      Foo.displayName = 'Foo';

      Foo.propTypes = {
        bar: PropTypes.string,
      };

      Foo.defaultProps = {
        bar: 'baz',
      };

      Foo.staticFn = () => {};

      const Moized = createMoized(moize, Foo, options);

      expect(Moized.options).toBe(options);
      expect(Moized.fn).toBe(Foo);

      expect(Moized.displayName).toEqual(`Moized(${Foo.displayName})`);
      expect(Moized.propTypes).toBe(Foo.propTypes);
      expect(Moized.defaultProps).toBe(Foo.defaultProps);
      expect(Moized.staticFn).toBe(Foo.staticFn);
    });

    it('should not throw errors if attempting to access normal moized methods on the component class', () => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_METHODS.forEach(method => {
        expect(() => Moized[method]()).not.toThrow();
      });
    });

    it('should throw errors if attempting to access normal moized values on the component class', () => {
      function Foo(props: Types.Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_VALUES.forEach(value => {
        expect(() => Moized[value]).not.toThrow();
      });
    });
  });

  const options = {
    ...DEFAULT_OPTIONS,
    maxArgs: 1,
    _mm: {
      maxArgs: 1,
      maxSize: DEFAULT_OPTIONS.maxSize,
    },
  };

  describe('moized function (standard)', () => {
    it('should set the options to be the options passed', () => {
      const fn = (foo: string, bar: string) => [foo, bar];

      const moized = createMoized(moize, fn, options);

      expect(moized.options).not.toBe(options._mm);
      expect(moized.options).toBe(options);
    });
  });

  describe('moized.clear', () => {
    it('should have a clear function that clears the cache', () => {
      const fn = (foo: string, bar: string) => [foo, bar];

      const moized = createMoized(moize, fn, options);

      moized('foo', 'bar');

      expect(moized.cache.size).toBe(1);

      const result = moized.clear();

      expect(result).toBe(true);

      expect(moized.cache.size).toBe(0);
    });

    it('should have a clear function that clears the cache and notifies of cache change', () => {
      const fn = (foo: string, bar: string) => [foo, bar];

      const customOptions = {
        ...options,
        _mm: {
          ...options._mm,
          onCacheChange: jest.fn(),
        },
      };
      const moized = createMoized(moize, fn, customOptions);

      moized('foo', 'bar');

      expect(moized.cache.size).toBe(1);

      customOptions._mm.onCacheChange.mockReset();

      moized.clear();

      expect(moized.cache.size).toBe(0);
      expect(customOptions._mm.onCacheChange).toHaveBeenCalledTimes(1);
      expect(customOptions._mm.onCacheChange).toHaveBeenCalledWith(
        moized.cache,
        customOptions,
        moized,
      );
    });
  });

  describe('moized.delete', () => {
    it('should have a delete function that removes the item from cache', () => {
      const fn = (foo: string, bar: string) => [foo, bar];
      const clearExpirationSpy = jest.spyOn(maxAge, 'clearExpiration');

      const customOptions = {
        ...options,
        maxSize: 2,
        _mm: {
          ...options._mm,
          maxSize: 2,
        },
      };
      const moized = createMoized(moize, fn, customOptions);

      moized('foo', 'bar');
      moized('bar', 'baz');

      expect(moized.cache.size).toBe(2);

      const existingKey = moized.cache.keys[1];

      const result = moized.delete(['foo', 'bar']);

      expect(result).toBe(true);

      expect(moized.cache.size).toBe(1);

      expect(clearExpirationSpy).toHaveBeenCalledTimes(1);
      expect(clearExpirationSpy).toHaveBeenCalledWith(
        moized.cache,
        existingKey,
        true,
      );

      clearExpirationSpy.mockRestore();
    });

    it('should have a delete function that removes the item from cache with transformation and notifies of the change', () => {
      const fn = (foo: string, bar: string) => [foo, bar];

      const transformArgs = (args: string[]) => args.reverse();
      const customOptions = {
        ...options,
        maxSize: 2,
        transformArgs,
        _mm: {
          ...options._mm,
          maxSize: 2,
          onCacheChange: jest.fn(),
          transformKey: transformArgs,
        },
      };
      const moized = createMoized(moize, fn, customOptions);

      moized('foo', 'bar');
      moized('bar', 'baz');

      expect(moized.cache.size).toBe(2);

      customOptions._mm.onCacheChange.mockReset();

      moized.delete(['foo', 'bar']);

      expect(moized.cache.size).toBe(1);
      expect(customOptions._mm.onCacheChange).toHaveBeenCalledTimes(1);
      expect(customOptions._mm.onCacheChange).toHaveBeenCalledWith(
        moized.cache,
        customOptions,
        moized,
      );
    });

    it('should have a delete function that returns false if nothing was deleted', () => {
      const fn = (foo: string, bar: string) => [foo, bar];

      const moized = createMoized(moize, fn, options);

      expect(moized.cache.size).toBe(0);

      const result = moized.delete(['foo', 'bar']);

      expect(result).toBe(false);

      expect(moized.cache.size).toBe(0);
    });
  });

  describe('moized.get', () => {
    it('should have a get function that returns the value in cache', () => {
      const fn = (foo: string, bar: string) => [bar, foo];

      const moized = createMoized(moize, fn, options);

      moized('foo', 'bar');

      const result = moized.get(['foo', 'bar']);

      expect(result).toEqual(['bar', 'foo']);
    });

    it('should have a get function that returns the value in cache based on the transformed key', () => {
      const fn = (foo: string, bar: string) => ({ [foo]: bar });

      const transformKey = (args: string[]) => args.reverse();

      const moized = createMoized(moize, fn, {
        ...options,
        _mm: {
          ...options._mm,
          transformKey,
        },
        transformArgs: transformKey,
      });

      moized('foo', 'bar');

      const result = moized.get(['foo', 'bar']);

      expect(result).toEqual({ foo: 'bar' });
    });

    it('should have a get function that returns undefined if it cannot find the value in cache', () => {
      const fn = (foo: string, bar: string) => [bar, foo];

      const moized = createMoized(moize, fn, options);

      moized('foo', 'bar');

      const result = moized.get(['bar', 'baz']);

      expect(result).toBeUndefined();
    });
  });

  describe('moized.getStats()', () => {
    const statsCache = getStatsCache();
    const _isCollectingStats = statsCache.isCollectingStats;

    beforeEach(() => {
      statsCache.isCollectingStats = true;
    });

    afterEach(() => {
      statsCache.isCollectingStats = _isCollectingStats;
    });

    it('should call getStats with the profileName in options', () => {
      const fn = () => {};

      const _options = {
        ...options,
        profileName: 'profileName',
      };

      const moized = createMoized(moize, fn, _options);

      const result = moized.getStats();

      const profile = statsCache.profiles[_options.profileName];

      // @ts-ignore
      expect(result).toEqual({
        ...profile,
        usage: getUsagePercentage(profile.calls, profile.hits),
      });
    });
  });

  describe('moized.has()', () => {
    it('should return true if the key exists', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const moized = createMoized(moize, fn, options);

      moized.cache.keys = [key];
      moized.cache.values = [value];

      expect(moized.has(key)).toBe(true);
    });

    it('should return false if the key does not exist', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const moized = createMoized(moize, fn, options);

      expect(moized.has(key)).toBe(false);
    });

    it('should return true if the transformed key exists in cache', () => {
      const key = ['key'];
      const value = 'value';

      const transformKey = (args: any[]) => args;

      const fn = () => value;
      const _options = {
        ...options,
        _mm: {
          ...options._mm,
          transformKey,
        },
        transformArgs: transformKey,
      };
      const moized = createMoized(moize, fn, _options);

      moized.cache.keys = [key];
      moized.cache.values = [value];

      expect(moized.has(key)).toBe(true);
    });
  });

  describe('moized.keys()', () => {
    it('should return a shallow clone of the keys', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const moized = createMoized(moize, fn, options);

      moized.cache.keys = [key];
      moized.cache.values = [value];

      const keys = moized.keys();

      expect(keys).toEqual(moized.cache.keys);
      expect(keys).not.toBe(moized.cache.keys);
    });
  });

  describe('moized.set()', () => {
    it('should update the value in cache for the existing key', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const _options = {
        ...options,
        _mm: {
          ...options._mm,
          maxSize: 10,
        },
        maxSize: 10,
      };
      const moized = createMoized(moize, fn, _options);

      moized.cache.keys.push(['foo'], [{ bar: 'baz' }], key);
      moized.cache.values.push('bar', ['quz'], value);

      const keys = moized.keys();
      const values = moized.values();

      const newValue = 'new value';

      moized.set(key, newValue);

      expect(moized.cache.keys).toEqual([
        key,
        ...keys.slice(0, keys.length - 1),
      ]);
      expect(moized.cache.values).toEqual([
        newValue,
        ...values.slice(0, values.length - 1),
      ]);
    });

    it('should update the value in cache for the existing key and notify of cache update', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const _options = {
        ...options,
        _mm: {
          ...options._mm,
          maxSize: 10,
          onCacheChange: jest.fn(),
        },
        maxSize: 10,
      };
      const moized = createMoized(moize, fn, _options);

      moized.cache.keys.push(['foo'], [{ bar: 'baz' }], key);
      moized.cache.values.push('bar', ['quz'], value);

      const keys = moized.keys();
      const values = moized.values();

      const newValue = 'new value';

      moized.set(key, newValue);

      expect(moized.cache.keys).toEqual([
        key,
        ...keys.slice(0, keys.length - 1),
      ]);
      expect(moized.cache.values).toEqual([
        newValue,
        ...values.slice(0, values.length - 1),
      ]);

      expect(moized.options._mm.onCacheChange).toHaveBeenCalledTimes(1);
      expect(moized.options._mm.onCacheChange).toHaveBeenCalledWith(
        moized.cache,
        _options,
        moized,
      );
    });

    it('should add the value in cache for the new key', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const _options = {
        ...options,
        _mm: {
          ...options._mm,
          maxSize: 10,
        },
        maxSize: 10,
      };
      const moized = createMoized(moize, fn, _options);

      moized.cache.keys.push(['foo'], [{ bar: 'baz' }]);
      moized.cache.values.push('bar', ['quz']);

      const keys = moized.keys();
      const values = moized.values();

      const newValue = 'new value';

      moized.set(key, newValue);

      expect(moized.cache.keys).toEqual([key, ...keys]);
      expect(moized.cache.values).toEqual([newValue, ...values]);
    });

    it('should add the value in cache for the new key and notify of cache add / update', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const _options = {
        ...options,
        _mm: {
          ...options._mm,
          maxSize: 10,
          onCacheAdd: jest.fn(),
          onCacheChange: jest.fn(),
        },
        maxSize: 10,
      };
      const moized = createMoized(moize, fn, _options);

      moized.cache.keys.push(['foo'], [{ bar: 'baz' }]);
      moized.cache.values.push('bar', ['quz']);

      const keys = moized.keys();
      const values = moized.values();

      const newValue = 'new value';

      moized.set(key, newValue);

      expect(moized.cache.keys).toEqual([key, ...keys]);
      expect(moized.cache.values).toEqual([newValue, ...values]);

      expect(moized.options._mm.onCacheAdd).toHaveBeenCalledTimes(1);
      expect(moized.options._mm.onCacheAdd).toHaveBeenCalledWith(
        moized.cache,
        _options,
        moized,
      );

      expect(moized.options._mm.onCacheChange).toHaveBeenCalledTimes(1);
      expect(moized.options._mm.onCacheChange).toHaveBeenCalledWith(
        moized.cache,
        _options,
        moized,
      );
    });
  });

  describe('moized.values()', () => {
    it('should return a shallow clone of the values', () => {
      const key = ['key'];
      const value = 'value';

      const fn = () => value;
      const moized = createMoized(moize, fn, options);

      moized.cache.keys = [key];
      moized.cache.values = [value];

      const values = moized.values();

      expect(values).toEqual(moized.cache.values);
      expect(values).not.toBe(moized.cache.values);
    });
  });

  describe('moized.cache enhancement', () => {
    it('should enhance the existing cache with the new values', () => {
      const fn = (value: any) => value;
      const moized = createMoized(moize, fn, options);

      expect(moized.cache.expirations).toEqual([]);
      expect(moized.cache.expirations.snapshot).toEqual([]);

      expect(moized.cache.stats).toBe(getStatsCache());
    });
  });
});
