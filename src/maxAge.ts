import { createFindKeyIndex, findExpirationIndex } from './utils';

import type {
    AnyFn,
    Cache,
    Expiration,
    IsEqual,
    IsMatchingKey,
    Key,
    MaxAgeOption,
    OnCacheOperation,
    Options,
} from '../index.d';

/**
 * @private
 *
 * @description
 * clear an active expiration and remove it from the list if applicable
 *
 * @param expirations the list of expirations
 * @param key the key to clear
 * @param shouldRemove should the expiration be removed from the list
 */
export function clearExpiration(
    expirations: Expiration[],
    key: Key,
    shouldRemove?: boolean
) {
    const expirationIndex = findExpirationIndex(expirations, key);

    if (expirationIndex !== -1) {
        clearTimeout(expirations[expirationIndex].timeoutId);

        if (shouldRemove) {
            expirations.splice(expirationIndex, 1);
        }
    }
}

/**
 * @private
 *
 * @description
 * Create the timeout for the given expiration method. If the ability to `unref`
 * exists, then apply it to avoid process locks in NodeJS.
 *
 * @param expirationMethod the method to fire upon expiration
 * @param maxAge the time to expire after
 * @returns the timeout ID
 */
export function createTimeout(expirationMethod: () => void, maxAge: number) {
    const timeoutId = setTimeout(expirationMethod, maxAge);

    if (typeof timeoutId.unref === 'function') {
        timeoutId.unref();
    }

    return timeoutId;
}

/**
 * @private
 *
 * @description
 * create a function that, when an item is added to the cache, adds an expiration for it
 *
 * @param expirations the mutable expirations array
 * @param options the options passed on initialization
 * @param isEqual the function to check argument equality
 * @param isMatchingKey the function to check complete key equality
 * @returns the onCacheAdd function to handle expirations
 */
export function createOnCacheAddSetExpiration<MoizeableFn extends AnyFn>(
    expirations: Expiration[],
    options: Options<MoizeableFn>,
    isEqual: IsEqual,
    isMatchingKey: IsMatchingKey
): OnCacheOperation<MoizeableFn> {
    return function onCacheAdd(
        cache: Cache<MoizeableFn>,
        moizedOptions: Options<MoizeableFn>,
        moized: MoizeableFn
    ) {
        const key: any = cache.keys[0];

        if (findExpirationIndex(expirations, key) === -1) {
            const expirationMethod = function () {
                const findKeyIndex = createFindKeyIndex(isEqual, isMatchingKey);

                const keyIndex: number = findKeyIndex(cache.keys, key);
                const value: any = cache.values[keyIndex];

                if (~keyIndex) {
                    cache.keys.splice(keyIndex, 1);
                    cache.values.splice(keyIndex, 1);

                    if (typeof options.onCacheChange === 'function') {
                        options.onCacheChange(cache, moizedOptions, moized);
                    }
                }

                clearExpiration(expirations, key, true);

                if (
                    typeof options.onExpire === 'function' &&
                    options.onExpire(key) === false
                ) {
                    cache.keys.unshift(key);
                    cache.values.unshift(value);

                    onCacheAdd(cache, moizedOptions, moized);

                    if (typeof options.onCacheChange === 'function') {
                        options.onCacheChange(cache, moizedOptions, moized);
                    }
                }
            };

            const maxAge = getMaxAgeValue(options.maxAge, cache);

            expirations.push({
                expirationMethod,
                key,
                timeoutId: createTimeout(expirationMethod, maxAge),
            });
        }
    };
}

/**
 * @private
 *
 * @description
 * creates a function that, when a cache item is hit, reset the expiration
 *
 * @param expirations the mutable expirations array
 * @param options the options passed on initialization
 * @returns the onCacheAdd function to handle expirations
 */
export function createOnCacheHitResetExpiration<MoizeableFn extends AnyFn>(
    expirations: Expiration[],
    options: Options<MoizeableFn>
): OnCacheOperation<MoizeableFn> {
    return function onCacheHit(cache: Cache<MoizeableFn>) {
        const key = cache.keys[0];
        const expirationIndex = findExpirationIndex(expirations, key);

        if (~expirationIndex) {
            clearExpiration(expirations, key, false);

            const maxAge = getMaxAgeValue(options.maxAge, cache);

            expirations[expirationIndex].timeoutId = createTimeout(
                expirations[expirationIndex].expirationMethod,
                maxAge
            );
        }
    };
}

/**
 * @private
 *
 * @description
 * get the micro-memoize options specific to the maxAge option
 *
 * @param expirations the expirations for the memoized function
 * @param options the options passed to the moizer
 * @param isEqual the function to test equality of the key on a per-argument basis
 * @param isMatchingKey the function to test equality of the whole key
 * @returns the object of options based on the entries passed
 */
export function getMaxAgeOptions<MoizeableFn extends AnyFn>(
    expirations: Expiration[],
    options: Options<MoizeableFn>,
    isEqual: IsEqual,
    isMatchingKey: IsMatchingKey
): {
    onCacheAdd: OnCacheOperation<MoizeableFn> | undefined;
    onCacheHit: OnCacheOperation<MoizeableFn> | undefined;
} {
    const onCacheAdd = isMaxAgeValid(options.maxAge)
        ? createOnCacheAddSetExpiration(
              expirations,
              options,
              isEqual,
              isMatchingKey
          )
        : undefined;

    return {
        onCacheAdd,
        onCacheHit:
            onCacheAdd && options.updateExpire
                ? createOnCacheHitResetExpiration(expirations, options)
                : undefined,
    };
}

/**
 * @private
 *
 * @description
 * Get the numeric maxAge value, deriving it if the option is a function.
 *
 * @param maxAge the maxAge option passed to moize
 * @param cache the cache instance for the memoized function
 * @returns numeric maxAge value or undefined
 */
export function getMaxAgeValue<MoizeableFn extends AnyFn>(
    maxAge: MaxAgeOption<MoizeableFn>,
    cache: Cache<MoizeableFn>
): number | undefined {
    if (typeof maxAge === 'function') {
        const { keys, values } = cache;

        if (!values.length || !keys.length) {
            return;
        }

        const key = keys[0];
        const value = values[0];

        return maxAge(value, key, cache);
    }

    return maxAge;
}

/**
 * @private
 *
 * @description
 * Determine whether the `maxAge` option is valid.
 *
 * @param maxAge the maxAge option to validate
 * @returns whether the maxAge option is valid
 */
export function isMaxAgeValid(maxAge: any): maxAge is MaxAgeOption<any> {
    return typeof maxAge === 'number'
        ? maxAge >= 0 && isFinite(maxAge)
        : typeof maxAge === 'function';
}
