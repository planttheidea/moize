// @flow

import MapLike from './MapLike';

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

const STATIC_PROPERTIES_TO_PASS = [
  'contextTypes',
  'defaultProps',
  'propTypes'
];

/**
 * @private
 *
 * @function addStaticPropertiesToFunction
 *
 * @description
 * add static properties to the memoized function if they exist on the original
 *
 * @param {function} originalFn the function to be memoized
 * @param {function} memoizedFn the higher-order memoized function
 */
export const addStaticPropertiesToFunction = (originalFn: Function, memoizedFn: Function): void => {
  STATIC_PROPERTIES_TO_PASS.forEach((property) => {
    if (originalFn[property]) {
      memoizedFn[property] = originalFn[property];
    }
  });
};

/**
 * @private
 *
 * @function every
 *
 * @description
 * faster version of determining every item in array matches fn check
 *
 * @param {Array<*>} array array to test
 * @param {function} fn fn to test each item against
 * @returns {boolean} do all values match
 */
export const every = (array: Array<any>, fn: Function) => {
  let index: number = array.length;

  if (!index) {
    return true;
  }

  while (index--) {
    if (!fn(array[index], index, array)) {
      return false;
    }
  }

  return true;
};

/**
 * @private
 *
 * @function areArraysShallowEqual
 *
 * @description
 * test if the arrays are shallow equal in value
 *
 * @param {Array<*>} array1 first array to check
 * @param {Array<*>} array2 second array to check
 * @returns {boolean} are arrays shallow equal
 */
export const areArraysShallowEqual = (array1: Array<any>, array2: Array<any>): boolean => {
  return array1.length === array2.length && every(array1, (item: any, index: number) => {
    return item === array2[index];
  });
};

/**
 * @private
 *
 * @function splice
 *
 * @description
 * faster version of splicing a single item from the array
 *
 * @param {Array<*>} array array to splice from
 * @param {number} startingIndex index to splice at
 * @returns {Array<*>} array minus the item removed
 */
export const splice = (array: Array<any>, startingIndex: number): Array<any> => {
  const length: number = array.length;

  if (!length) {
    return array;
  }

  let index: number = startingIndex - 1;

  while (++index < length) {
    array[index] = array[index + 1];
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
 * @returns {*} the item just added to the array
 */
export const unshift = (array: Array<any>, item: any): any => {
  let index: number = array.length;

  while (index--) {
    array[index + 1] = array[index];
  }

  array[0] = item;

  return item;
};

/**
 * @private
 *
 * @function createPluckFromInstanceList
 *
 * @description
 * get a property from the list on the instance
 *
 * @param {{list: Array<Object>}} instance insatnce whose list to map over
 * @param {string} key key to pluck from list
 * @returns {Array<*>} array of values plucked at key
 */
export const createPluckFromInstanceList = (instance: Object, key: string): Function => {
  return (): Array<any> => {
    return instance.list.map((item) => {
      return item[key];
    });
  };
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
  return fn.displayName || fn.name || getFunctionNameViaRegexp(fn) || FUNCTION_TYPEOF;
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
  return isComplexObject(object) && every(GOTCHA_OBJECT_CLASSES, (Class) => {
    return !(object instanceof Class);
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
  let map: MapLike = new MapLike();

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
 * remove an item from cache
 *
 * @param {*} cache caching mechanism for method
 * @param {*} key key to delete
 */
export const deleteItemFromCache = (cache: any, key: any = cache.list[cache.list.length - 1].key) => {
  if (cache.has(key)) {
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
 * @param {*} cache caching mechanism that has get / set / has methods
 * @param {function} originalFn function to get the name of
 * @returns {function(function): function} method that has cache mechanism added to it
 */
export const createAddPropertiesToFunction = (cache: any, originalFn: Function): Function => {
  const displayName = `Memoized(${getFunctionName(originalFn)})`;

  return (fn: Function): Function => {
    fn.cache = cache;
    fn.displayName = displayName;
    fn.isMemoized = true;

    addStaticPropertiesToFunction(originalFn, fn);

    /**
     * @private
     *
     * @function add
     *
     * @description
     * manually add an item to cache if the key does not already exist
     *
     * @param {*} key key to use in cache
     * @param {*} value value to assign to key
     */
    fn.add = (key, value) => {
      if (!cache.get(key) && getKeyFromArguments(cache, key) === key) {
        cache.set(key, value);
      }
    };

    /**
     * @private
     *
     * @function clear
     *
     * @description
     * clear the current cache for this method
     */
    fn.clear = () => {
      cache.clear();
    };

    /**
     * @private
     *
     * @function delete
     *
     * @description
     * delete the cache for the key passed for this method
     *
     * @param {Array<*>} args combination of args to remove from cache
     */
    fn.delete = (...args: Array<any>) => {
      const key = args.length === 1 && args[0].isMultiParamKey ? args[0] : getKeyFromArguments(cache, args);

      deleteItemFromCache(cache, key);
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
    fn.keys = createPluckFromInstanceList(cache, 'key');

    /**
     * @private
     *
     * @function values
     *
     * @description
     * get the list of values currently in cache
     *
     * @returns {Array<*>}
     */
    fn.values = createPluckFromInstanceList(cache, 'value');

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
 * @function getIndexOfItemInMap
 *
 * @description
 * get the index of the key in the map
 *
 * @param {Array<*>} list list to find key in
 * @param {number} length length of the list passed
 * @param {*} key key to find in list
 * @returns {number} index location of key in list
 */
export const getIndexOfItemInMap = (list: Array<any>, length: number, key: any): number => {
  let index: number = -1;

  while (++index < length) {
    if (isEqual(list[index].key, key)) {
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
 * @param {number} maxArgs the cap on the number of arguments used in serialization
 * @returns {function(...Array<*>): string} argument serialization method
 */
export const createArgumentSerializer = (
  serializeFunctions: boolean,
  maxArgs: number
): Function => {
  const replacer: ?Function = serializeFunctions ? customReplacer : null;
  const hasMaxArgs: boolean = isFiniteAndPositive(maxArgs);

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
 * @param {number} maxArgs the cap on the number of arguments used in serialization
 * @returns {function} the function to use in serializing the arguments
 */
export const getSerializerFunction = (
  serializerFromOptions: ?Function,
  serializeFunctions: boolean,
  maxArgs: number
): Function => {
  // $FlowIgnore
  return isFunction(serializerFromOptions) ? serializerFromOptions : createArgumentSerializer(serializeFunctions, maxArgs);
};

/**
 * @private
 *
 * @function getKeyFromArguments
 *
 * @description
 * get the existing key from arguments if it is there, else return the new arguments
 *
 * @param {*} cache cache used to store arguments
 * @param {Array<*>} newArgs to test if shallow clone already exists in cache
 * @returns { Array<*>} array to use as key for cache
 */
export const getKeyFromArguments = (cache: any, newArgs: Array<any>): Array<any>  => {
  let index: number = -1,
      currentValue: Array<any>;

  while (++index < cache.size) {
    currentValue = cache.list[index];

    if (currentValue.isMultiParamKey && areArraysShallowEqual(currentValue.key, newArgs)) {
      return currentValue.key;
    }
  }

  // $FlowIgnore ok to add key to array object
  newArgs.isMultiParamKey = true;

  return newArgs;
};

/**
 * @private
 *
 * @function createGetCacheKey
 *
 * @description
 * get the key used for storage in the method's cache
 *
 * @param {*} cache cache where keys are stored
 * @param {boolean} serialize should the arguments be serialized into a string
 * @param {function} serializerFromOptions method used to serialize keys into a string
 * @param {boolean} serializeFunctions should functions be converted to string in serialization
 * @param {number} maxArgs the maximum number of arguments to use in the serialization
 * @returns {function(Array<*>): *}
 */
export const createGetCacheKey = (
  cache: any,
  serialize: boolean,
  serializerFromOptions: ?Function,
  serializeFunctions: boolean,
  maxArgs: number
): Function => {
  if (serialize) {
    const serializeArguments = getSerializerFunction(serializerFromOptions, serializeFunctions, maxArgs);

    return (args: Array<any>): any => {
      return serializeArguments(args);
    };
  }

  if (isFiniteAndPositive(maxArgs)) {
    return (args: Array<any>): any => {
      return args.length > 1 ? getKeyFromArguments(cache, args.slice(0, maxArgs)) : args[0];
    };
  }

  return (args: Array<any>): any => {
    return args.length > 1 ? getKeyFromArguments(cache, args) : args[0];
  };
};

/**
 * @private
 *
 * @function setExpirationOfCache
 *
 * @description
 * create function to set the cache to expire after the maxAge passed (coalesced to 0)
 *
 * @param {number} maxAge number in ms to wait before expiring the cache
 * @returns {function(function, Array<*>): void} setExpirationOfCache method
 */
export const createSetExpirationOfCache = (maxAge: number) => {
  return (fn: Function, key: Array<any>) => {
    setTimeout(() => {
      deleteItemFromCache(fn.cache, key);
    }, maxAge);
  };
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
 * @param {number} maxAge how long should the cache persist
 * @param {number} maxSize the maximum number of values to store in cache
 * @returns {function(function, *, *): *} value just stored in cache
 */
export const createSetNewCachedValue = (
  isPromise: boolean,
  maxAge: number,
  maxSize: number
): Function => {
  const hasMaxAge: boolean = isFiniteAndPositive(maxAge);
  const hasMaxSize: boolean = isFiniteAndPositive(maxSize);
  const setExpirationOfCache: Function = createSetExpirationOfCache(maxAge);

  if (isPromise) {
    return (fn: Function, key: any, value: any): any => {
      value.then((resolvedValue) => {
        fn.cache.set(key, resolvedValue);

        if (hasMaxSize && fn.cache.list.length > maxSize) {
          deleteItemFromCache(fn.cache);
        }
      });

      if (hasMaxAge) {
        setExpirationOfCache(fn, key);
      }

      return value;
    };
  }

  return (fn: Function, key: any, value: any): any => {
    fn.cache.set(key, value);

    if (hasMaxAge) {
      setExpirationOfCache(fn, key);
    }

    if (hasMaxSize && fn.cache.list.length > maxSize) {
      deleteItemFromCache(fn.cache);
    }

    return value;
  };
};
