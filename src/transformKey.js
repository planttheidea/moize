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

  let transformKey;

  if (typeof maxArgs === 'number') {
    transformKey = createGetInitialArgs(maxArgs);
  }

  if (isReact) {
    const reactTransformer = createGetInitialArgs(2);

    transformKey = transformKey ? compose(reactTransformer, transformKey) : transformKey;
  }

  if (isSerialized) {
    const serializeTransformer = getSerializerFunction(options);

    transformKey = transformKey ? compose(serializeTransformer, transformKey) : serializeTransformer;
  }

  if (typeof transformArgs === 'function') {
    transformKey = transformKey ? compose(transformArgs, transformKey) : transformArgs;
  }

  return transformKey;
};
