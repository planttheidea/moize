// @flow

// external dependencies
import Map from './Map';

// utils
import {
  createAddPropertiesToFunction,
  createGetCacheKey,
  createSetNewCachedValue,
  createSetUsageOrder,
  isFiniteAndPositive,
  isFunction
} from './utils';

type Options = {
  cache?: Object,
  isPromise?: boolean,
  maxAge?: number,
  maxArgs?: number,
  maxSize?: number,
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
 * @param {Map} [options.cache=new Map()] caching mechanism to use for method
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

  const {
    cache = new Map(),
    isPromise = false,
    maxAge = INFINITY,
    maxArgs = INFINITY,
    maxSize = INFINITY,
    serializeFunctions = false,
    serializer
  } = options;
  const hasMaxAge: boolean = isFiniteAndPositive(maxAge);
  const hasMaxArgs: boolean = isFiniteAndPositive(maxArgs);
  const hasMaxSize: boolean = isFiniteAndPositive(maxSize);

  const addPropertiesToFunction: Function = createAddPropertiesToFunction(cache, fn);
  const getCacheKey: Function = createGetCacheKey(serializer, serializeFunctions, hasMaxArgs, maxArgs);
  const setNewCachedValue: Function = createSetNewCachedValue(isPromise, hasMaxAge, maxAge);
  const setUsageOrder: Function = createSetUsageOrder(maxSize);

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

    if (hasMaxSize) {
      setUsageOrder(memoizedFunction, key);
    }

    return cache.has(key) ? cache.get(key) : setNewCachedValue(memoizedFunction, key, fn.apply(this, args));
  };

  return addPropertiesToFunction(memoizedFunction);
};

export default moize;
