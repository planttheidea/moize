// @flow

// cache
import Cache from './Cache';

// constants
import {
  ARRAY_OBJECT_CLASS,
  CACHE_IDENTIFIER,
  FUNCTION_TYPEOF,
  FUNCTION_NAME_REGEXP,
  GOTCHA_OBJECT_CLASSES,
  OBJECT_TYPEOF,
  STATIC_PROPERTIES_TO_PASS,
  STATIC_PROPERTIES_TO_PASS_LENGTH
} from './constants';

// types
import type {
  KeyIterator,
  ListItem,
  Options
} from './types';

export const jsonStringify: Function = JSON.stringify;
export const keys: Function = Object.keys;
export const toString: Function = Object.prototype.toString;

/**
 * @private
 *
 * @function addStaticPropertiesToFunction
 *
 * @description
 * add static properties to the memoized function if they exist on the original
 *
 * @param {function} originalFunction the function to be memoized
 * @param {function} memoizedFn the higher-order memoized function
 * @returns {function} memoizedFn with static properties added
 */
export const addStaticPropertiesToFunction = (originalFunction: Function, memoizedFn: Function): Function => {
  let index: number = STATIC_PROPERTIES_TO_PASS_LENGTH,
      property: string;

  while (index--) {
    property = STATIC_PROPERTIES_TO_PASS[index];

    if (originalFunction[property]) {
      memoizedFn[property] = originalFunction[property];
    }
  }

  return memoizedFn;
};

/**
 * @private
 *
 * @function compose
 *
 * @description
 * method to compose functions and return a single function
 *
 * @param {...Array<function>} functions the functions to compose
 * @returns {function(...Array<*>): *} the composed function
 */
export const compose = (...functions: Array<Function>): Function => {
  return functions.reduce((f: Function, g: Function): Function => {
    return (...args: Array<any>): any => {
      return f(g(...args));
    };
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
    if (!fn(array[index], index)) {
      return false;
    }
  }

  return true;
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
 * @function isCache
 *
 * @description
 * is the object passed an instance of the native Cache implementation
 *
 * @param {*} object object to test
 * @returns {boolean} is the object an instance of Cache
 */
export const isCache = (object: any): boolean => {
  return !!object[CACHE_IDENTIFIER];
};

/**
 * @private
 *
 * @function createCurriableOptionMethod
 *
 * @description
 * create a method that will curry moize with the option + value passed
 *
 * @param {function} fn the method to call
 * @param {string} option the name of the option to apply
 * @param {*} value the value to assign to option
 * @returns {function} the moizer with the option pre-applied
 */
export const createCurriableOptionMethod = (fn: Function, option: string): Function => {
  return function(value: any): Function {
    return fn({
      [option]: value
    });
  };
};

/**
 * @private
 *
 * @function createPluckFromInstanceList
 *
 * @description
 * get a property from the list on the cache
 *
 * @param {{list: Array<Object>}} cache cache whose list to map over
 * @param {string} key key to pluck from list
 * @returns {Array<*>} array of values plucked at key
 */
export const createPluckFromInstanceList = (cache: Cache, key: string): Function => {
  return !isCache(cache) ? () => {} : (): Array<any> => {
    return cache.list.map((item: ListItem) => {
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
  const match: ?Array<string> = fn.toString().match(FUNCTION_NAME_REGEXP);

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
 * @function isArrayFallback
 *
 * @description
 * provide fallback for native Array.isArray test
 *
 * @param {*} object object to test if it is an array
 * @returns {boolean} is the object passed an array or not
 */
export const isArrayFallback = function(object: any): boolean {
  return toString.call(object) === ARRAY_OBJECT_CLASS;
};

/**
 * @private
 *
 * @function isArray
 *
 * @description
 * isArray function to use internally, either the native one or fallback
 *
 * @param {*} object object to test if it is an array
 * @returns {boolean} is the object passed an array or not
 */
export const isArray = Array.isArray || isArrayFallback;

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
 * @function isPlainObject
 *
 * @description
 * is the object passed a plain object or not
 *
 * @param {*} object object to test
 * @returns {boolean} is it a plain object
 */
export const isPlainObject = (object: any): boolean => {
  return isComplexObject(object) && object.constructor === Object;
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
  let cache: Cache = new Cache();

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
    if (!isValueObjectOrArray(value)) {
      return value;
    }

    if (cache.has(value)) {
      return {
        $ref: cache.get(value)
      };
    }

    cache.set(value, path);

    if (isArray(value)) {
      return value.map((item, itemIndex) => {
        return coalesceCircularReferences(item, `${path}[${itemIndex}]`);
      });
    }

    return keys(value).reduce((object, name) => {
      object[name] = coalesceCircularReferences(value[name], `${path}[${JSON.stringify(name)}]`);

      return object;
    }, {});
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
 * @param {Cache} cache caching mechanism for method
 * @param {*} key key to delete
 * @param {boolean} [isKeyLastItem=false] should the key be the last item in the LRU list
 */
export const deleteItemFromCache = (cache: Cache, key: any, isKeyLastItem: boolean = false) => {
  if (isCache(cache) && isKeyLastItem) {
    key = cache.list[cache.list.length - 1].key;
  }

  if (cache.has(key)) {
    cache.delete(key);
  }
};

/**
 * @private
 *
 * @function isKeyShallowEqualWithArgs
 *
 * @description
 * is the value passed shallowly equal with the args
 *
 * @param {*} value the value to compare
 * @param {Array<*>} args the args to test
 * @returns {boolean} are the args shallow equal to the value
 */
export const isKeyShallowEqualWithArgs = (value: any, args: Array<any>): boolean => {
  return !!(value && value.isMultiParamKey) && value.key.length === args.length && every(args, (arg, index) => {
    return arg === value.key[index];
  });
};

/**
 * @private
 *
 * @function getMultiParamKey
 *
 * @description
 * get the multi-parameter key that either matches a current one in state or is the same as the one passed
 *
 * @param {Cache} cache cache to compare args to
 * @param {Array<*>} args arguments passed to moize get key
 * @returns {Array<*>} either a matching key in cache or the same key as the one passed
 */
export const getMultiParamKey = (cache: Cache, args: Array<any>): Array<any> => {
  if (isKeyShallowEqualWithArgs(cache.lastItem, args)) {
    // $FlowIgnore cache.lastItem exists
    return cache.lastItem.key;
  }

  const iterator = cache.getKeyIterator();

  let iteration: Object;

  while ((iteration = iterator.next()) && !iteration.done) {
    if (isKeyShallowEqualWithArgs(iteration, args)) {
      return iteration.key;
    }
  }

  // $FlowIgnore ok to add key to array object
  args.isMultiParamKey = true;

  return args;
};

/**
 * @private
 *
 * @function createAddPropertiesToFunction
 *
 * @description
 * add the caching mechanism to the function passed and return the function
 *
 * @param {Cache} cache caching mechanism that has get / set / has methods
 * @param {function} originalFunction function to get the name of
 * @returns {function(function): function} method that has cache mechanism added to it
 */
export const createAddPropertiesToFunction = (cache: Cache, originalFunction: Function, options: Options): Function => {
  return (fn: Function): Function => {
    fn.cache = cache;
    fn.displayName = `Memoized(${getFunctionName(originalFunction)})`;
    fn.isMemoized = true;
    fn.options = options;
    fn.originalFunction = originalFunction;

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
      if (!cache.get(key) && getMultiParamKey(cache, key) === key) {
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
      const key = args.length === 1 && args[0].isMultiParamKey ? args[0] : getMultiParamKey(cache, args);

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

    return addStaticPropertiesToFunction(originalFunction, fn);
  };
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
 * @function getIndexOfKey
 *
 * @description
 * get the index of the key in the map
 *
 * @param {Cache} cache cache to iterate over
 * @param {*} key key to find in list
 * @returns {number} index location of key in list
 */
export const getIndexOfKey = (cache: Cache, key: any): number => {
  const iterator: KeyIterator = cache.getKeyIterator();

  let iteration: Object;

  while ((iteration = iterator.next()) && !iteration.done) {
    if (iteration.key === key) {
      return iteration.index;
    }
  }

  return -1;
};

/**
 * @private
 *
 * @function getKeyIteratorObject
 *
 * @description
 * get the object that is returned in the key iterator
 *
 * @param {ListItem} listItem the item in the list being iterated
 * @param {boolean} listItem.isMultiParamKey is the key a multi-parameter key
 * @param {*} listItem.key the key currently stored
 * @param {number} index the index of the iterator
 * @returns {{index: number, isMultiParamKey: boolean, key: *}} the parameters as an object
 */
export const getKeyIteratorObject = (listItem: ListItem, index: number): Object => {
  return {
    index,
    isMultiParamKey: listItem.isMultiParamKey,
    key: listItem.key
  };
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
  return isFunction(serializerFromOptions) ? serializerFromOptions :
    createArgumentSerializer(serializeFunctions, maxArgs);
};

/**
 * @private
 *
 * @function createGetCacheKey
 *
 * @description
 * get the key used for storage in the method's cache
 *
 * @param {Cache} cache cache where keys are stored
 * @param {boolean} serialize should the arguments be serialized into a string
 * @param {function} serializerFromOptions method used to serialize keys into a string
 * @param {boolean} serializeFunctions should functions be converted to string in serialization
 * @param {number} maxArgs the maximum number of arguments to use in the serialization
 * @returns {function(Array<*>): *}
 */
export const createGetCacheKey = (
  cache: Cache,
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
      return args.length > 1 ? getMultiParamKey(cache, args.slice(0, maxArgs)) : args[0];
    };
  }

  return (args: Array<any>): any => {
    return args.length > 1 ? getMultiParamKey(cache, args) : args[0];
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
 * @returns {function(Cache, Array<*>): void} setExpirationOfCache method
 */
export const createSetExpirationOfCache = (maxAge: number) => {
  return (cache: Cache, key: Array<any>) => {
    setTimeout(() => {
      deleteItemFromCache(cache, key);
    }, maxAge);
  };
};

/**
 * @private
 *
 * @function createPromiseRejecter
 *
 * @description
 * create method that will reject the promise and delete the key from cache
 *
 * @param {Cache} cache cache to update
 * @param {*} key key to delete from cache
 * @param {function} PromiseLibrary the promise library used
 * @returns {function} the rejecter function for the promise
 */
export const createPromiseRejecter = (
  cache: Cache,
  key: any,
  PromiseLibrary: Function
): Function => {
  return (exception: Error) => {
    cache.delete(key);

    return PromiseLibrary.reject(exception);
  };
};

/**
 * @private
 *
 * @function createPromiseResolver
 *
 * @description
 * create method that will resolve the promise and update the key in cache
 *
 * @param {Cache} cache cache to update
 * @param {*} key key to update in cache
 * @param {boolean} hasMaxAge should the cache expire after some time
 * @param {function} setExpirationOfCache function to set the expiration of cache
 * @param {function} PromiseLibrary the promise library used
 * @returns {function} the resolver function for the promise
 */
export const createPromiseResolver = (
  cache: Cache,
  key: any,
  hasMaxAge: boolean,
  setExpirationOfCache: Function,
  PromiseLibrary: Function
): Function => {
  return (resolvedValue: any) => {
    cache.updateItem(key, PromiseLibrary.resolve(resolvedValue));

    if (hasMaxAge) {
      setExpirationOfCache(cache, key);
    }

    return resolvedValue;
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
 * @param {Cache} cache the cache to assign the value to at key
 * @param {boolean} isPromise is the value a promise or not
 * @param {number} maxAge how long should the cache persist
 * @param {number} maxSize the maximum number of values to store in cache
 * @param {Function} PromiseLibrary the library to use for resolve / reject
 * @returns {function(function, *, *): *} value just stored in cache
 */
export const createSetNewCachedValue = (
  cache: Cache,
  isPromise: boolean,
  maxAge: number,
  maxSize: number,
  PromiseLibrary: Function
): Function => {
  const hasMaxAge: boolean = isFiniteAndPositive(maxAge);
  const hasMaxSize: boolean = isFiniteAndPositive(maxSize);
  const setExpirationOfCache: Function = createSetExpirationOfCache(maxAge);

  if (isPromise) {
    return (key: any, value: any): Promise<any> => {
      const promiseResolver = createPromiseResolver(cache, key, hasMaxAge, setExpirationOfCache, PromiseLibrary);
      const promiseRejecter = createPromiseRejecter(cache, key, PromiseLibrary);

      const handler = value.then(promiseResolver, promiseRejecter);

      cache.set(key, handler);

      if (hasMaxSize && cache.size > maxSize) {
        deleteItemFromCache(cache, undefined, true);
      }

      return handler;
    };
  }

  return (key: any, value: any): any => {
    cache.set(key, value);

    if (hasMaxAge) {
      setExpirationOfCache(cache, key);
    }

    if (hasMaxSize && cache.size > maxSize) {
      deleteItemFromCache(cache, undefined, true);
    }

    return value;
  };
};
