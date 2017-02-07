// @flow

// external dependencies
import Cache from './Cache';

// utils
import {
  createAddPropertiesToFunction,
  createGetCacheKey,
  createSetNewCachedValue,
  isFunction
} from './utils';

type Options = {
  cache?: Object,
  isPromise?: boolean,
  maxAge?: number,
  maxArgs?: number,
  maxSize?: number,
  serialize?: boolean,
  serializeFunctions?: boolean,
  serializer?: Function
};

/**
 * @module moize
 */

const INFINITY = Number.POSITIVE_INFINITY;
const NOT_A_FUNCTION_ERROR = 'You must pass a function as the first parameter to moize.';

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
 * @param {function} fn method to memoize
 * @param {Options} [options={}] options to customize how the caching is handled
 * @param {Cache} [options.cache=new Cache()] caching mechanism to use for method
 * @param {boolean} [options.isPromise=false] is the function return expected to be a promise to resolve
 * @param {number} [options.maxAge=Infinity] the maximum age the value should persist in cache
 * @param {number} [options.maxArgs=Infinity] the maximum number of arguments to be used in serializing the keys
 * @param {number} [options.maxSize=Infinity] the maximum size of the cache to retain
 * @param {function} [options.serializer] method to serialize arguments with for cache storage
 * @returns {Function} higher-order function which either returns from cache or newly-computed value
 */
const moize = function(fn: Function, options: Options = {}): any {
  if (!isFunction(fn)) {
    throw new TypeError(NOT_A_FUNCTION_ERROR);
  }

  if (fn.isMemoized) {
    return fn;
  }

  const {
    cache = new Cache(),
    isPromise = false,
    maxAge = INFINITY,
    maxArgs = INFINITY,
    maxSize = INFINITY,
    serialize = false,
    serializeFunctions = false,
    serializer
  } = options;
  const addPropertiesToFunction: Function = createAddPropertiesToFunction(cache, fn);
  const getCacheKey: Function = createGetCacheKey(cache, serialize, serializer, serializeFunctions, maxArgs);
  const setNewCachedValue: Function = createSetNewCachedValue(cache, isPromise, maxAge, maxSize);

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
 * @function moize.react
 *
 * @description
 * react-specific memoization, with auto serialization including functions
 *
 *
 * @param {function} fn React functional component to memoize
 * @param {Options} [options={}] options to customize how the caching is handled
 * @returns {Function} higher-order function which either returns from cache or newly-computed ReactElement
 */
moize.react = function(fn: Function, options: Options = {}): any {
  return moize(fn, {
    ...options,
    maxArgs: 2,
    serialize: true,
    serializeFunctions: true
  });
};

export default moize;
