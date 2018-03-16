// @flow

// external dependencies
import memoize from 'micro-memoize';

// constants
import {DEFAULT_OPTIONS} from './constants';

// instance
import {augmentMoizeInstance} from './instance';

// max age
import {getMaxAgeOptions} from './maxAge';

// options
import {createOnCacheOperation, getIsEqual, getIsMatchingKey, getTransformKey} from './options';

// stats
import {collectStats, getDefaultProfileName, getStats, getStatsOptions, statsCache} from './stats';

// types
import type {Expiration, MicroMemoizeOptions, Options} from './types';

// utils
import {combine, compose, mergeOptions} from './utils';

/**
 * @module moize
 */

export {collectStats};

/**
 * @function moize
 *
 * @description
 * memoize a function based its arguments passed, potentially improving runtime performance
 *
 * @example
 * import moize from 'moize';
 *
 * // standard implementation
 * const fn = (foo, bar) => `${foo} ${bar}`;
 * const memoizedFn = moize(fn);
 *
 * // implementation with options
 * const fn = async (id) => get(`http://foo.com/${id}`);
 * const memoizedFn = moize(fn, {isPromise: true, maxSize: 5});
 *
 * // implementation with convenience methods
 * const Foo = ({foo}) => <div>{foo}</div>;
 * const MemoizedFoo = moize.react(Foo);
 *
 * @param {function|Options} fn the function to memoized, or a list of options when currying
 * @param {Options} [options=DEFAULT_OPTIONS] the options to apply
 * @returns {function} the memoized function
 */
function moize(fn: Function | Options, options: Options = DEFAULT_OPTIONS): Function {
  if (fn.isMoized) {
    // $FlowIgnore if moized, originalFunction and options exist
    return moize(fn.originalFunction, mergeOptions(fn.options, options));
  }

  if (typeof fn === 'object') {
    return (curriedFn: Function | Options, curriedOptions: Options = {}) => {
      return typeof curriedFn === 'function'
        ? // $FlowIgnore fn is actually an object of options
        moize(curriedFn, mergeOptions(fn, curriedOptions))
        : // $FlowIgnore fn is actually an object of options
        moize(mergeOptions(fn, curriedFn));
    };
  }

  const coalescedOptions: Options = Object.assign({}, DEFAULT_OPTIONS, options, {
    profileName: options.profileName || getDefaultProfileName(fn)
  });
  const expirations: Array<Expiration> = [];

  const {
    equals: equalsIgnored,
    isDeepEqual: isDeepEqualIgnored,
    isPromise,
    isReact: isReactIgnored,
    isSerialized: isSerialzedIgnored,
    matchesKey: matchesKeyIgnored,
    maxAge: maxAgeIgnored,
    maxArgs: maxArgsIgnored,
    maxSize,
    onCacheAdd,
    onCacheChange,
    onCacheHit,
    onExpire: onExpireIgnored,
    profileName: profileNameIgnored,
    shouldSerializeFunctions: shouldSerializeFunctionsIgnored,
    serializer: serializerIgnored,
    transformArgs: transformArgsIgnored,
    updateExpire: updateExpireIgnored,
    ...customOptions
  } = coalescedOptions;

  const isEqual: Function = getIsEqual(coalescedOptions);
  const isMatchingKey: ?Function = getIsMatchingKey(coalescedOptions);
  const maxAgeOptions: Options = getMaxAgeOptions(expirations, coalescedOptions, isEqual, isMatchingKey);
  const statsOptions: Options = getStatsOptions(coalescedOptions);
  const transformKey: ?Function = getTransformKey(coalescedOptions);

  const microMemoizeOptions: MicroMemoizeOptions = Object.assign({}, customOptions, {
    isEqual,
    isMatchingKey,
    isPromise,
    maxSize,
    onCacheAdd: createOnCacheOperation(combine(onCacheAdd, maxAgeOptions.onCacheAdd, statsOptions.onCacheAdd)),
    onCacheChange: createOnCacheOperation(onCacheChange),
    onCacheHit: createOnCacheOperation(combine(onCacheHit, maxAgeOptions.onCacheHit, statsOptions.onCacheHit)),
    transformKey
  });

  return augmentMoizeInstance(memoize(fn, microMemoizeOptions), {
    expirations,
    options: coalescedOptions,
    originalFunction: fn
  });
}

Object.assign(moize, {
  /**
   * @function
   * @name collectStats
   * @memberof module:moize
   * @alias moize.collectStats
   *
   * @description
   * start collecting statistics
   */
  collectStats,

  /**
   * @function
   * @name compose
   * @memberof module:moize
   * @alias moize.compose
   *
   * @description
   * method to compose moized methods and return a single moized function
   *
   * @param {...Array<(function)>} functions the functions to compose
   * @returns {function(...Array<*>): *} the composed function
   */
  compose(): Function {
    return compose.apply(null, arguments) || moize;
  },

  /**
   * @function
   * @name deep
   * @memberof module:moize
   * @alias moize.deep
   *
   * @description
   * should deep equality check be used
   *
   * @returns {function} the moizer function
   */
  deep: moize({isDeepEqual: true}),

  /**
   * @function
   * @name getStats
   * @memberof module:moize
   * @alias moize.getStats
   *
   * @description
   * get the statistics of a given profile, or overall usage
   *
   * @returns {StatsProfile} statistics for a given profile or overall usage
   */
  getStats,

  /**
   * @function
   * @name isCollectingStats
   * @memberof module:moize
   * @alias moize.isCollectingStats
   *
   * @description
   * are stats being collected
   *
   * @returns {boolean} are stats being collected
   */
  isCollectingStats(): boolean {
    return statsCache.isCollectingStats;
  },

  /**
   * @function
   * @name isMoized
   * @memberof module:moize
   * @alias moize.isMoized
   *
   * @description
   * is the fn passed a moized function
   *
   * @param {*} fn the object to test
   * @returns {boolean} is fn a moized function
   */
  isMoized(fn: any): boolean {
    return typeof fn === 'function' && !!fn.isMoized;
  },

  /**
   * @function
   * @name maxAge
   * @memberof module:moize
   * @alias moize.maxAge
   *
   * @description
   * a moized method where the age of the cache is limited to the number of milliseconds passed
   *
   * @param {number} maxAge the TTL of the value in cache
   * @returns {function} the moizer function
   */
  maxAge(maxAge: number): Function {
    return moize({maxAge});
  },

  /**
   * @function
   * @name maxArgs
   * @memberof module:moize
   * @alias moize.maxArgs
   *
   * @description
   * a moized method where the number of arguments used for determining cache is limited to the value passed
   *
   * @param {number} maxArgs the number of args to base the key on
   * @returns {function} the moizer function
   */
  maxArgs(maxArgs: number): Function {
    return moize({maxArgs});
  },

  /**
   * @function
   * @name maxSize
   * @memberof module:moize
   * @alias moize.maxSize
   *
   * @description
   * a moized method where the total size of the cache is limited to the value passed
   *
   * @param {number} maxSize the maximum size of the cache
   * @returns {function} the moizer function
   */
  maxSize(maxSize: number): Function {
    return moize({maxSize});
  },

  /**
   * @function
   * @name promise
   * @memberof module:moize
   * @alias moize.promise
   *
   * @description
   * a moized method specific to caching resolved promise / async values
   *
   * @returns {function} the moizer function
   */
  promise: moize({
    isPromise: true,
    updateExpire: true
  }),

  /**
   * @function
   * @name react
   * @memberof module:moize
   * @alias moize.react
   *
   * @description
   * a moized method specific to caching React element values
   *
   * @returns {function} the moizer function
   */
  react: moize({isReact: true}),

  /**
   * @function
   * @name reactSimple
   * @memberof module:moize
   * @alias moize.reactSimple
   *
   * @description
   * a moized method specific to caching React element values, limiting to only the most recent result
   *
   * @returns {function} the moizer function
   */
  reactSimple: moize({isReact: true, maxSize: 1}),

  /**
   * @function
   * @name serialize
   * @memberof module:moize
   * @alias moize.serialize
   *
   * @description
   * a moized method that will serialize the arguments passed to use as the cache key
   *
   * @returns {function} the moizer function
   */
  serialize: moize({isSerialized: true}),

  /**
   * @function
   * @name simple
   * @memberof module:moize
   * @alias moize.simple
   *
   * @description
   * a moized method that will limit the cache values to only the most recent result
   *
   * @returns {function} the moizer function
   */
  simple: moize({maxSize: 1})
});

export default moize;
