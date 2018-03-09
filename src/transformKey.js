// @flow

// max args
import {createGetInitialArgs} from './maxArgs';

// serialize
import {getSerializerFunction} from './serialize';

// types
import type {Options} from './types';

// utils
import {compose} from './utils';

/**
 * @function getArrayKey
 *
 * @description
 * return the transformed key as an array
 *
 * @param {any} key the transformed key
 * @returns {Array<any>} the key as an array
 */
export const getArrayKey = (key: any): Array<any> => {
  return Array.isArray(key) ? key : [key];
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
    transformKey = compose(getArrayKey, getSerializerFunction(options), transformKey);
  }

  return transformKey;
};
