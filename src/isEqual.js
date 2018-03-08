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
export const getIsEqual = ({equals, isDeepEqual, isReact}: Options): Function => {
  return equals || (isDeepEqual && deepEqual) || (isReact && shallowEqual) || sameValueZeroEqual;
};
