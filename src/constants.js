// @flow

// types
import type {Options} from './types';

/**
 * @private
 *
 * @constant {Object} DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Options = {
  equals: undefined,
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isSerialized: false,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: Infinity,
  onExpire: undefined,
  profileName: undefined,
  serializer: undefined,
  shouldSerializeFunctions: false,
  transformArgs: undefined,
  updateExpire: false
};
