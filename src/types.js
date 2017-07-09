/**
 * @private
 *
 * @typedef {Object} Options
 *
 * @property {Object} [cache] a custom cache to use in place of the Cache class
 * @property {boolean} [isPromise] is the return value a promise or not
 * @property {number} [maxAge] the TTL for the return value to live in cache
 * @property {number} [maxArgs] the maximum number of arguments to use as the cache key
 * @property {number} [maxSize] the maximum size of values to store in cache
 * @property {boolean} [serialize] should the parameters be serialized for the cache key
 * @property {boolean} [serializeFunctions] should a custom replacer that includes functions be used in serialization
 * @property {function} [serializer] a custom serializer to use in place of the default
 */
export type Options = {
  cache?: Object,
  isPromise?: boolean,
  maxAge?: number,
  maxArgs?: number,
  maxSize?: number,
  promiseLibrary?: Function,
  serialize?: boolean,
  serializeFunctions?: boolean,
  serializer?: Function
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
  key: any,
  isMultiParamKey: boolean,
  value: any
};

/**
 * @private
 *
 * @typedef {Object} IteratorDone
 *
 * @property {true} done is the iterator complete
 */
export type IteratorDone = {
  done: true
};

/**
 * @private
 *
 * @typedef {Object} KeyIterator
 *
 * @property {function} next the function to call to get the next iteration
 */
export type KeyIterator = {
  next: Function
};

/**
 * @private
 *
 * @typedef {Object} Iteration
 *
 * @property {number} index the index of the iteration
 * @property {boolean} isMultiParamKey is the iteration key a multi-parameter key
 * @property {*} key the iteration key
 */
export type Iteration = {
  index: number,
  isMultiParamKey: boolean,
  key: any
};
