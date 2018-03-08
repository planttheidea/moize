// @flow

// external dependencies
import memoize from 'micro-memoize';

// constants
import {DEFAULT_OPTIONS} from './constants';

// instance
import {augmentMoizeInstance} from './instance';

// is equal
import {getIsEqual} from './isEqual';

// max age
import {getMaxAgeOptions} from './maxAge';

// stats
import {collectStats, getStatsOptions, getAnonymousProfileName, getStats, statsCache} from './stats';

// transform key
import {getTransformKey} from './transformKey';

// types
import type {Expiration, MicroMemoizeOptions, Options} from './types';

// utils
import {combine, compose} from './utils';

export {collectStats};

function moize(fn: Function | Options, options: Options = DEFAULT_OPTIONS): Function {
  if (typeof fn === 'object') {
    return (curriedFn: Function | Options, curriedOptions: Options = {}) => {
      return typeof curriedFn === 'function'
        ? moize(
          curriedFn,
          // $FlowIgnore fn is actually an object of options
          Object.assign({}, fn, curriedOptions, {
            onCacheAdd: combine(curriedOptions.onCacheAdd, fn.onCacheAdd),
            onCacheChange: combine(curriedOptions.onCacheChange, fn.onCacheChange),
            onCacheHit: combine(curriedOptions.onCacheHit, fn.onCacheHit)
          })
        )
        : moize(
          // $FlowIgnore fn is actually an object of options
          Object.assign({}, fn, curriedFn, {
            onCacheAdd: combine(curriedFn.onCacheAdd, fn.onCacheAdd),
            onCacheChange: combine(curriedFn.onCacheChange, fn.onCacheChange),
            onCacheHit: combine(curriedFn.onCacheHit, fn.onCacheHit)
          })
        );
    };
  }

  const coalescedOptions: Options = Object.assign({}, DEFAULT_OPTIONS, options, {
    profileName: options.profileName || getAnonymousProfileName(fn)
  });
  const collectStats: boolean = false;
  const expirations: Array<Expiration> = [];

  const {
    equals: equalsIgnored,
    isPromise,
    isReact: isReactIgnored,
    isSerialized: isSerialzedIgnored,
    maxAge: maxAgeIgnored,
    maxArgs: maxArgsIgnored,
    maxSize,
    onCacheAdd: onCacheAddIgnored,
    onCacheChange: onCacheChangCacheeIgnored,
    onCacheHit: onCacheHitIgnored,
    onExpire: onExpireIgnored,
    profileName: profileNameIgnored,
    shouldSerializeFunctions: shouldSerializeFunctionsIgnored,
    serializer: serializerIgnored,
    transformArgs: transformArgsIgnored,
    updateExpire: updateExpireIgnored,
    ...customOptions
  } = coalescedOptions;

  const isEqual: Function = getIsEqual(coalescedOptions);
  const maxAgeOptions: Options = getMaxAgeOptions(expirations, coalescedOptions, isEqual);
  const statsOptions: Options = getStatsOptions(coalescedOptions);
  const transformKey: ?Function = getTransformKey(coalescedOptions);

  const microMemoizeOptions: MicroMemoizeOptions = Object.assign({}, customOptions, {
    isEqual,
    isPromise,
    maxSize,
    onCacheAdd: statsOptions.onCacheAdd,
    onCacheChange: maxAgeOptions.onCacheChange,
    onCacheHit: combine(maxAgeOptions.onCacheHit, statsOptions.onCacheHit),
    transformKey
  });

  return augmentMoizeInstance(memoize(fn, microMemoizeOptions), {
    collectStats,
    expirations,
    options: coalescedOptions,
    originalFunction: fn
  });
}

moize.compose = compose;

moize.deep = moize({isDeepEqual: true});

moize.getStats = getStats;

moize.isCollectingStats = (): boolean => {
  return statsCache.isCollectingStats;
};

moize.isMoized = (fn: any): boolean => {
  return typeof fn === 'function' && fn.isMoized;
};

moize.maxAge = (maxAge: number): Function => {
  return moize({maxAge});
};

moize.maxArgs = (maxArgs: number): Function => {
  return moize({maxArgs});
};

moize.maxSize = (maxSize: number): Function => {
  return moize({maxSize});
};

moize.promise = moize({isPromise: true});

moize.react = moize({isReact: true});

moize.reactSimple = moize({isReact: true, maxSize: 1});

moize.serialize = moize({isSerialized: true});

moize.simple = moize.maxSize(1);

export default moize;
