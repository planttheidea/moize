// @flow

// external dependencies
import stringifySafe from 'fast-stringify';

// utils
import { compose, getArrayKey } from './utils';

/**
 * @private
 *
 * @function customReplacer
 *
 * @description
 * custom replacer for the stringify function
 *
 * @param key key in json object
 * @param value value in json object
 * @returns if function then toString of it, else the value itself
 */
export function customReplacer(key: string, value: any): any {
  return typeof value === 'function' ? `${value}` : value;
}

/**
 * @private
 *
 * @function stringify
 *
 * @description
 * stringify with a custom replacer if circular, else use standard JSON.stringify
 *
 * @param value value to stringify
 * @param [replacer] replacer to used in stringification
 * @returns the stringified version of value
 */
export function stringify(value: any, replacer: any) {
  try {
    return JSON.stringify(value, replacer);
  } catch (exception) {
    return stringifySafe(value, replacer);
  }
}

/**
 * @private
 *
 * @function getStringifiedArgument
 *
 * @description
 * get the stringified version of the argument passed
 *
 * @param arg argument to stringify
 * @param [replacer] replacer to used in stringification
 * @returns the stringified argument
 */
export function getStringifiedArgument(arg: any, replacer?: Function) {
  const type = typeof arg;

  return arg && (type === 'object' || type === 'function')
    ? stringify(arg, replacer)
    : arg;
}

/**
 * @private
 *
 * @function createArgumentSerializer
 *
 * @description
 * create the internal argument serializer based on the options passed
 *
 * @param options the options passed to the moizer
 * @param [options.shouldSerializeFunctions] should functions be included in the serialization
 * @returns argument serialization method
 */
export function createArgumentSerializer(options: Moize.Options) {
  const replacer = options.shouldSerializeFunctions ? customReplacer : null;

  return (args: any[]) => {
    const { length } = args;

    if (!length) {
      return [''];
    }

    let key = '|';

    for (let index: number = 0; index < length; index++) {
      key += `${getStringifiedArgument(args[index], replacer)}|`;
    }

    return [key];
  };
}

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
export function getSerializerFunction(options: Moize.Options) {
  if (typeof options.serializer === 'function') {
    return compose(
      getArrayKey,
      options.serializer,
    );
  }

  return createArgumentSerializer(options);
}

/**
 * @private
 *
 * @function getIsSerializedKeyEqual
 *
 * @description
 * are the serialized keys equal to one another
 *
 * @param {Array<string>} cacheKey the cache key to compare
 * @param {*} key the key to test
 * @returns {boolean} are the keys equal
 */
export function getIsSerializedKeyEqual(cacheKey: string[], key: string[]) {
  return cacheKey[0] === key[0];
}
