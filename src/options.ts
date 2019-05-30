import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';
import { MicroMemoize } from 'micro-memoize';

import { createGetInitialArgs } from './maxArgs';
import { getSerializerFunction, getIsSerializedKeyEqual } from './serialize';
import { assign, compose, getValidHandlers } from './utils';

import { Handler, Options } from './types';

const MERGED_OPTIONS = ['onCacheAdd', 'onCacheChange', 'onCacheHit', 'transformArgs'];

export function getIsEqual(options: Options) {
  return (
    options.equals ||
    (options.isDeepEqual && deepEqual) ||
    (options.isReact && shallowEqual) ||
    sameValueZeroEqual
  );
}

export function getIsMatchingKey(options: Options) {
  return options.matchesKey || (options.isSerialized && getIsSerializedKeyEqual) || undefined;
}

export function getMicroMemoizeOptions(
  options: Options,
  onCacheAdd: Handler | void,
  onCacheHit: Handler | void,
) {
  const isEqual = getIsEqual(options);
  const isMatchingKey = getIsMatchingKey(options);
  const transformKey = getTransformKey(options);

  const microMemoizeOptions: MicroMemoize.Options = {
    isEqual,
    isMatchingKey,
    isPromise: options.isPromise,
    maxSize: options.maxSize,
  };

  if (onCacheAdd) {
    microMemoizeOptions.onCacheAdd = onCacheAdd;
  }

  if (options.onCacheChange) {
    microMemoizeOptions.onCacheChange = options.onCacheChange;
  }

  if (onCacheHit) {
    microMemoizeOptions.onCacheHit = onCacheHit;
  }

  if (transformKey) {
    microMemoizeOptions.transformKey = transformKey;
  }

  return microMemoizeOptions;
}

export function getTransformKey(options: Options) {
  return compose(
    options.isSerialized && getSerializerFunction(options),
    options.transformArgs,
    options.isReact && createGetInitialArgs(2),
    typeof options.maxArgs === 'number' && createGetInitialArgs(options.maxArgs),
  );
}

export function mergeOptions(originalOptions: Options, newOptions: Options): Options {
  const mergedOptions = assign({}, originalOptions, newOptions);

  return MERGED_OPTIONS.reduce((_mergedOptions: Options, option: keyof Options) => {
    const handlers = getValidHandlers([originalOptions[option], newOptions[option]]);

    _mergedOptions[option] = handlers.length ? handlers : undefined;

    return _mergedOptions;
  }, mergedOptions);
}
