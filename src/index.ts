import { createMoized } from './moized';

import { createOnCacheOperation } from './cache';
import { getMaxAgeOptions } from './maxAge';
import {
  getDefaultOptions,
  getMicroMemoizeOptions,
  isOptions,
  mergeOptions,
  setDefaultOptions,
} from './options';
import {
  collectStats,
  getProfileName,
  getStats,
  getStatsOptions,
  isCollectingStats,
} from './stats';
import { assign, combine, compose, isMemoized } from './utils';

import { Moizable, Moized, Options } from './types';

function moize<Fn extends Moizable>(fn: Fn, options?: Options): Moized<Fn>;
function moize<Fn extends Moizable>(fn: Moized<Fn>, options?: Options): Moized<Fn['fn']>;
function moize(options: Options): moize;
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

  if (isMemoized(fn)) {
    const combinedOptions = options ? assign({}, fn.options, options) : fn.options;

    return moize(fn.fn, combinedOptions);
  }

  if (typeof fn !== 'function') {
    throw new TypeError('Only functions or options can be passed to moize.');
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

  normalizedOptions._mm = getMicroMemoizeOptions(normalizedOptions, onCacheAdd, onCacheHit);

  return createMoized(moize, fn, normalizedOptions);
}

moize.collectStats = collectStats;

moize.compose = (...args: any[]) => compose(...args) || moize;

moize.deep = moize({ isDeepEqual: true });

moize.getStats = getStats;

moize.isCollectingStats = isCollectingStats;

moize.isMemoized = isMemoized;

moize.maxAge = (maxAge: number) => moize({ maxAge });

moize.maxArgs = (maxArgs: number) => moize({ maxArgs });

moize.maxSize = (maxSize: number) => moize({ maxSize });

moize.promise = moize({ isPromise: true });

moize.react = moize({ isReact: true });

moize.reactGlobal = moize({ isReact: true, isReactGlobal: true });

moize.serialize = moize({ isSerialized: true });

moize.setDefaultOptions = setDefaultOptions;

export default moize;
