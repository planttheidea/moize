import { Key, Options } from './types';

/**
 * @private
 *
 * @description
 * custom replacer for the stringify function
 *
 * @param key key in json object
 * @param value value in json object
 * @returns if function then toString of it, else the value itself
 */
export function createDefaultReplacer() {
    const keys: string[] = [];
    const values: any[] = [];

    return function defaultReplacer(key: string, value: any) {
        switch (typeof value) {
            case 'function':
            case 'symbol':
                return value.toString();

            case 'object': {
                if (!value) {
                    return '' + value;
                }

                const index = values.indexOf(value);

                if (index !== -1) {
                    return `[Circular~${index}]`;
                }

                keys.push(key);
                values.push(value);

                return value;
            }

            default:
                return '' + value;
        }
    };
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

    return arg && (typeOfArg === 'object' || typeOfArg === 'function')
        ? JSON.stringify(arg, createDefaultReplacer())
        : arg;
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
    return typeof options.serializer === 'function'
        ? options.serializer
        : defaultArgumentSerializer;
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
