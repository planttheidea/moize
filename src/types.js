// @flow

/* eslint-disable max-len */

/**
 * @typedef {Object} Cache
 *
 * @property {Array<Array<any>>} keys the arguments passed which yield a specific value
 * @property {Array<any>} values the values based on the arguments passed
 */
export type Cache = {
  keys: Array<any>,
  values: Array<any>
};

/**
 * @typedef {Object} Expiration
 *
 * @property {function} expirationMethod the method that will expire the cache entry
 * @property {Array<any>} key the key to expire
 * @property {TimeoutID} timeoutId the ID of the timeout
 */
export type Expiration = {
  expirationMethod: Function,
  key: Array<any>,
  timeoutId: TimeoutID
};

/**
 * @typedef {Object} MicroMemoizeOptions
 *
 * @property {function} isEqual a custom equality comparator used for key matching
 * @property {boolean} isPromise is the return value a promise or not
 * @property {number} maxSize the maximum size of values to store in cache
 * @property {function} [onCacheAdd] method called when cache has been added to
 * @property {function} [onCacheChange] method called when the cache has been changed in some way
 * @property {function} [onCacheHit] method called when an existing cache item was retrieved
 * @property {function} [transformKey] method to transform the arguments
 */
export type MicroMemoizeOptions = {
  isEqual: Function,
  isPromise: boolean,
  maxSize: number,
  onCacheAdd: ?Function,
  onCacheChange: ?Function,
  onCacheHit: ?Function,
  transformKey: ?Function
};

/**
 * @typedef {Object} Options
 *
 * @property {function} [equals] a custom equality comparator used for key matching
 * @property {boolean} isPromise is the return value a promise or not
 * @property {boolean} isSerialized should the parameters be serialized for the cache key
 * @property {number} [maxAge] the TTL for the return value to live in cache
 * @property {number} [maxArgs] the maximum number of arguments to use as the cache key
 * @property {number} maxSize the maximum size of values to store in cache
 * @property {function} [onCacheAdd] method called when cache item is added
 * @property {function} [onCacheChange] method called when cache is added to or reordered
 * @property {function} [onCacheHit] method called when existing cache item is retrieved
 * @property {function} [onExpire] method to call when cache is expired
 * @property {string} [profileName] the name to use when profiling for statistics
 * @property {boolean} shouldSerializeFunctions should a custom replacer that includes functions be used in serialization
 * @property {function} [transformArgs] method to transform the arguments
 * @property {boolean} updateExpire should the expiration be updated when cache is hit
 */
export type Options = {
  equals?: Function,
  isDeepEqual?: boolean,
  isPromise?: boolean,
  isReact?: boolean,
  isSerialized?: boolean,
  maxAge?: number,
  maxArgs?: number,
  maxSize?: number,
  onCacheAdd?: Function,
  onCacheChange?: Function,
  onCacheHit?: Function,
  onExpire?: Function,
  profileName?: string,
  serializer?: Function,
  shouldSerializeFunctions?: boolean,
  transformArgs?: Function,
  updateExpire?: boolean
};

export type StatsProfile = {
  calls: number,
  hits: number
};

export type StatsObject = {
  calls: number,
  hits: number,
  profiles?: {
    [key: string]: StatsProfile
  },
  usage: string
};

export type StatsCache = {
  anonymousProfileNameCounter: number,
  isCollectingStats: boolean,
  profiles: {
    [key: string]: StatsProfile
  }
};

/* eslint-enable */
