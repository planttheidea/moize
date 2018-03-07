// @flow

// external dependencies
import stringifySafe from 'json-stringify-safe';

// types
import type {Options} from './types';

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
    return stringifySafe(value, replacer);
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
 * @returns {string} the stringified argument
 */
export const getStringifiedArgument = (arg: any, replacer: ?Function) => {
  const typeOfArg: string = typeof arg;

  return arg && (typeOfArg === 'object' || typeOfArg === 'function') ? stringify(arg, replacer) : arg;
};

/**
 * @private
 *
 * @function createArgumentSerializer
 *
 * @description
 * create the internal argument serializer based on the options passed
 *
 * @param {Object} options the options passed
 * @param {boolean} options.serializeFunctions should functions be included in the serialization
 * @param {number} options.maxArgs the cap on the number of arguments used in serialization
 * @returns {function(...Array<*>): string} argument serialization method
 */
export const createArgumentSerializer = (options: Options): Function => {
  const replacer: ?Function = options.shouldSerializeFunctions ? customReplacer : null;

  return (args: Array<any>): string => {
    let key: string = '|';

    for (let index: number = 0; index < args.length; index++) {
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
 * @param {Options} options the options passed to the moized function
 * @returns {function} the function to use in serializing the arguments
 */
export const getSerializerFunction = (options: Options): Function => {
  return typeof options.serializer === 'function' ? options.serializer : createArgumentSerializer(options);
};
