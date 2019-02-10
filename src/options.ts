// external dependencies
import {
  deepEqual,
  sameValueZeroEqual,
  shallowEqual,
} from 'fast-equals';
// eslint-disable-next-line no-unused-vars
import * as MicroMemoize from 'micro-memoize';

// constants
import { DEFAULT_OPTIONS_KEYS } from './constants';

// maxArgs
import { createGetInitialArgs } from './maxArgs';

// serialize
import { getIsSerializedKeyEqual, getSerializerFunction } from './serialize';

// utils
import { compose, getArrayKey } from './utils';

interface MemoizedFunction extends Function {
  cache: MicroMemoize.Cache;
  options: MicroMemoize.Options
}

export function createOnCacheOperation(fn: (Function | void)): (Function | void) {
  if (typeof fn === 'function') {
    return function onCacheChange(
      _cache: Cache,
      _microMemoizeOptions: MicroMemoize.Options,
      memoized: MemoizedFunction,
    ) {
      return fn(memoized.cache, memoized.options, memoized);
    };
  }
}

export function getCustomOptions(options: Moize.Options) {
  const customOptions: {[key: string]: any} = {};

  for (const key in options) {
    if (!DEFAULT_OPTIONS_KEYS[key]) {
      // @ts-ignore
      customOptions[key] = options[key];
    }
  }

  return customOptions;
}

export function getIsEqual({ equals, isDeepEqual, isReact }: Moize.Options) {
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
}

export function getIsMatchingKey({ isSerialized, matchesKey }: Moize.Options) {
  if (matchesKey) {
    return matchesKey;
  }

  if (isSerialized) {
    return getIsSerializedKeyEqual;
  }
}

export function getTransformKey(options: Moize.Options) {
  return compose(
    options.isSerialized && getSerializerFunction(options),
    typeof options.transformArgs === 'function' && compose(
      getArrayKey,
      options.transformArgs,
    ),
    options.isReact && createGetInitialArgs(2),
    typeof options.maxArgs === 'number' && createGetInitialArgs(options.maxArgs),
  );
}
