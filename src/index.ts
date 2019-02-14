// external dependencies
// eslint-disable-next-line no-unused-vars,import/no-duplicates
import memoize, { MicroMemoize } from 'micro-memoize';
// eslint-disable-next-line no-unused-vars,import/no-duplicates,import/no-extraneous-dependencies
import * as React from 'react';

// constants
import { DEFAULT_OPTIONS } from './constants';

// instance
import { augmentInstance } from './instance';

// maxAge
import { getMaxAgeOptions } from './maxAge';

// options
import {
  createOnCacheOperation, getCustomOptions, getIsEqual, getIsMatchingKey, getTransformKey,
} from './options';

// stats
import {
  collectStats, getDefaultProfileName, getStats, getStatsOptions, statsCache,
} from './stats';

// utils
import {
  assign, combine, compose as _compose, mergeOptions,
} from './utils';

function moize<T extends Function>(
  fn: T | Moize.Options | React.ComponentClass | Moize.Moized,
  options: Moize.Options = DEFAULT_OPTIONS,
): Moize.Moized {
  if (typeof fn !== 'function') {
    if (!fn || typeof fn !== 'object') {
      throw new TypeError('Only functions or options objects can be passed to moize()');
    }

    // @ts-ignore
    return function curriedMoize(curriedFn: T | Moize.Options, curriedOptions: Moize.Options) {
      if (typeof curriedFn === 'function') {
        return moize(curriedFn, mergeOptions(fn, curriedOptions || {}));
      }

      return moize(mergeOptions(fn, curriedFn));
    };
  }

  // @ts-ignore if it has a property isMoized, its a previously-moized function
  if (fn.isMoized) {
    // @ts-ignore so just return it directly, no need to re-moize it
    return fn;
  }

  const coalescedOptions = assign({}, DEFAULT_OPTIONS, options, {
    profileName: options.profileName || getDefaultProfileName(fn),
  });

  const expirations: Moize.Expiration[] = [];

  const {
    isPromise,
    maxSize,
    onCacheAdd: onCacheAddPassed,
    onCacheChange: onCacheChangePassed,
    onCacheHit: onCacheHitPassed,
  } = coalescedOptions;

  const isEqual = getIsEqual(coalescedOptions);
  const isMatchingKey = getIsMatchingKey(coalescedOptions);
  const maxAgeOptions = getMaxAgeOptions(expirations, coalescedOptions, isEqual, isMatchingKey);
  const statsOptions = getStatsOptions(coalescedOptions);

  const microMemoizeOptions: MicroMemoize.Options = assign({}, getCustomOptions(options), {
    isEqual,
    isPromise,
    maxSize,
  });

  assign(microMemoizeOptions, {
    isMatchingKey,
    onCacheAdd: createOnCacheOperation(
      combine(
        onCacheAddPassed,
        maxAgeOptions.onCacheAdd,
        statsOptions.onCacheAdd,
      ),
    ),
    onCacheChange: createOnCacheOperation(onCacheChangePassed),
    onCacheHit: createOnCacheOperation(
      combine(
        onCacheHitPassed,
        maxAgeOptions.onCacheHit,
        statsOptions.onCacheHit,
      ),
    ),
    transformKey: getTransformKey(coalescedOptions),
  });

  return augmentInstance(memoize(fn, microMemoizeOptions), {
    expirations,
    options: coalescedOptions,
    originalFunction: fn,
  });
}

moize.collectStats = collectStats;

moize.compose = function compose(...args: any[]) {
  return _compose(...args) || moize;
};

moize.deep = moize({ isDeepEqual: true });

moize.getStats = getStats;

moize.isCollectingStats = function isCollectingStats() {
  return statsCache.isCollectingStats;
};

moize.isMoized = function isMoized(fn: Function | Moize.Moized) {
  // @ts-ignore
  return typeof fn === 'function' && fn.isMoized;
};

moize.maxAge = function maxAge(_maxAge: number) {
  return moize({ maxAge: _maxAge });
};

moize.maxArgs = function maxArgs(_maxArgs: number) {
  return moize({ maxArgs: _maxArgs });
};

moize.maxSize = function maxSize(_maxSize: number) {
  return moize({ maxSize: _maxSize });
};

moize.promise = moize({ isPromise: true, updateExpire: true });

moize.react = moize({ isReact: true });

moize.reactSimple = moize({ isReact: true, maxSize: 1 });

moize.serialize = moize({ isSerialized: true });

export default moize;
