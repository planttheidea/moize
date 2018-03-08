// @flow

// external dependencies
import {deepEqual, sameValueZeroEqual, shallowEqual} from 'fast-equals';

// types
import type {Options} from './types';

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
export const getIsEqual = (options: Options): Function => {
  const {equals, isDeepEqual, isReact} = options;

  if (equals) {
    return equals;
  }

  if (isDeepEqual) {
    return deepEqual;
  }

  if (isReact) {
    return shallowEqual;
  }

  return sameValueZeroEqual;
};
