// @flow

// max args
import {createGetInitialArgs} from './maxArgs';

// serialize
import {getSerializerFunction} from './serialize';

// types
import type {Options} from './types';

// utils
import {compose} from './utils';

export const getTransformKey = (options: Options): ?Function => {
  const {maxArgs, isReact, isSerialized, transformArgs} = options;

  let transformKey: ?Function;

  if (typeof maxArgs === 'number') {
    transformKey = createGetInitialArgs(maxArgs);
  }

  if (isReact) {
    transformKey = compose(createGetInitialArgs(2), transformKey);
  }

  if (isSerialized) {
    transformKey = compose(getSerializerFunction(options), transformKey);
  }

  if (typeof transformArgs === 'function') {
    transformKey = compose(transformArgs, transformKey);
  }

  return transformKey;
};
