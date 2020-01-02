import stringifySafe from 'fast-stringify';
import { Key, Options } from './types';

/**
 * @private
 *
 * @description
 * custom replacer for the stringify function
 *
 * @param propertyIgnored key in json object
 * @param value value in json object
 * @returns if function then toString of it, else the value itself
 */
export function customReplacer(propertyIgnored: string, value: any) {
  return typeof value === 'function' ? '' + value : value;
}

/**
 * @private
 *
 * @description
 * stringify with a custom replacer if circular, else use standard JSON.stringify
 *
 * @param value value to stringify
 * @param replacer replacer to used in stringification
 * @returns the stringified version of value
 */
export function stringify(value: any, replacer?: typeof customReplacer) {
  try {
    return JSON.stringify(value, replacer);
  } catch (exception) {
    return stringifySafe(value, replacer);
  }
}

/**
 * @private
 *
 * @description
 * get the stringified version of the argument passed
 *
 * @param arg argument to stringify
 * @param replacer replacer to used in stringification
 * @returns the stringified argument
 */
export function getStringifiedArgument(arg: any, replacer?: typeof customReplacer) {
  const typeOfArg = typeof arg;

  return arg && (typeOfArg === 'object' || typeOfArg === 'function')
    ? stringify(arg, replacer)
    : arg;
}

/**
 * @private
 *
 * @description
 * create the internal argument serializer based on the options passed
 *
 * @param options the options passed to the moizer
 * @param options.serializeFunctions should functions be included in the serialization
 * @param options.maxArgs the cap on the number of arguments used in serialization
 * @returns argument serialization method
 */
export function createArgumentSerializer(options: Options) {
  const replacer = options.shouldSerializeFunctions ? customReplacer : null;

  return function(args: Key) {
    let key = '|';

    for (let index = 0; index < args.length; index++) {
      key += getStringifiedArgument(args[index], replacer) + '|';
    }

    return [key];
  };
}

/**
 * @private
 *
 * @description
 * based on the options passed, either use the serializer passed or generate the internal one
 *
 * @param options the options passed to the moized function
 * @returns the function to use in serializing the arguments
 */
export function getSerializerFunction(options: Options) {
  return typeof options.serializer === 'function'
    ? options.serializer
    : createArgumentSerializer(options);
}

/**
 * @private
 *
 * @description
 * are the serialized keys equal to one another
 *
 * @param cacheKey the cache key to compare
 * @param key the key to test
 * @returns are the keys equal
 */
export function getIsSerializedKeyEqual(cacheKey: Key, key: Key) {
  return cacheKey[0] === key[0];
}
