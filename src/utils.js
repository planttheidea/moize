// @flow

export const INFINITY = Number.POSITIVE_INFINITY;

/**
 * @private
 *
 * @function splice
 *
 * @description
 * faster version of splicing a single item from the array
 *
 * @param {Array<*>} array array to splice from
 * @param {number} index index to splice at
 */
export const splice = (array: Array<any>, index: number) => {
  const length: number = array.length;

  if (!length) {
    return;
  }

  while (index < length) {
    array[index] = array[index + 1];
    index++;
  }

  array.length = length - 1;
};

/**
 * @private
 *
 * @function unshift
 *
 * @description
 * faster version of unshifting a single item into an array
 *
 * @param {Array<*>} array array to unshift into
 * @param {*} item item to unshift into array
 */
export const unshift = (array: Array<any>, item: number) => {
  let length: number = array.length;

  while (length) {
    array[length] = array[length - 1];
    length--;
  }

  array[0] = item;
};

/**
 * @private
 *
 * @function isComplexObject
 *
 * @description
 * is the object passed a complex object
 *
 * @param {*} object object to test if it is complex
 * @returns {boolean}
 */
const isComplexObject = (object: any): boolean => {
  return typeof object === 'object' && object !== null;
};

/**
 * @private
 *
 * @function createCustomReplacer
 *
 * @description
 * create a custom replacer for the stringification of circular objects
 *
 * @returns {function(string, any)}
 */
export const createCustomReplacer = () => {
  let cache: Array<Object> = [];

  /**
   * @private
   *
   * @function replacer
   *
   * @description
   * custom replacer that will return [Circular] if object already exists in cache, else the object itself
   *
   * @param {string} key object key to parse
   * @param {*} value object value to parse
   * @returns {*}
   */
  return (key: string, value: any) => {
    if (isComplexObject(value)) {
      if (!!~cache.indexOf(value)) {
        return '[Circular]';
      }

      cache.push(value);
    }

    return value;
  };
};

/**
 * @private
 *
 * @function getCacheKey
 *
 * @description
 * get the key used for storage in the method's cache
 *
 * @param {Array<*>} args arguments passed to the method
 * @param {function} serializer method used to serialize keys into a string
 * @param {boolean} isCircular whether the argument should be stringified as a circular object
 * @returns {*}
 */
export const getCacheKey = (args: Array<any>, serializer: Function, isCircular: boolean) => {
  if (args.length === 1) {
    return args[0];
  }

  return serializer(args, isCircular);
};

/**
 * @private
 *
 * @function getFunctionWithCacheAdded
 *
 * @description
 * add the caching mechanism to the function passed and return the function
 *
 * @param {function} fn method that will have the cache added to it
 * @param {Map|Object} cache caching mechanism that has get / set / has methods
 * @returns {Function} method that has cache mechanism added to it
 */
export const getFunctionWithCacheAdded = (fn: Function, cache: Map<any, any>|Object) => {
  fn.cache = cache;
  fn.usage = [];

  return fn;
};

/**
 * @private
 *
 * @function stringify
 *
 * @description
 * stringify with a custom replacer if circular, else use standard JSON.stringify
 *
 * @param {*} value value to stringify
 * @param {boolean} isCircular whether the value is a circular object or not
 * @returns {string} the stringified version of value
 */
export const stringify = (value: any, isCircular: boolean) => {
  if (isCircular) {
    return JSON.stringify(value, createCustomReplacer());
  }

  return JSON.stringify(value);
};

/**
 * @private
 *
 * @function getStringifiedArgument
 *
 * @description
 * get the stringified version of the argument passed
 *
 * @param {*} arg argument to stringify
 * @param {boolean} isCircular whether the argument should be stringified as a circular object
 * @returns {string}
 */
export const getStringifiedArgument = (arg: any, isCircular: boolean) => {
  return isComplexObject(arg) ? stringify(arg, isCircular) : arg;
};

/**
 * @private
 *
 * @function serializeArguments
 *
 * @description
 * serialize the arguments into a string
 *
 * @param {Array<*>} args arguments to serialize into string
 * @param {boolean} isCircular whether the argument should be stringified as a circular object
 * @returns {string} string of serialized arguments
 */
export const serializeArguments = (args: Array<any>, isCircular: boolean) => {
  const length: number = args.length;

  let index: number = -1,
      key: string = '|';

  while (++index < length) {
    key += `${getStringifiedArgument(args[index], isCircular)}|`;
  }

  return key;
};

/**
 * @private
 *
 * @function setExpirationOfCache
 *
 * @description
 * set the cache to expire after the maxAge passed (coalesced to 0)
 *
 * @param {function} fn memoized function with cache and usage storage
 * @param {*} key key in cache to expire
 * @param {number} maxAge number in ms to wait before expiring the cache
 */
export const setExpirationOfCache = (fn: Function, key: any, maxAge: number) => {
  const {
    cache,
    usage
  } = fn;

  const expirationTime = Math.max(maxAge, 0);

  setTimeout(() => {
    const index: number = usage.indexOf(key);

    splice(usage, index);
    cache.delete(key);
  }, expirationTime);
};

/**
 * @private
 *
 * @function setNewCachedValue
 *
 * @description
 * assign the new value to the key in the functions cache and return the value
 *
 * @param {function} fn method whose cache will have new value assigned
 * @param {*} key key in cache to assign value to
 * @param {*} value value to store in cache
 * @param {boolean} isPromise is the value a promise or not
 * @param {boolean} isMaxAgeFinite does the cache have a maxAge or not
 * @param {number} maxAge how long should the cache persist
 * @returns {any} value just stored in cache
 */
export const setNewCachedValue = (
  fn: Function,
  key: any,
  value: any,
  isPromise: boolean,
  isMaxAgeFinite: boolean,
  maxAge: number
) => {
  if (isPromise) {
    value.then((resolvedValue) => {
      fn.cache.set(key, resolvedValue);
    });
  } else {
    fn.cache.set(key, value);
  }

  if (isMaxAgeFinite) {
    setExpirationOfCache(fn, key, maxAge);
  }

  return value;
};


/**
 * @private
 *
 * @function setUsageOrder
 *
 * @description
 * place the key passed at the front of the array, removing it from its current index if it
 * exists and removing the last item in the array if it is larger than maxSize
 *
 * @param {function} fn memoized function storing cache
 * @param {Map} fn.cache caching mechanism used by memoized function
 * @param {Array<*>} fn.usage array of keys in order of most recently used
 * @param {*} key key to place at the front of the array
 * @param {number} maxSize the maximum size of the cache
 */
export const setUsageOrder = (fn: Function, key: any, maxSize: number) => {
  const {
    cache,
    usage
  } = fn;
  const index: number = usage.indexOf(key);

  if (index !== 0) {
    if (index !== -1) {
      splice(usage, index);
    }

    unshift(usage, key);

    if (usage.length > maxSize) {
      const keyToRemove = usage[usage.length - 1];

      usage.pop();
      cache.delete(keyToRemove);
    }
  }
};
