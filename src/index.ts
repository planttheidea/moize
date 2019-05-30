import { createMoized } from './moized';

import { createOnCacheOperation, enhanceCache } from './cache';
import { getMaxAgeOptions } from './maxAge';
import {
  getDefaultOptions,
  getMicroMemoizeOptions,
  isOptions,
  mergeOptions,
  setDefaultOptions,
} from './options';
import { createMemoizedComponent } from './reactComponent';
import {
  collectStats,
  getProfileName,
  getStats,
  getStatsOptions,
  isCollectingStats,
} from './stats';
import { assign, combine, compose, isMemoized } from './utils';

import { Cache, Moizable, Moized, Options } from './types';

function moize<Fn extends Moizable>(fn: Fn, options?: Options): Moized<Fn>;
function moize<Fn extends Moizable>(fn: Moized<Fn>, options?: Options): Moized<Fn>;
function moize(options: Options): <Fn extends Function>(fn: Fn, options?: Options) => Moized<Fn>;
function moize<Fn extends Moizable>(fn: Fn | Options, options?: Options) {
  if (isOptions(fn)) {
    return function curriedMoize(curriedFn: Fn | Options, curriedOptions?: Options) {
      if (isOptions(curriedFn)) {
        return moize(mergeOptions(fn, curriedFn));
      }

      if (typeof curriedFn !== 'function') {
        throw new TypeError('Only functions or options can be passed to moize.');
      }

      return moize(curriedFn, mergeOptions(fn, curriedOptions || {}));
    };
  }

  if (typeof fn !== 'function') {
    throw new TypeError('Only functions or options can be passed to moize.');
  }

  if (isMemoized(fn)) {
    const combinedOptions = options ? assign({}, fn.options, options) : fn.options;

    return moize(fn.fn, combinedOptions);
  }

  const defaultOptions = getDefaultOptions(options);
  const normalizedOptions =
    options && typeof options === 'object'
      ? assign({}, defaultOptions, options)
      : assign({}, defaultOptions);

  normalizedOptions.profileName = getProfileName(fn, normalizedOptions);

  const maxAgeOptions = getMaxAgeOptions(normalizedOptions);
  const statsOptions = getStatsOptions(normalizedOptions);
  const onCacheAdd = createOnCacheOperation(
    combine(normalizedOptions.onCacheAdd, maxAgeOptions.onCacheAdd, statsOptions.onCacheAdd),
  );
  const onCacheHit = createOnCacheOperation(
    combine(normalizedOptions.onCacheHit, maxAgeOptions.onCacheHit, statsOptions.onCacheHit),
  );

  const microMemoizeOptions = getMicroMemoizeOptions(normalizedOptions, onCacheAdd, onCacheHit);

  normalizedOptions._mm = microMemoizeOptions;

  const moized = createMoized(fn, normalizedOptions, microMemoizeOptions);

  enhanceCache(moized.cache as Cache);

  if (normalizedOptions.isReact && !normalizedOptions.isReactGlobal) {
    return createMemoizedComponent(moize, fn, normalizedOptions);
  }

  return moized as Moized<Fn>;
}

moize.collectStats = collectStats;

moize.compose = function (...args: any[]) {
  return compose(...args) || moize;
};

moize.deep = moize({ isDeepEqual: true });

moize.getStats = getStats;

moize.isCollectingStats = isCollectingStats;

moize.isMemoized = isMemoized;

moize.maxAge = function (maxAge: number) {
  return moize({ maxAge });
};

moize.maxArgs = function (maxArgs: number) {
  return moize({ maxArgs });
};

moize.maxSize = function (maxSize: number) {
  return moize({ maxSize });
};

moize.promise = moize({ isPromise: true, updateExpire: true });

moize.react = moize({ isReact: true });

moize.reactGlobal = moize({ isReact: true, isReactGlobal: true });

moize.serialize = moize({ isSerialized: true });

moize.setDefaultOptions = setDefaultOptions;

export default moize;
