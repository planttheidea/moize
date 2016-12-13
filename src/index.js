// @flow

// external dependencies
import Map from './Map';

// utils
import {
  INFINITY,
  getCacheKey,
  getFunctionWithCacheAdded,
  serializeArguments,
  setNewCachedValue,
  setUsageOrder
} from './utils';

type Options = {
  cache?: Object,
  isPromise?: boolean,
  maxAge?: number,
  maxSize?: number,
  serializer?: Function
};

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
 * @param {function} fn method to memoize
 * @param {Options} [options={}] options to customize how the caching is handled
 * @param {Map} [options.cache=new Map()] caching mechanism to use for method
 * @param {boolean} [options.isPromise=false] is the function return expected to be a promise to resolve
 * @param {number} [options.maxAge=Infinity] the maximum age the value should persist in cache
 * @param {number} [options.maxSize=Infinity] the maximum size of the cache to retain
 * @param {function} [options.serializer=serializeArguments] method to serialize arguments with for cache storage
 * @returns {Function} higher-order function which either returns from cache or newly-computed value
 */
const moize = function(fn: Function, options: Options = {}): any {
  const {
    cache = new Map(),
    isPromise = false,
    maxAge = INFINITY,
    maxSize = INFINITY,
    serializer = serializeArguments
  } = options;
  const isMaxAgeFinite: boolean = maxAge !== INFINITY;
  const isMaxSizeFinite: boolean = maxSize !== INFINITY;

  let key: string = '';

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
    key = getCacheKey(args, serializer);

    if (isMaxSizeFinite) {
      setUsageOrder(memoizedFunction, key, maxSize);
    }

    if (memoizedFunction.cache.has(key)) {
      return memoizedFunction.cache.get(key);
    }

    return setNewCachedValue(memoizedFunction, key, fn.apply(this, args), isPromise, isMaxAgeFinite, maxAge);
  };

  return getFunctionWithCacheAdded(memoizedFunction, cache);
};

export default moize;
