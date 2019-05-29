// eslint-disable-next-line import/no-extraneous-dependencies
import { FunctionComponent, Props } from 'react';

import { createMoized } from './moized';

import { createOnCacheOperation, enhanceCache } from './cache';
import { getMaxAgeOptions } from './maxAge';
import { getIsEqual, getIsMatchingKey, getTransformKey } from './options';
import {
  collectStats,
  getProfileName,
  getStats,
  getStatsOptions,
  isCollectingStats,
} from './stats';
import { DEFAULT_OPTIONS, assign, combine, compose, isOptions, isMemoized, mergeOptions } from './utils';

import { Cache, Moized, Options } from './types';

function moize<Fn extends Function>(fn: Fn, options?: Options): Moized<Fn>;
function moize<Fn extends Function>(fn: Moized<Fn>, options?: Options): Moized<Fn>;
function moize(options: Options): <Fn extends Function>(fn: Fn, options?: Options) => Moized<Fn>;
function moize<Fn extends Function>(fn: Fn | Options, options?: Options) {
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

  const coalescedOptions =
    options && typeof options === 'object' ? assign({}, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;

  const isEqual = getIsEqual(coalescedOptions);
  const isMatchingKey = getIsMatchingKey(coalescedOptions);
  const transformKey = getTransformKey(coalescedOptions);

  const normalizedOptions = assign({}, coalescedOptions, {
    isEqual,
    isMatchingKey,
    transformKey,
  });

  normalizedOptions.profileName = getProfileName(fn, normalizedOptions);

  const maxAgeOptions = getMaxAgeOptions(normalizedOptions);
  const statsOptions = getStatsOptions(normalizedOptions);

  assign(normalizedOptions, {
    onCacheAdd: createOnCacheOperation(
      combine(normalizedOptions.onCacheAdd, maxAgeOptions.onCacheAdd, statsOptions.onCacheAdd),
    ),
    onCacheHit: createOnCacheOperation(
      combine(normalizedOptions.onCacheHit, maxAgeOptions.onCacheHit, statsOptions.onCacheHit),
    ),
  });

  const moized = createMoized(fn, normalizedOptions);

  enhanceCache(moized.cache as Cache);

  return moized as Moized<Fn>;
}

moize.collectStats = collectStats;

moize.component = function (fn: FunctionComponent, options?: Options) {
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  const React = require('react');

  return class MoizedComponent extends React.Component {
    static propTypes = fn.propTypes;

    constructor(props: Props<any>) {
      super(props);

      // eslint-disable-next-line no-multi-assign
      const Comp = (this.Moized = moize.react(fn, options));

      this.clear = Comp.clear;
      this.delete = Comp.delete;
      this.get = Comp.get;
      this.getStats = Comp.getStats;
      this.has = Comp.has;
      this.keys = Comp.keys;
      this.set = Comp.set;
      this.values = Comp.values;
    }

    render() {
      return React.createElement(this.Moized, this.props);
    }
  };
};

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

moize.serialize = moize({ isSerialized: true });

export default moize;
