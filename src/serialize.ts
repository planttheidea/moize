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
export function defaultReplacer(propertyIgnored: string, value: any) {
  switch (typeof value) {
    case 'function':
    case 'symbol':
      return value.toString();

    case 'object':
      return value || '' + value;

    default:
      return '' + value;
  }
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
export function stringify(value: any) {
  try {
    return JSON.stringify(value, defaultReplacer);
  } catch (exception) {
    return stringifySafe(value, defaultReplacer);
  }
}

/**
 * @private
 *
 * @description
 * get the stringified version of the argument passed
 *
 * @param arg argument to stringify
 * @returns the stringified argument
 */
export function getStringifiedArgument(arg: any) {
  const typeOfArg = typeof arg;

  return arg && (typeOfArg === 'object' || typeOfArg === 'function') ? stringify(arg) : arg;
}

/**
 * @private
 *
 * @description
 * serialize the arguments passed
 *
 * @param options the options passed to the moizer
 * @param options.maxArgs the cap on the number of arguments used in serialization
 * @returns argument serialization method
 */
export function defaultArgumentSerializer(args: Key) {
  let key = '|';

  for (let index = 0; index < args.length; index++) {
    key += getStringifiedArgument(args[index]) + '|';
  }

  return [key];
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
  return typeof options.serializer === 'function' ? options.serializer : defaultArgumentSerializer;
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
