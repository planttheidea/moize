import { shallowEqual } from 'fast-equals';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { STATIC_METHODS, STATIC_VALUES, createMoized } from '../src/moized';

import { DEFAULT_OPTIONS } from '../src/options';
import moize from '../src';
import * as maxAge from '../src/maxAge';
import { Dictionary } from '../src/types';


describe('createMoized', () => {
  describe('MoizedComponent (per instance)', () => {
    const options = {
      ...DEFAULT_OPTIONS.react,
      _mm: {
        isEqual: shallowEqual,
        maxArgs: 2,
        maxSize: DEFAULT_OPTIONS.react.maxSize,
      },
    };

    it('should create a Moized component that is cached per-instance', () => {
      let fooCount = 0;
      let barCount = 0;

      function Foo(props: Dictionary<any>) {
        fooCount++;

        return <div {...props} />;
      }

      function Bar(props: Dictionary<any>) {
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
      function Foo(props: Dictionary<any>) {
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

    it('should allow access to static methods and values on the moized instance ref', (done) => {
      function Foo(props: Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      class App extends React.Component {
        getRef(ref: { Moized: typeof Moized }) {
          const { Moized: MemoizedComponent } = ref;

          STATIC_METHODS.forEach((method) => {
            expect(() => MemoizedComponent[method](['foo', 'bar'])).not.toThrow();
          });

          STATIC_VALUES.forEach((value) => {
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
      function Foo(props: Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_METHODS.forEach((method) => {
        expect(() => Moized[method]()).toThrow();
      });
    });

    it('should throw errors if attempting to access normal moized values on the component class', () => {
      function Foo(props: Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_VALUES.forEach((value) => {
        expect(() => Moized[value]).toThrow();
      });
    });
  });

  describe('MoizedComponent (global)', () => {
    const options = {
      ...DEFAULT_OPTIONS.reactGlobal,
      _mm: {
        isEqual: shallowEqual,
        maxArgs: 2,
        maxSize: DEFAULT_OPTIONS.reactGlobal.maxSize,
      },
    };

    it('should create a Moized component that is cached globally', () => {
      let fooCount = 0;
      let barCount = 0;

      function Foo(props: Dictionary<any>) {
        fooCount++;

        return <div {...props} />;
      }

      function Bar(props: Dictionary<any>) {
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
      function Foo(props: Dictionary<any>) {
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
      function Foo(props: Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_METHODS.forEach((method) => {
        expect(() => Moized[method]()).not.toThrow();
      });
    });

    it('should throw errors if attempting to access normal moized values on the component class', () => {
      function Foo(props: Dictionary<any>) {
        return <div {...props} />;
      }

      const Moized = createMoized(moize, Foo, options);

      STATIC_VALUES.forEach((value) => {
        expect(() => Moized[value]).not.toThrow();
      });
    });
  });

  describe('moized function (standard)', () => {
    const options = {
      ...DEFAULT_OPTIONS.__global__,
      maxArgs: 1,
      _mm: {
        maxArgs: 1,
        maxSize: DEFAULT_OPTIONS.__global__.maxSize,
      },
    };

    it('should set the options to be the options passed', () => {
      const fn = (foo: string, bar: string) => [foo, bar];

      const moized = createMoized(moize, fn, options);

      expect(moized.options).not.toBe(options._mm);
      expect(moized.options).toBe(options);
    });

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

    it('should have a delete function that removes the item from cache', () => {
      const fn = (foo: string, bar: string) => [foo, bar];
      const clearExpirationSpy = jest.spyOn(maxAge, 'clearExpiration');

      const customOptions = {
        ...options,
        maxSize: 2,
        _mm: {
          ...options._mm,
          maxSize: 2
        }
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
      expect(clearExpirationSpy).toHaveBeenCalledWith(moized.cache, existingKey, true);

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
          transformKey: transformArgs
        }
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

    it('should have a get function that returns the value in cache', () => {
      const fn = (foo: string, bar: string) => [bar, foo];

      const moized = createMoized(moize, fn, options);

      moized('foo', 'bar');

      const result = moized.get(['foo', 'bar']);

      expect(result).toEqual(['bar', 'foo']);
    });

    it('should have a get function that returns undefined if it cannot find the value in cache', () => {
      const fn = (foo: string, bar: string) => [bar, foo];

      const moized = createMoized(moize, fn, options);

      moized('foo', 'bar');

      const result = moized.get(['bar', 'baz']);

      expect(result).toBeUndefined();
    });
  });
});
