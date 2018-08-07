// @flow

// external dependencies
import {
  deepEqual,
  sameValueZeroEqual,
  shallowEqual
} from 'fast-equals';

// max args
import {createGetInitialArgs} from './maxArgs';

// serialize
import {
  getIsSerializedKeyEqual,
  getSerializerFunction
} from './serialize';

// types
import type {
  Cache,
  MicroMemoizeOptions,
  Options
} from './types';

// utils
import {
  compose,
  getArrayKey
} from './utils';

export const createOnCacheOperation = (fn: ?Function): ?Function => {
  if (typeof fn === 'function') {
    return (cache: Cache, _microMemoizeOptions: MicroMemoizeOptions, memoized: Function): void =>
      // $FlowIgnore fn is a function if this is hit
      fn(memoized.cache, memoized.options, memoized);
  }
};

/**
 * @private
 *
 * @function getIsEqual
 *
 * @description
 * get the isEqual method passed to micro-memoize
 *
 * @param {Options} options the options passed to the moizer
 * @returns {function} the isEqual method to apply
 */
export const getIsEqual = ({equals, isDeepEqual, isReact}: Options): Function =>
  equals || (isDeepEqual && deepEqual) || (isReact && shallowEqual) || sameValueZeroEqual;

/**
 * @private
 *
 * @function getIsMatchingKey
 *
 * @description
 * get the isEqual method passed to micro-memoize
 *
 * @param {Options} options the options passed to the moizer
 * @returns {function} the isEqual method to apply
 */
export const getIsMatchingKey = ({isSerialized, matchesKey}: Options): ?Function =>
  matchesKey || (isSerialized && getIsSerializedKeyEqual) || undefined;

/**
 * @private
 *
 * @function getTransformKey
 *
 * @description
 * get the function that will transform the key based on the arguments passed
 *
 * @param {Options} options the options passed to the moizer
 * @returns {function|void} the function to transform the key with
 */
export const getTransformKey = (options: Options): ?Function => {
  const {maxArgs, isReact, isSerialized, transformArgs} = options;

  return compose(
    isSerialized && getSerializerFunction(options),
    typeof transformArgs === 'function'
      && compose(
        getArrayKey,
        transformArgs
      ),
    isReact && createGetInitialArgs(2),
    typeof maxArgs === 'number' && createGetInitialArgs(maxArgs)
  );
};
