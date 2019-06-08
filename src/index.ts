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
import { assign, combine, compose, isMemoized, isValidNumericOption } from './utils';

import { Moize } from './types';

function moize<Fn extends Moize.Moizable>(fn: Fn, options?: Moize.Options): Moize.Moized<Fn>;
function moize<Fn extends Moize.Moizable>(
  fn: Moize.Moized<Fn>,
  options?: Moize.Options,
): Moize.Moized<Fn['fn']>;
function moize(options: Moize.Options): moize;
function moize<Fn extends Moize.Moizable>(fn: Fn | Moize.Options, options?: Moize.Options) {
  if (isOptions(fn)) {
    return function curriedMoize(curriedFn: Fn | Moize.Options, curriedOptions?: Moize.Options) {
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

  if (!isValidNumericOption(normalizedOptions.maxSize)) {
    throw new Error('The maxSize option must be a non-negative integer.');
  }

  normalizedOptions.profileName = getProfileName(fn, normalizedOptions);

  const maxAgeOptions = getMaxAgeOptions(normalizedOptions);
  const statsOptions = getStatsOptions(normalizedOptions);

  const onCacheAdd = createOnCacheOperation(
    combine(normalizedOptions.onCacheAdd, maxAgeOptions.onCacheAdd, statsOptions.onCacheAdd),
  );
  const onCacheChange = createOnCacheOperation(normalizedOptions.onCacheChange);
  const onCacheHit = createOnCacheOperation(
    combine(normalizedOptions.onCacheHit, maxAgeOptions.onCacheHit, statsOptions.onCacheHit),
  );

  normalizedOptions._mm = getMicroMemoizeOptions(
    normalizedOptions,
    onCacheAdd,
    onCacheChange,
    onCacheHit,
  );

  return createMoized(moize, fn, normalizedOptions);
}

moize.collectStats = collectStats;

moize.compose = (...args: any[]) => compose(...args) || moize;

moize.deep = moize({ isDeepEqual: true });

moize.getStats = getStats;

moize.infinite = moize({ maxSize: Infinity });

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
