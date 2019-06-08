import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';
import { MicroMemoize } from 'micro-memoize';

import { createGetInitialArgs } from './maxArgs';
import { getSerializerFunction } from './serialize';
import { assign, compose } from './utils';

import { Moize } from './types';

const DEFAULTS: Moize.Options = {
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

export const DEFAULT_OPTIONS = assign({}, DEFAULTS);

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
export function getDefaultOptions(): Moize.Options {
  return DEFAULT_OPTIONS;
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
export function getIsEqual(options: Moize.Options) {
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
  options: Moize.Options,
  onCacheAdd: Moize.Handler | void,
  onCacheChange: Moize.Handler | void,
  onCacheHit: Moize.Handler | void,
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

  if (onCacheChange) {
    microMemoizeOptions.onCacheChange = onCacheChange;
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
export function getTransformKey(options: Moize.Options) {
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
export function isOptions(value: any): value is Moize.Options {
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
export function mergeOptions(
  originalOptions: Moize.Options,
  newOptions: Moize.Options,
): Moize.Options {
  const mergedOptions = assign({}, originalOptions, newOptions);

  return MERGED_HANDLER_OPTIONS.reduce(
    (_mergedOptions: Moize.Options, option: keyof Moize.Options) => {
      _mergedOptions[option] = compose(
        originalOptions[option],
        newOptions[option],
      );

      return _mergedOptions;
    },
    mergedOptions,
  );
}

export function setDefaultOptions(options?: Moize.Options): boolean {
  if (isOptions(options)) {
    Object.keys(options).forEach((option: keyof typeof DEFAULT_OPTIONS) => {
      DEFAULT_OPTIONS[option] = options[option];
    });

    return true;
  }

  return false;
}
