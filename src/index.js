// @flow

// cache
import Cache from './Cache';

// constants
import {
  INFINITY,
  INVALID_FIRST_PARAMETER_ERROR,
  NO_PROMISE_LIBRARY_EXISTS_ERROR_MESSAGE
} from './constants';

// types
import type {
  Options
} from './types';

// utils
import {
  compose,
  createAddPropertiesToFunction,
  createGetCacheKey,
  createSetNewCachedValue,
  isFunction,
  isPlainObject
} from './utils';

/**
 * @module moize
 */

/**
 * @function moize
 *
 * @description
 * store cached values returned from calling method with arguments to avoid reprocessing data from same arguments
 *
 * @example
 * import moize from 'moize';
 *
 * // standard implementation
 * const fn = (foo, bar) => {
 *  return `${foo} ${bar}`;
 * };
 * const memoizedFn = moize(fn);
 *
 * // implementation with options
 * const fn = async (id) => {
 *  return get(`http://foo.com/${id}`);
 * };
 * const memoizedFn = moize(fn, {
 *  isPromise: true,
 *  maxSize: 5
 * });
 *
 * @param {function} functionOrComposableOptions method to memoize
 * @param {Options} [passedOptions={}] options to customize how the caching is handled
 * @param {Cache} [passedOptions.cache=new Cache()] caching mechanism to use for method
 * @param {boolean} [passedOptions.isPromise=false] is the function return expected to be a promise to resolve
 * @param {number} [passedOptions.maxAge=Infinity] the maximum age the value should persist in cache
 * @param {number} [passedOptions.maxArgs=Infinity] the maximum number of arguments to be used in serializing the keys
 * @param {number} [passedOptions.maxSize=Infinity] the maximum size of the cache to retain
 * @param {function} [passedOptions.promiseLibrary=Promise] promise library to use for resolution / rejection
 * @param {function} [passedOptions.serializeFunctions=false] should function parameters be serialized as well
 * @param {function} [passedOptions.serializer] method to serialize arguments with for cache storage
 * @returns {Function} higher-order function which either returns from cache or newly-computed value
 */
const moize = function(functionOrComposableOptions: (Function|Object), passedOptions: Options = {}): any {
  if (isPlainObject(functionOrComposableOptions)) {
    return function(fn: Function, otherOptions: Options = {}): Function {
      return moize(fn, {
        // $FlowIgnore functionOrComposableOptions is object of options
        ...functionOrComposableOptions,
        ...otherOptions
      });
    };
  }

  if (!isFunction(functionOrComposableOptions)) {
    throw new TypeError(INVALID_FIRST_PARAMETER_ERROR);
  }

  const isComposed: boolean = functionOrComposableOptions.isMemoized;
  // $FlowIgnore the value of the property is a function
  const fn: Function = isComposed ? functionOrComposableOptions.originalFunction : functionOrComposableOptions;
  const options: Object = !isComposed ? passedOptions : {
    ...functionOrComposableOptions.options,
    ...passedOptions
  };

  const {
    cache = new Cache(),
    isPromise = false,
    maxAge = INFINITY,
    maxArgs = INFINITY,
    maxSize = INFINITY,
    promiseLibrary = Promise,
    serialize = false,
    serializeFunctions = false,
    serializer
  } = options;

  if (isPromise && !promiseLibrary) {
    throw new ReferenceError(NO_PROMISE_LIBRARY_EXISTS_ERROR_MESSAGE);
  }

  const addPropertiesToFunction: Function = createAddPropertiesToFunction(cache, fn, options);
  const getCacheKey: Function = createGetCacheKey(cache, serialize, serializer, serializeFunctions, maxArgs);
  const setNewCachedValue: Function = createSetNewCachedValue(cache, isPromise, maxAge, maxSize, promiseLibrary);

  let key: any;

  /**
   * @private
   *
   * @function memoizedFunction
   *
   * @description
   * higher-order function which either returns from cache or stores newly-computed value and returns it
   *
   * @param {Array<*>} args arguments passed to method
   * @returns {any} value resulting from executing of fn passed to memoize
   */
  const memoizedFunction = function(...args: Array<any>): any {
    key = getCacheKey(args);

    return cache.has(key) ? cache.get(key) : setNewCachedValue(key, fn.apply(this, args));
  };

  return addPropertiesToFunction(memoizedFunction);
};

/**
 * @function maxSize
 *
 * @description
 * react-specific memoization, with auto serialization including functions
 *
 * @example
 * import moize from 'moize';
 *
 * const foo = (bar) => {
 *   return bar * 2;
 * };
 *
 * export default moize.maxAge(5000)(Foo);
 *
 * @param {number} maxAge the max time in milliseconds for the cache to exist
 * @returns {function(function, Object): function} a higher-order function to return the moize fn with maxAge applied
 */
const maxAge = function(maxAge: number): Function {
  return moize({
    maxAge
  });
};

/**
 * @function maxSize
 *
 * @description
 * react-specific memoization, with auto serialization including functions
 *
 * @example
 * import moize from 'moize';
 *
 * const foo = (bar) => {
 *   return bar * 2;
 * };
 *
 * export default moize.maxSize(5)(Foo);
 *
 * @param {number} maxSize the max size of the cache
 * @returns {function(function, Object): function} a higher-order function to return the moize fn with maxSize applied
 */
const maxSize = function(maxSize: number): Function {
  return moize({
    maxSize
  });
};

moize.compose = compose;
moize.maxAge = maxAge;
moize.maxSize = maxSize;
moize.promise = moize({
  isPromise: true
});
moize.react = moize({
  maxArgs: 2,
  serialize: true,
  serializeFunctions: true
});
moize.serialize = moize({
  serialize: true
});
moize.simple = moize.maxSize(1);

export default moize;
