import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';
import { MicroMemoize } from 'micro-memoize';

import { createGetInitialArgs } from './maxArgs';
import { getSerializerFunction, isMatchingSerializedKey } from './serialize';
import { assign, compose, getValidHandlers } from './utils';

import { Dictionary, Handler, Options } from './types';

const DEFAULTS: Options = {
  equals: undefined,
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isReactGlobal: false,
  isSerialized: false,
  matchesKey: undefined,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: 1,
  onCacheAdd: undefined,
  onCacheChange: undefined,
  onCacheHit: undefined,
  onExpire: undefined,
  profileName: undefined,
  serializer: undefined,
  transformArgs: undefined,
  updateExpire: true,
};

export const DEFAULT_OPTIONS: Dictionary<Options> = {
  __global__: assign({}, DEFAULTS),
  deep: assign({}, DEFAULTS, { isDeepEqual: true }),
  promise: assign({}, DEFAULTS, { isPromise: true }),
  react: assign({}, DEFAULTS, { isReact: true }),
  reactGlobal: assign({}, DEFAULTS, { isReact: true, isReactGlobal: true }),
  serialize: assign({}, DEFAULTS, { isSerialized: true }),
};

const MERGED_OPTIONS = ['onCacheAdd', 'onCacheChange', 'onCacheHit', 'transformArgs'];

/**
 * @private
 *
 * @function getDefaultOptions
 *
 * @description
 * get the default options for the memoization type
 *
 * @param options the options for the moize instance
 * @returns the default options requested
 */
export function getDefaultOptions(options?: Options) {
  if (options) {
    if (options.isDeepEqual) {
      return DEFAULT_OPTIONS.deep;
    }

    if (options.isPromise) {
      return DEFAULT_OPTIONS.promise;
    }

    if (options.isReact) {
      return options.isReactGlobal ? DEFAULT_OPTIONS.reactGlobal : DEFAULT_OPTIONS.react;
    }

    if (options.isSerialized) {
      return DEFAULT_OPTIONS.serialize;
    }
  }

  return DEFAULT_OPTIONS.__global__;
}

/**
 * @private
 *
 * @function getIsEqual
 *
 * @description
 * get the isEqual method used in memoization
 *
 * @param options the options for the moize instance
 * @returns the isEqual method requested
 */
export function getIsEqual(options: Options) {
  return options.equals || (options.isDeepEqual && deepEqual) || sameValueZeroEqual;
}

/**
 * @private
 *
 * @function getIsMatchingKey
 *
 * @description
 * get the isMatchingKey method used in memoization
 *
 * @param options the options for the moize instance
 * @returns the isMatchingKey method requested
 */
export function getIsMatchingKey(options: Options) {
  return (
    options.matchesKey ||
    (options.isSerialized && isMatchingSerializedKey) ||
    (options.isReact && isMatchingReactKey) ||
    undefined
  );
}

/**
 * @private
 *
 * @function getMicroMemoizeOptions
 *
 * @description
 * get the options used for the micro-memoize call
 *
 * @param options the options for the moize instance
 * @param onCacheAdd the onCacheAdd calculated based on the options
 * @param onCacheHit the onCacheHit calculated based on the options
 * @returns the options for the micro-memoize call
 */
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
    typeof options.maxArgs === 'number' && createGetInitialArgs(options.maxArgs),
  );
}

export function isMatchingReactKey(cacheKey: Dictionary<any>[], key: Dictionary<any>[]) {
  return shallowEqual(cacheKey[0], key[0]) && shallowEqual(cacheKey[1], key[1]);
}

export function isOptions(value: any): value is Options {
  return !!value && typeof value === 'object';
}

export function mergeOptions(originalOptions: Options, newOptions: Options): Options {
  const mergedOptions = assign({}, originalOptions, newOptions);

  return MERGED_OPTIONS.reduce((_mergedOptions: Options, option: keyof Options) => {
    const handlers = getValidHandlers([originalOptions[option], newOptions[option]]);

    _mergedOptions[option] = handlers.length ? handlers : undefined;

    return _mergedOptions;
  }, mergedOptions);
}

export function setDefaultOptions(type: Options | string, options?: Options) {
  if (typeof type === 'string') {
    const defaultOptions = DEFAULT_OPTIONS[type];

    if (isOptions(defaultOptions)) {
      if (!isOptions(options)) {
        return false;
      }

      Object.keys(options).forEach((option) => {
        defaultOptions[option] = options[option];
      });

      if (type === 'react') {
        setDefaultOptions('reactGlobal', options);
      }

      return true;
    }

    throw new Error(`The type "${type}" passed does not exist as an options type.`);
  }

  if (isOptions(type)) {
    options = type;

    Object.keys(DEFAULT_OPTIONS).forEach((optionType) => {
      const defaultOptions = DEFAULT_OPTIONS[optionType];

      Object.keys(options).forEach((option) => {
        defaultOptions[option] = options[option];
      });
    });

    return true;
  }

  return false;
}
