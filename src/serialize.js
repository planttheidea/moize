// @flow

// cache
import Cache from './Cache';

// types
import type {Options} from './types';

// utils
import {
  isComplexObject,
  isFiniteAndPositiveInteger,
  isFunction,
  isValueObjectOrArray
} from './utils';

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
  const cache: Cache = new Cache();

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

    cache.add(value, path);

    if (Array.isArray(value)) {
      return value.map((item, itemIndex) => {
        return coalesceCircularReferences(item, `${path}[${itemIndex}]`);
      });
    }

    return Object.keys(value).reduce((object, name) => {
      object[name] = coalesceCircularReferences(
        value[name],
        `${path}[${JSON.stringify(name)}]`
      );

      return object;
    }, {});
  };

  return coalesceCircularReferences(object, '$');
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
    return JSON.stringify(value, replacer);
  } catch (exception) {
    return JSON.stringify(decycle(value), replacer);
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
  return isComplexObject(arg) || isFunction(arg)
    ? stringify(arg, replacer)
    : arg;
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
export const createArgumentSerializer = ({
  maxArgs,
  serializeFunctions
  }: Options): Function => {
  const replacer: ?Function = serializeFunctions ? customReplacer : null;
  const hasMaxArgs: boolean = isFiniteAndPositiveInteger(maxArgs);

  return (args: Array<any>): string => {
    const length: number = hasMaxArgs ? maxArgs : args.length;

    let index: number = -1,
        key: string = '|',
        value: any;

    while (++index < length) {
      value = getStringifiedArgument(args[index], replacer);

      if (value) {
        key += `${value}|`;
      }
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
 * @param {Options} options the options passed to the moized function
 * @returns {function} the function to use in serializing the arguments
 */
export const getSerializerFunction = (options: Options): Function => {
  return isFunction(options.serializer)
    ? options.serializer
    : createArgumentSerializer(options);
};
