// @flow

// cache
import Cache from './Cache';

// constants
import {INVALID_FIRST_PARAMETER_ERROR, PROMISE_OPTIONS, REACT_OPTIONS, SERIALIZE_OPTIONS} from './constants';

// types
import type {Options} from './types';

// utils
import {
  compose,
  createAddPropertiesToFunction,
  createCurriableOptionMethod,
  createGetCacheKey,
  createSetNewCachedValue,
  getDefaultedOptions,
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
 * @param {boolean} [passedOptions.isPromise=false] is the function return expected to be a promise to resolve
 * @param {number} [passedOptions.maxAge=Infinity] the maximum age the value should persist in cache
 * @param {number} [passedOptions.maxArgs=Infinity] the maximum number of arguments to be used in serializing the keys
 * @param {number} [passedOptions.maxSize=Infinity] the maximum size of the cache to retain
 * @param {function} [passedOptions.promiseLibrary=Promise] promise library to use for resolution / rejection
 * @param {function} [passedOptions.serializeFunctions=false] should function parameters be serialized as well
 * @param {function} [passedOptions.serializer] method to serialize arguments with for cache storage
 * @returns {Function} higher-order function which either returns from cache or newly-computed value
 */
const moize: Function = (functionOrComposableOptions: Function | Object, passedOptions: Object = {}): Function => {
  if (isPlainObject(functionOrComposableOptions)) {
    return function(fnOrOptions: Function | Object, otherOptions: Object = {}): Function {
      if (isPlainObject(fnOrOptions)) {
        return moize({
          // $FlowIgnore functionOrComposableOptions is object of options
          ...functionOrComposableOptions,
          // $FlowIgnore fnOrOptions is object of options
          ...fnOrOptions
        });
      }

      return moize(fnOrOptions, {
        // $FlowIgnore functionOrComposableOptions is object of options
        ...functionOrComposableOptions,
        ...otherOptions
      });
    };
  }

  if (!isFunction(functionOrComposableOptions)) {
    throw new TypeError(INVALID_FIRST_PARAMETER_ERROR);
  }

  const isComposed: boolean = functionOrComposableOptions.isMoized;
  // $FlowIgnore if the function is already moized, it has an originalFunction property on it
  const fn: Function = isComposed ? functionOrComposableOptions.originalFunction : functionOrComposableOptions;

  const options: Options = getDefaultedOptions(
    !isComposed
      ? passedOptions
      : {
        ...functionOrComposableOptions.options,
        ...passedOptions
      }
  );

  const cache: Cache = new Cache();

  const addPropertiesToFunction: Function = createAddPropertiesToFunction(cache, fn, options);
  const getCacheKey: Function = createGetCacheKey(cache, options);
  const setNewCachedValue: Function = createSetNewCachedValue(cache, options);

  return addPropertiesToFunction(function(...args: Array<any>): any {
    const key: any = getCacheKey(args);

    return cache.size && cache.has(key) ? cache.get(key) : setNewCachedValue(key, fn.apply(this, args));
  });
};

/**
 * @function isMoized
 *
 * @description
 * is the fn passed a moized function
 *
 * @param {*} fn the object to test
 * @returns {boolean} is fn a moized function
 */
moize.isMoized = (fn: any): boolean => {
  return isFunction(fn) && !!fn.isMoized;
};

/**
 * @function compose
 *
 * @description
 * method to compose moized methods and return a single moized function
 *
 * @param {...Array<(function)>} functions the functions to compose
 * @returns {function(...Array<*>): *} the composed function
 */
moize.compose = compose;

/**
 * @function maxAge
 *
 * @description
 * a moized method where the age of the cache is limited to the number of milliseconds passed
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.maxAge = createCurriableOptionMethod(moize, 'maxAge');

/**
 * @function maxArgs
 *
 * @description
 * a moized method where the number of arguments used for determining cache is limited to the value passed
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.maxArgs = createCurriableOptionMethod(moize, 'maxArgs');

/**
 * @function maxSize
 *
 * @description
 * a moized method where the total size of the cache is limited to the value passed
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.maxSize = createCurriableOptionMethod(moize, 'maxSize');

/**
 * @function promise
 *
 * @description
 * a moized method specific to caching resolved promise / async values
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.promise = moize(PROMISE_OPTIONS);

/**
 * @function react
 *
 * @description
 * a moized method specific to caching React components
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.react = moize(REACT_OPTIONS);

/**
 * @function reactSimple
 *
 * @description
 * a moized method specific to caching React components, only keeping the most recently-cached version
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.reactSimple = compose(moize.react, moize.maxSize(1));

/**
 * @function serialize
 *
 * @description
 * a moized method where the arguments passed are cached based on their serialized values
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.serialize = moize(SERIALIZE_OPTIONS);

/**
 * @function simple
 *
 * @description
 * a moized method where only the most recent key => value combination is cached
 *
 * @param {...Array<*>} functions the functions to compose
 * @returns {*} the moized function
 */
moize.simple = moize.maxSize(1);

export default moize;
