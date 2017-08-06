// @flow

/**
 * @private
 *
 * @typedef {Object} Options
 *
 * @property {function} [equals] a custom equality comparator used for key matching
 * @property {boolean} isPromise is the return value a promise or not
 * @property {number} maxAge the TTL for the return value to live in cache
 * @property {number} maxArgs the maximum number of arguments to use as the cache key
 * @property {number} maxSize the maximum size of values to store in cache
 * @property {boolean} serialize should the parameters be serialized for the cache key
 * @property {boolean} serializeFunctions should a custom replacer that includes functions be used in serialization
 * @property {function} serializer a custom serializer to use in place of the default
 * @property {function} [transformArgs]
 */
export type Options = {
  equals: ?Function,
  isPromise: boolean,
  isReact: boolean,
  maxAge: number,
  maxArgs: number,
  maxSize: number,
  onExpire: ?Function,
  promiseLibrary: Function,
  serialize: boolean,
  serializeFunctions: boolean,
  serializer: Function,
  transformArgs: ?Function
};

/**
 * @private
 *
 * @typedef {Object} ListItem
 *
 * @property {*} key the key stored in cache
 * @property {boolean} isMultiParamKey is the key a multi-parameter key
 * @property {*} value the value assigned in cache to key
 */
export type ListItem = {
  key?: any,
  value?: any
};
