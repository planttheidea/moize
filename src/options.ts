import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';
import { MicroMemoize } from 'micro-memoize';

import { createGetInitialArgs } from './maxArgs';
import { getSerializerFunction } from './serialize';
import { assign, compose } from './utils';

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

export const DEFAULT_OPTIONS = {
  __global__: assign({}, DEFAULTS),
  deep: assign({}, DEFAULTS, { isDeepEqual: true }),
  promise: assign({}, DEFAULTS, { isPromise: true }),
  react: assign({}, DEFAULTS, { isReact: true }),
  reactGlobal: assign({}, DEFAULTS, { isReact: true, isReactGlobal: true }),
  serialize: assign({}, DEFAULTS, { isSerialized: true }),
};

const MERGED_HANDLER_OPTIONS = ['onCacheAdd', 'onCacheChange', 'onCacheHit', 'transformArgs'];

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
  return (
    options.equals ||
    (options.isDeepEqual && deepEqual) ||
    (options.isReact && shallowEqual) ||
    sameValueZeroEqual
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
  const transformKey = getTransformKey(options);

  const microMemoizeOptions: MicroMemoize.Options = {
    isEqual,
    isMatchingKey: options.matchesKey,
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

/**
 * @private
 *
 * @function getTransformKey
 *
 * @description
 * get the transformKey option based on the options passed
 *
 * @param options the options for the moize instance
 * @returns the transformKey option to use
 */
export function getTransformKey(options: Options) {
  const handlers = [options.isSerialized && getSerializerFunction(options), options.transformArgs];

  let maxArgs;

  if (typeof options.maxArgs === 'number') {
    ({ maxArgs } = options);
  }

  if (options.isReact) {
    maxArgs = typeof maxArgs === 'number' ? Math.min(maxArgs, 2) : 2;
  }

  if (typeof maxArgs === 'number') {
    handlers.push(createGetInitialArgs(maxArgs));
  }

  const transformKey = compose(...handlers);

  if (typeof transformKey === 'function') {
    return transformKey;
  }
}

/**
 * @private
 *
 * @function isOptions
 *
 * @description
 * determine if the value passed is an options object
 *
 * @param value the value to test
 * @returns if the value passed is a valid options value
 */
export function isOptions(value: any): value is Options {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @private
 *
 * @function mergeOptions
 *
 * @description
 * merge the original and new options into a new object
 *
 * @param originalOptions the original options passed
 * @param newOptions the new options to merge
 * @returns the merged optoins
 */
export function mergeOptions(originalOptions: Options, newOptions: Options): Options {
  const mergedOptions = assign({}, originalOptions, newOptions);

  return MERGED_HANDLER_OPTIONS.reduce((_mergedOptions: Options, option: keyof Options) => {
    _mergedOptions[option] = compose(
      originalOptions[option],
      newOptions[option],
    );

    return _mergedOptions;
  }, mergedOptions);
}

export function setDefaultOptions(
  type: Options | keyof typeof DEFAULT_OPTIONS,
  options?: Options,
): boolean {
  if (typeof type === 'string') {
    const defaultOptions = DEFAULT_OPTIONS[type];

    if (isOptions(defaultOptions)) {
      if (!isOptions(options)) {
        return false;
      }

      Object.keys(options).forEach((option) => {
        defaultOptions[option] = options[option];
      });

      return type === 'react' ? setDefaultOptions('reactGlobal', options) : true;
    }

    return false;
  }

  if (isOptions(type)) {
    options = type;

    Object.keys(DEFAULT_OPTIONS).forEach((optionType: keyof typeof DEFAULT_OPTIONS) => {
      const defaultOptions = DEFAULT_OPTIONS[optionType];

      Object.keys(options).forEach((option) => {
        defaultOptions[option] = options[option];
      });
    });

    return true;
  }

  return false;
}
