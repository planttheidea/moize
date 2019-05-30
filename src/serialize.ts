// @flow

// external dependencies
import stringifySafe from 'fast-stringify';

import { makeCallable } from './utils';

import { Options } from './types';

const fnToString = makeCallable(Function.prototype.toString);
const regexpToString = makeCallable(RegExp.prototype.toString);
const symbolToString =
  typeof Symbol !== 'undefined'
    ? makeCallable(Symbol.prototype.toString)
    : (symbol: any) => symbol.toString();

/**
 * @private
 *
 * @function customReplacer
 *
 * @description
 * custom replacer for the stringify function
 *
 * @param _key key in json object
 * @param value value in json object
 * @returns if function then toString of it, else the value itself
 */
export function customReplacer(_key: string, value: any): any {
  const type = typeof value;

  if (!type || type === 'number') {
    return `${value}`;
  }

  if (type === 'function') {
    return fnToString(value);
  }

  if (type === 'symbol') {
    return symbolToString(value);
  }

  if (value instanceof RegExp) {
    return regexpToString(value);
  }

  return value;
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
export function stringify(value: any): [string] {
  try {
    return [JSON.stringify(value, customReplacer)];
  } catch (exception) {
    return [stringifySafe(value, customReplacer)];
  }
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
export function getSerializerFunction(options: Options): (args: any[]) => [string] {
  return typeof options.serializer === 'function' ? options.serializer : stringify;
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
