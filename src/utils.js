// @flow

import Map from './Map';

const keys: Function = Object.keys;
const toString: Function = Object.prototype.toString;
const jsonStringify: Function = JSON.stringify;

const ARRAY_OBJECT_CLASS: string = '[object Array]';
const FUNCTION_TYPEOF: string = 'function';
const FUNCTION_NAME_REGEXP = /^\s*function\s+([^\(\s]*)\s*/;
const OBJECT_TYPEOF: string = 'object';

const GOTCHA_OBJECT_CLASSES: Array<Object> = [
  Boolean,
  Date,
  Number,
  RegExp,
  String
];

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
 * @function getFunctionNameViaRegexp
 *
 * @description
 * use regexp match on stringified function to get the function name
 *
 * @param {function} fn function to get the name of
 * @returns {string} function name
 */
export const getFunctionNameViaRegexp = (fn: Function): string => {
  const match = fn.toString().match(FUNCTION_NAME_REGEXP);

  return match ? match[1] : '';
};

/**
 * @private
 *
 * @function getFunctionName
 *
 * @description
 * get the function name, either from modern property or regexp match,
 * falling back to generic string
 *
 * @param {function} fn function to get the name of
 * @returns {string} function name
 */
export const getFunctionName = (fn: Function): string => {
  return fn.name || getFunctionNameViaRegexp(fn) || FUNCTION_TYPEOF;
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
 * @returns {boolean} is it a complex object
 */
export const isComplexObject = (object: any): boolean => {
  return typeof object === OBJECT_TYPEOF && object !== null;
};

/**
 * @private
 *
 * @function isFunction
 *
 * @description
 * is the object passed a function or not
 *
 * @param {*} object object to test
 * @returns {boolean} is it a function
 */
export const isFunction = (object: any): boolean => {
  return typeof object === FUNCTION_TYPEOF;
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
  return isComplexObject(object) && !GOTCHA_OBJECT_CLASSES.some((Class) => {
    return object instanceof Class;
  });
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
  return isFunction(value) ? `${value}` : value;
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
 * @function deleteItemFromCache
 *
 * @description
 * remove an item from cache and the usage list
 *
 * @param {Map|Object} cache caching mechanism for method
 * @param {Array<*>} usage order of key usage
 * @param {*} key key to delete
 */
export const deleteItemFromCache = (cache: any, usage: Array<any>, key: any) => {
  const index: number = usage.indexOf(key);

  if (!!~index) {
    splice(usage, index);
    cache.delete(key);
  }
};

/**
 * @private
 *
 * @function createAddPropertiesToFunction
 *
 * @description
 * add the caching mechanism to the function passed and return the function
 *
 * @param {Map|Object} cache caching mechanism that has get / set / has methods
 * @param {string} fn function to get the name of
 * @returns {function(function): function} method that has cache mechanism added to it
 */
export const createAddPropertiesToFunction = (cache: any, fn: Function): Function => {
  const functionName = getFunctionName(fn);
  const displayName = `Memoized(${functionName})`;

  return (fn: Function): Function => {
    fn.cache = cache;
    fn.displayName = displayName;
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
 * @param {Map} map map to find key in
 * @param {*} key key to find in map
 * @returns {number} index location of key in list
 */
export const getIndexOfItemInMap = (map: Map, key: any): number => {
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
 * @function createArgumentSerializer
 *
 * @description
 * create the internal argument serializer based on the options passed
 *
 * @param {boolean} serializeFunctions should functions be included in the serialization
 * @param {boolean} hasMaxArgs is there a cap on the number of arguments used in serialization
 * @param {number} maxArgs the cap on the number of arguments used in serialization
 * @returns {function(...Array<*>): string} argument serialization method
 */
export const createArgumentSerializer = (
  serializeFunctions: boolean,
  hasMaxArgs: boolean,
  maxArgs: number
): Function => {
  const replacer: ?Function = serializeFunctions ? customReplacer : undefined;

  return (args: Array<any>): string => {
    const length: number = hasMaxArgs ? maxArgs : args.length;

    let index: number = -1,
        key: string = '|';

    while (++index < length) {
      key += `${getStringifiedArgument(args[index], replacer)}|`;
    }

    return key;
  };
};

/**
 * @private
 *
 * @function getSerializerFunction
 *
 * @description
 * based on the options passed, either use the serializer passed or generate the internal one
 *
 * @param {function} [serializerFromOptions] serializer function passed into options
 * @param {boolean} serializeFunctions should functions be included in the serialization
 * @param {boolean} hasMaxArgs is there a cap on the number of arguments used in serialization
 * @param {number} maxArgs the cap on the number of arguments used in serialization
 * @returns {function} the function to use in serializing the arguments
 */
export const getSerializerFunction = (
  serializerFromOptions: ?Function,
  serializeFunctions: boolean,
  hasMaxArgs: boolean,
  maxArgs: number
): Function => {
  // $FlowIgnore
  return isFunction(serializerFromOptions) ? serializerFromOptions : createArgumentSerializer(serializeFunctions, hasMaxArgs, maxArgs);
};

/**
 * @private
 *
 * @function createGetCacheKey
 *
 * @description
 * get the key used for storage in the method's cache
 *
 * @param {function} serializerFromOptions method used to serialize keys into a string
 * @param {boolean} serializeFunctions should functions be converted to string in serialization
 * @param {boolean} hasMaxArgs has the maxArgs option been applied
 * @param {number} maxArgs the maximum number of arguments to use in the serialization
 * @returns {function(Array<*>): *}
 */
export const createGetCacheKey = (
  serializerFromOptions: ?Function,
  serializeFunctions: boolean,
  hasMaxArgs: boolean,
  maxArgs: number
): Function => {
  const serializeArguments = getSerializerFunction(serializerFromOptions, serializeFunctions, hasMaxArgs, maxArgs);

  return (args: Array<any>): any => {
    return args.length === 1 ? args[0] : serializeArguments(args);
  };
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
 * @function createSetNewCachedValue
 *
 * @description
 * assign the new value to the key in the functions cache and return the value
 *
 * @param {boolean} isPromise is the value a promise or not
 * @param {boolean} hasMaxAge does the cache have a maxAge or not
 * @param {number} maxAge how long should the cache persist
 * @returns {function(function, *, *): *} value just stored in cache
 */
export const createSetNewCachedValue = (
  isPromise: boolean,
  hasMaxAge: boolean,
  maxAge: number
): Function => {
  return (fn: Function, key: any, value: any): any => {
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
 * @param {number} maxSize the maximum size of the cache
 * @returns {function(function, *): *} function to set the usage order
 */
export const createSetUsageOrder = (maxSize: number): Function => {
  return (fn: Function, key: any): void => {
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
};
