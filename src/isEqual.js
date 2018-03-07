// @flow

// external dependencies
import {deepEqual, sameValueZeroEqual, shallowEqual} from 'fast-equals';

// types
import type {Options} from './types';

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
