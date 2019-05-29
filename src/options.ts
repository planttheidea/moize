import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';

import { createGetInitialArgs } from './maxArgs';
import { getSerializerFunction, getIsSerializedKeyEqual } from './serialize';
import { compose } from './utils';

import { Options } from './types';

export function getIsEqual(options: Options) {
  return (
    options.equals ||
    (options.isDeepEqual && deepEqual) ||
    (options.isReact && shallowEqual) ||
    sameValueZeroEqual
  );
}

export function getIsMatchingKey(options: Options) {
  return options.matchesKey || (options.isSerialized && getIsSerializedKeyEqual) || undefined;
}

export function getTransformKey(options: Options) {
  return compose(
    options.isSerialized && getSerializerFunction(options),
    options.transformArgs,
    options.isReact && createGetInitialArgs(2),
    typeof options.maxArgs === 'number' && createGetInitialArgs(options.maxArgs),
  );
}
