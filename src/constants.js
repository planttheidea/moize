// @flow

/**
 * @constant {Object} DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Object = {
  equals: undefined,
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isSerialized: false,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: Infinity,
  onExpire: undefined,
  serializer: undefined,
  shouldSerializeFunctions: false,
  transformArgs: undefined,
  updateExpire: false
};
