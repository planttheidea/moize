import memoize from 'micro-memoize';
import { DEFAULT_OPTIONS } from './constants';
import { createMoizeInstance } from './instance';
import { getMaxAgeOptions } from './maxAge';
import { createOnCacheOperation, getIsEqual, getIsMatchingKey, getTransformKey } from './options';
import { createMoizedComponent } from './react';
import {
  clearStats,
  collectStats,
  getDefaultProfileName,
  getStats,
  getStatsOptions,
  statsCache,
} from './stats';
import { Expiration, MicroMemoizeOptions, Moize, Moizeable, Moized, Options } from './types';
import { combine, compose, isMoized, mergeOptions } from './utils';

export * from './types';

/**
 * @module moize
 */

/**
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
 * @param fn the function to memoized, or a list of options when currying
 * @param [options=DEFAULT_OPTIONS] the options to apply
 * @returns the memoized function
 */
const moize: Moize = function<Fn extends Moizeable, PassedOptions extends Options>(
  fn: Fn | PassedOptions,
  passedOptions?: PassedOptions
) {
  type CombinedOptions = Options & PassedOptions;

  const options: Options = passedOptions || DEFAULT_OPTIONS;

  if (isMoized(fn)) {
    const moizeable = fn.originalFunction as Fn;
    const mergedOptions = mergeOptions(fn.options, options) as CombinedOptions;

    return moize<Fn, CombinedOptions>(moizeable, mergedOptions);
  }

  if (typeof fn === 'object') {
    return function<CurriedFn extends Moizeable, CurriedOptions extends Options>(
      curriedFn: CurriedFn | CurriedOptions,
      curriedOptions: CurriedOptions
    ) {
      type CombinedCurriedOptions = CombinedOptions & CurriedOptions;

      if (typeof curriedFn === 'function') {
        const mergedOptions = mergeOptions(
          fn as CombinedOptions,
          curriedOptions
        ) as CombinedCurriedOptions;

        return moize(curriedFn, mergedOptions);
      }

      const mergedOptions = mergeOptions(fn as CombinedOptions, curriedFn as CurriedOptions);

      return moize(mergedOptions);
    };
  }

  if (options.isReact) {
    return createMoizedComponent(moize, fn, options);
  }

  const coalescedOptions: Options = {
    ...DEFAULT_OPTIONS,
    ...options,
    maxArgs:
      typeof options.maxArgs === 'number' && options.maxArgs >= 0
        ? options.maxArgs
        : DEFAULT_OPTIONS.maxArgs,
    maxSize:
      typeof options.maxSize === 'number' && options.maxSize >= 0
        ? options.maxSize
        : DEFAULT_OPTIONS.maxSize,
    profileName: options.profileName || getDefaultProfileName(fn),
  };
  const expirations: Array<Expiration> = [];

  const {
    equals: equalsIgnored,
    isDeepEqual: isDeepEqualIgnored,
    isPromise,
    isReact: isReactIgnored,
    isSerialized: isSerialzedIgnored,
    isShallowEqual: isShallowEqualIgnored,
    matchesKey: matchesKeyIgnored,
    maxAge: maxAgeIgnored,
    maxArgs: maxArgsIgnored,
    maxSize,
    onCacheAdd,
    onCacheChange,
    onCacheHit,
    onExpire: onExpireIgnored,
    profileName: profileNameIgnored,
    serializer: serializerIgnored,
    transformArgs: transformArgsIgnored,
    updateExpire: updateExpireIgnored,
    ...customOptions
  } = coalescedOptions;

  const isEqual = getIsEqual(coalescedOptions);
  const isMatchingKey = getIsMatchingKey(coalescedOptions);

  const maxAgeOptions = getMaxAgeOptions(expirations, coalescedOptions, isEqual, isMatchingKey);
  const statsOptions = getStatsOptions(coalescedOptions);

  const transformKey = getTransformKey(coalescedOptions);

  const microMemoizeOptions: MicroMemoizeOptions = {
    ...customOptions,
    isEqual,
    isMatchingKey,
    isPromise,
    maxSize,
    onCacheAdd: createOnCacheOperation(
      combine(onCacheAdd, maxAgeOptions.onCacheAdd, statsOptions.onCacheAdd)
    ),
    onCacheChange: createOnCacheOperation(onCacheChange),
    onCacheHit: createOnCacheOperation(
      combine(onCacheHit, maxAgeOptions.onCacheHit, statsOptions.onCacheHit)
    ),
    transformKey,
  };

  const memoized = memoize(fn, microMemoizeOptions);

  return createMoizeInstance<Fn, CombinedOptions>(memoized, {
    expirations,
    options: coalescedOptions,
    originalFunction: fn,
  });
};

/**
 * @function
 * @name clearStats
 * @memberof module:moize
 * @alias moize.clearStats
 *
 * @description
 * clear all existing stats stored
 */
moize.clearStats = clearStats;

/**
 * @function
 * @name collectStats
 * @memberof module:moize
 * @alias moize.collectStats
 *
 * @description
 * start collecting statistics
 */
moize.collectStats = collectStats;

/**
 * @function
 * @name compose
 * @memberof module:moize
 * @alias moize.compose
 *
 * @description
 * method to compose moized methods and return a single moized function
 *
 * @param functions the functions to compose
 * @returns the composed function
 */
moize.compose = function(...moized: Moize[]) {
  return compose<Moize>(...moized) || moize;
};

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
moize.deep = moize({ isDeepEqual: true });

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
moize.getStats = getStats;

/**
 * @function
 * @name infinite
 * @memberof module:moize
 * @alias moize.infinite
 *
 * @description
 * a moized method that will remove all limits from the cache size
 *
 * @returns {function} the moizer function
 */
moize.infinite = moize({ maxSize: Infinity });

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
moize.isCollectingStats = function isCollectingStats(): boolean {
  return statsCache.isCollectingStats;
};

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
moize.isMoized = function isMoized(fn: any): fn is Moized {
  return typeof fn === 'function' && !!fn.isMoized;
};

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
moize.maxAge = function maxAge(maxAge: number) {
  return moize({ maxAge });
};

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
moize.maxArgs = function maxArgs(maxArgs: number) {
  return moize({ maxArgs });
};

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
moize.maxSize = function maxSize(maxSize: number) {
  return moize({ maxSize });
};

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
moize.promise = moize({
  isPromise: true,
  updateExpire: true,
});

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
moize.react = moize({ isReact: true });

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
moize.serialize = moize({ isSerialized: true });

/**
 * @function
 * @name shallow
 * @memberof module:moize
 * @alias moize.shallow
 *
 * @description
 * should shallow equality check be used
 *
 * @returns {function} the moizer function
 */
moize.shallow = moize({ isShallowEqual: true });

export default moize;
