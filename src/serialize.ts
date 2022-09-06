import type { Key, Options } from '../index.d';

/**
 * @function getCutoff
 *
 * @description
 * faster `Array.prototype.indexOf` implementation build for slicing / splicing
 *
 * @param array the array to match the value in
 * @param value the value to match
 * @returns the matching index, or -1
 */
function getCutoff(array: any[], value: any) {
    const { length } = array;

    for (let index = 0; index < length; ++index) {
        if (array[index] === value) {
            return index + 1;
        }
    }

    return 0;
}

/**
 * @private
 *
 * @description
 * custom replacer for the stringify function
 *
 * @returns if function then toString of it, else the value itself
 */
export function createDefaultReplacer() {
    const cache: any[] = [];
    const keys: string[] = [];

    return function defaultReplacer(key: string, value: any) {
        const type = typeof value;

        if (type === 'function' || type === 'symbol') {
            return value.toString();
        }

        if (typeof value === 'object') {
            if (cache.length) {
                const thisCutoff = getCutoff(cache, this);

                if (thisCutoff === 0) {
                    cache[cache.length] = this;
                } else {
                    cache.splice(thisCutoff);
                    keys.splice(thisCutoff);
                }

                keys[keys.length] = key;

                const valueCutoff = getCutoff(cache, value);

                if (valueCutoff !== 0) {
                    return `[ref=${
                        keys.slice(0, valueCutoff).join('.') || '.'
                    }]`;
                }
            } else {
                cache[0] = value;
                keys[0] = key;
            }

            return value;
        }

        return '' + value;
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
export function getStringifiedArgument<Type>(arg: Type) {
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
