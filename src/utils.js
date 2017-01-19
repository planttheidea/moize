// @flow

import Map from './Map';

const keys = Object.keys;
const toString = Object.prototype.toString;
const jsonStringify = JSON.stringify;

export

const ARRAY_OBJECT_CLASS = '[object Array]';
const OBJECT_TYPEOF = 'object';

const GOTCHA_OBJECT_CLASSES = [
  Boolean,
  Date,
  Number,
  RegExp,
  String
];
const GOTCHA_OBJECT_CLASSES_LENGTH = GOTCHA_OBJECT_CLASSES.length;

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
 * @returns {Array<*>} array minus the item removed
 */
export const splice = (array: Array<any>, index: number): Array<any> => {
  const length: number = array.length;

  if (!length) {
    return array;
  }

  while (index < length) {
    array[index] = array[index + 1];
    index++;
  }

  array.length = length - 1;

  return array;
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
 * @returns {Array<*>} array plus the item added to the front
 */
export const unshift = (array: Array<any>, item: number): Array<any> => {
  let length: number = array.length;

  while (length) {
    array[length] = array[length - 1];
    length--;
  }

  array[0] = item;

  return array;
};

/**
 * @private
 *
 * @function isArray
 *
 * @description
 * provide fallback for native Array.isArray test
 *
 * @param {*} object object to test if it is an array
 * @returns {boolean} is the object passed an array or not
 */
export const isArray = Array.isArray || function(object: any): boolean {
 return toString.call(object) === ARRAY_OBJECT_CLASS;
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
export const isComplexObject = (object: any): boolean => {
  return typeof object === OBJECT_TYPEOF && object !== null;
};

/**
 * @private
 *
 * @function isValueObjectOrArray
 *
 * @description
 * check if the object is actually an object or array
 *
 * @param {*} object object to test
 * @returns {boolean} is the object an object or array
 */
export const isValueObjectOrArray = (object: any): boolean => {
  if (!isComplexObject(object)) {
    return false;
  }

  let index: number = -1;

  while (++index < GOTCHA_OBJECT_CLASSES_LENGTH) {
    if (object instanceof GOTCHA_OBJECT_CLASSES[index]) {
      return false;
    }
  }

  return true;
};

/**
 * @private
 *
 * @function customReplacer
 *
 * @description
 * custom replacer for the stringify function
 *
 * @param {string} key key in json object
 * @param {*} value value in json object
 * @returns {*} if function then toString of it, else the value itself
 */
export const customReplacer = (key: string, value: any): any => {
  return typeof value === 'function' ? `${value}` : value;
};

/**
 * @private
 *
 * @function decycle
 *
 * @description
 * ES2015-ified version of cycle.decyle
 *
 * @param {*} object object to stringify
 * @returns {string} stringified value of object
 */
export const decycle = (object: any): string => {
  // $FlowIgnore: map type
  let map: Map = new Map();

  /**
   * @private
   *
   * @function coalesceCircularReferences
   *
   * @description
   * recursive method to replace any circular references with a placeholder
   *
   * @param {*} value value in object to decycle
   * @param {string} path path to reference
   * @returns {*} clean value
   */
  const coalesceCircularReferences = (value: any, path: string): any => {
    if (isValueObjectOrArray(value)) {
      if (map.has(value)) {
        return {
          $ref: map.get(value)
        };
      }

      map.set(value, path);

      if (isArray(value)) {
        return value.map((item, itemIndex) => {
          return coalesceCircularReferences(item, `${path}[${itemIndex}]`);
        });
      }

      return keys(value).reduce((object, name) => {
        object[name] = coalesceCircularReferences(value[name], `${path}[${JSON.stringify(name)}]`);

        return object;
      }, {});
    }

    return value;
  };

  return coalesceCircularReferences(object, '$');
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
 * @param {boolean} serializeFunctions should functions be converted to string in serialization
 * @param {boolean} hasMaxArgs has the maxArgs option been applied
 * @param {number} maxArgs the maximum number of arguments to use in the serialization
 * @returns {*}
 */
export const getCacheKey = (
  args: Array<any>,
  serializer: Function,
  serializeFunctions: boolean,
  hasMaxArgs: boolean,
  maxArgs: number
) => {
  return args.length === 1 ? args[0] : serializer(args, serializeFunctions, hasMaxArgs, maxArgs);
};

/**
 * @private
 *
 * @function deleteItemFromCache
 *
 * @description
 * remove an item from cache and the usage list
 *
 * @param {Map|Object} cache caching mechanism for method
 * @param {Array<*>} usage order of key usage
 * @param {*} key key to delete
 */
export const deleteItemFromCache = (cache: Map<any, any>|Object, usage: Array<any>, key: any) => {
  const index: number = usage.indexOf(key);

  if (!!~index) {
    splice(usage, index);
    // $FlowIgnore: map type
    cache.delete(key);
  }
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

  /**
   * @private
   *
   * @function clear
   *
   * @description
   * clear the current cache for this method
   */
  fn.clear = () => {
    fn.cache.clear();
    fn.usage = [];
  };

  /**
   * @private
   *
   * @function delete
   *
   * @description
   * delete the cache for the key passed for this method
   *
   * @param {*} key key to remove from cache
   */
  fn.delete = (key: any) => {
    deleteItemFromCache(fn.cache, fn.usage, key);
  };

  /**
   * @private
   *
   * @function keys
   *
   * @description
   * get the list of keys currently in cache
   *
   * @returns {Array<*>}
   */
  fn.keys = (): Array<any> => {
    let array: Array<any> = [];

    fn.cache.forEach((value: any, key: any) => {
      array.push(key);
    });

    return array;
  };

  return fn;
};

/**
 * @private
 *
 * @function isNAN
 *
 * @description
 * test if the value is NaN
 *
 * @param {*} value value to test
 * @returns {boolean} is value NaN
 */
export const isNAN = (value: any): boolean => {
  return value !== value;
};

/**
 * @private
 *
 * @function isEqual
 *
 * @description
 * are the two values passed equal or both NaN
 *
 * @param {*} value1 first value to check equality for
 * @param {*} value2 second value to check equality for
 * @returns {boolean} are the two values equal
 */
export const isEqual = (value1: any, value2: any): boolean => {
  return value1 === value2 || (isNAN(value1) && isNAN(value2));
};

/**
 * @private
 *
 * @function isFiniteAndPositive
 *
 * @description
 * is the number passed finite and positive
 *
 * @param {number} number number to test for finiteness and positivity
 * @returns {boolean} is the number finite and positive
 */
export const isFiniteAndPositive = (number: number): boolean => {
  return number === ~~number && number > 0;
};

/**
 * @private
 *
 * @function isKeyLastItem
 *
 * @description
 * is the key passed the same key as the lastItem
 *
 * @param {{key: *, value: *}} lastItem the current lastItem in the Map
 * @param {*} key the key to match on
 * @returns {boolean} is the key the same as the LastItem
 */
export const isKeyLastItem = (lastItem: ?Object, key: any): boolean => {
  return !!lastItem && isEqual(lastItem.key, key);
};

/**
 * @private
 *
 * @function getIndexOfItemInMap
 *
 * @description
 * get the index of the key in the map
 *
 * @param {MapLike} map map to find key in
 * @param {*} key key to find in map
 * @returns {number} index location of key in list
 */
export const getIndexOfItemInMap = (map: Object, key: any): number => {
  let index: number = -1;

  while (++index < map.size) {
    if (isEqual(map.list[index].key, key)) {
      return index;
    }
  }

  return -1;
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
 * @param {function} [replacer] replacer to used in stringification
 * @returns {string} the stringified version of value
 */
export const stringify = (value: any, replacer: ?Function) => {
  try {
    return jsonStringify(value, replacer);
  } catch (exception) {
    return jsonStringify(decycle(value), replacer);
  }
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
 * @param {function} [replacer] replacer to used in stringification
 * @returns {string}
 */
export const getStringifiedArgument = (arg: any, replacer: ?Function) => {
  return isComplexObject(arg) ? stringify(arg, replacer) : arg;
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
 * @param {boolean} serializeFunctions should functions be converted to string in serialization
 * @param {boolean} hasMaxArgs is there a limit to the args to use when caching
 * @param {number} maxArgs maximum number of arguments to use for caching the key
 * @returns {string} string of serialized arguments
 */
export const serializeArguments = (
  args: Array<any>,
  serializeFunctions: boolean,
  hasMaxArgs: boolean,
  maxArgs: number
) => {
  const length: number = hasMaxArgs ? maxArgs : args.length;
  const replacer: ?Function = serializeFunctions ? customReplacer : undefined;

  let index: number = -1,
      key: string = '|';

  while (++index < length) {
    key += `${getStringifiedArgument(args[index], replacer)}|`;
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
  setTimeout(() => {
    deleteItemFromCache(fn.cache, fn.usage, key);
  }, maxAge);
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
 * @param {boolean} hasMaxAge does the cache have a maxAge or not
 * @param {number} maxAge how long should the cache persist
 * @returns {any} value just stored in cache
 */
export const setNewCachedValue = (
  fn: Function,
  key: any,
  value: any,
  isPromise: boolean,
  hasMaxAge: boolean,
  maxAge: number
) => {
  if (isPromise) {
    value.then((resolvedValue) => {
      fn.cache.set(key, resolvedValue);
    });
  } else {
    fn.cache.set(key, value);
  }

  if (hasMaxAge) {
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
  const index: number = fn.usage.indexOf(key);

  if (index !== 0) {
    if (!!~index) {
      splice(fn.usage, index);
    }

    unshift(fn.usage, key);

    if (fn.usage.length > maxSize) {
      deleteItemFromCache(fn.cache, fn.usage, fn.usage[fn.usage.length - 1]);
    }
  }
};
