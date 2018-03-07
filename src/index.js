// @flow

// external dependencies
import memoize from 'micro-memoize';

// constants
import {DEFAULT_OPTIONS} from './constants';

// instance
import {augmentMoizeInstance} from './instance';

// is equal
import {getIsEqual} from './isEqual';

// max age
import {getMaxAgeOptions} from './maxAge';

// transform key
import {getTransformKey} from './transformKey';

// types
import type {Expiration, MicroMemoizeOptions, Options} from './types';

// utils
import {compose} from './utils';

function moize(fn: Function | Object, options: Options = DEFAULT_OPTIONS): Function {
  if (typeof fn === 'object') {
    return (curriedFn: Function | Object, curriedOptions: Object = {}) => {
      return typeof curriedFn === 'function'
        ? // $FlowIgnore fn is actually an object of options
        moize(curriedFn, Object.assign({}, fn, curriedOptions))
        : // $FlowIgnore fn is actually an object of options
        moize(Object.assign({}, fn, curriedFn));
    };
  }

  const coalescedOptions: Options = Object.assign({}, DEFAULT_OPTIONS, options);
  const expirations: Array<Expiration> = [];

  const {
    equals: equalsIgnored,
    isPromise,
    isReact: isReactIgnored,
    isSerialized: isSerialzedIgnored,
    maxAge: maxAgeIgnored,
    maxArgs: maxArgsIgnored,
    maxSize,
    onCacheAdd,
    onCacheChange: onCacheChangeIgnored,
    onCacheHit: onCacheHitIgnored,
    onExpire: onExpireIgnored,
    shouldSerializeFunctions: shouldSerializeFunctionsIgnored,
    serializer: serializerIgnored,
    transformArgs: transformArgsIgnored,
    updateExpire: updateExpireIgnored,
    ...customOptions
  } = coalescedOptions;

  const isEqual: Function = getIsEqual(coalescedOptions);
  const {onCacheChange, onCacheHit} = getMaxAgeOptions(expirations, coalescedOptions, isEqual);
  const transformKey: ?Function = getTransformKey(coalescedOptions);

  const microMemoizeOptions: MicroMemoizeOptions = Object.assign({}, customOptions, {
    isEqual,
    isPromise,
    maxSize,
    onCacheAdd,
    onCacheChange,
    onCacheHit,
    transformKey
  });

  return augmentMoizeInstance(memoize(fn, microMemoizeOptions), {
    expirations,
    options: coalescedOptions,
    originalFunction: fn
  });
}

moize.compose = compose;

moize.deep = moize({isDeepEqual: true});

moize.isMoized = (fn: any): boolean => {
  return typeof fn === 'function' && fn.isMoized;
};

moize.maxAge = (maxAge: number): Function => {
  return moize({maxAge});
};

moize.maxArgs = (maxArgs: number): Function => {
  return moize({maxArgs});
};

moize.maxSize = (maxSize: number): Function => {
  return moize({maxSize});
};

moize.promise = moize({isPromise: true});

moize.react = moize({isReact: true});

moize.reactSimple = moize({isReact: true, maxSize: 1});

moize.serialize = moize({isSerialized: true});

moize.simple = moize.maxSize(1);

export default moize;
