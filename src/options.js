// @flow

// external dependencies
import {deepEqual, sameValueZeroEqual, shallowEqual} from 'fast-equals';

// max args
import {createGetInitialArgs} from './maxArgs';

// serialize
import {getSerializerFunction} from './serialize';

// types
import type {Cache, MicroMemoizeOptions, Options} from './types';

// utils
import {compose, getArrayKey} from './utils';

export const createOnCacheOperation = (fn: ?Function): ?Function => {
  if (typeof fn === 'function') {
    return (cache: Cache, _microMemoizeOptions: MicroMemoizeOptions, memoized: Function): void => {
      // $FlowIgnore fn is a function if this is hit
      return fn(memoized.cache, memoized.options, memoized);
    };
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
export const getIsEqual = ({equals, isDeepEqual, isReact}: Options): Function => {
  return equals || (isDeepEqual && deepEqual) || (isReact && shallowEqual) || sameValueZeroEqual;
};

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

  let transformKey: ?Function;

  if (typeof maxArgs === 'number') {
    transformKey = createGetInitialArgs(maxArgs);
  }

  if (isReact) {
    transformKey = compose(createGetInitialArgs(2), transformKey);
  }

  if (typeof transformArgs === 'function') {
    transformKey = compose(getArrayKey, transformArgs, transformKey);
  }

  if (isSerialized) {
    transformKey = compose(getSerializerFunction(options), transformKey);
  }

  return transformKey;
};
