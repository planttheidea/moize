import { clearExpiration } from './maxAge';
import { clearStats, getStats } from './stats';
import { createFindKeyIndex } from './utils';

import type {
    Key,
    Memoized,
    Moizeable,
    MoizeConfiguration,
    Moized,
    Options,
    StatsProfile,
} from '../index.d';

const ALWAYS_SKIPPED_PROPERTIES: Record<string, boolean> = {
    arguments: true,
    callee: true,
    caller: true,
    constructor: true,
    length: true,
    name: true,
    prototype: true,
};

/**
 * @private
 *
 * @description
 * copy the static properties from the original function to the moized
 * function
 *
 * @param originalFn the function copying from
 * @param newFn the function copying to
 * @param skippedProperties the list of skipped properties, if any
 */
export function copyStaticProperties<
    OriginalMoizeableFn extends Moizeable,
    NewMoizeableFn extends Moizeable
>(
    originalFn: OriginalMoizeableFn,
    newFn: NewMoizeableFn,
    skippedProperties: string[] = []
) {
    Object.getOwnPropertyNames(originalFn).forEach((property) => {
        if (
            !ALWAYS_SKIPPED_PROPERTIES[property] &&
            skippedProperties.indexOf(property) === -1
        ) {
            const descriptor = Object.getOwnPropertyDescriptor(
                originalFn,
                property
            );

            if (descriptor.get || descriptor.set) {
                Object.defineProperty(newFn, property, descriptor);
            } else {
                // @ts-expect-error - properites may not align
                newFn[property] = originalFn[property];
            }
        }
    });
}

/**
 * @private
 *
 * @description
 * add methods to the moized fuction object that allow extra features
 *
 * @param memoized the memoized function from micro-memoize
 */
export function addInstanceMethods<MoizeableFn extends Moizeable>(
    memoized: Moizeable,
    { expirations }: MoizeConfiguration<MoizeableFn>
) {
    const { options } = memoized;

    const findKeyIndex = createFindKeyIndex(
        options.isEqual,
        options.isMatchingKey
    );

    const moized = memoized as unknown as Moized<
        MoizeableFn,
        Options<MoizeableFn>
    >;

    moized.clear = function () {
        const {
            _microMemoizeOptions: { onCacheChange },
            cache,
        } = moized;

        cache.keys.length = 0;
        cache.values.length = 0;

        if (onCacheChange) {
            onCacheChange(cache, moized.options, moized);
        }

        return true;
    };

    moized.clearStats = function () {
        clearStats(moized.options.profileName);
    };

    moized.get = function (key: Key) {
        const {
            _microMemoizeOptions: { transformKey },
            cache,
        } = moized;

        const cacheKey = transformKey ? transformKey(key) : key;
        const keyIndex = findKeyIndex(cache.keys, cacheKey);

        return keyIndex !== -1 ? moized.apply(this, key) : undefined;
    };

    moized.getStats = function (): StatsProfile {
        return getStats(moized.options.profileName);
    };

    moized.has = function (key: Key) {
        const { transformKey } = moized._microMemoizeOptions;

        const cacheKey = transformKey ? transformKey(key) : key;

        return findKeyIndex(moized.cache.keys, cacheKey) !== -1;
    };

    moized.keys = function () {
        return moized.cacheSnapshot.keys;
    };

    moized.remove = function (key: Key) {
        const {
            _microMemoizeOptions: { onCacheChange, transformKey },
            cache,
        } = moized;

        const keyIndex = findKeyIndex(
            cache.keys,
            transformKey ? transformKey(key) : key
        );

        if (keyIndex === -1) {
            return false;
        }

        const existingKey = cache.keys[keyIndex];

        cache.keys.splice(keyIndex, 1);
        cache.values.splice(keyIndex, 1);

        if (onCacheChange) {
            onCacheChange(cache, moized.options, moized);
        }

        clearExpiration(expirations, existingKey, true);

        return true;
    };

    moized.set = function (key: Key, value: any) {
        const { _microMemoizeOptions, cache, options } = moized;
        const { onCacheAdd, onCacheChange, transformKey } =
            _microMemoizeOptions;

        const cacheKey = transformKey ? transformKey(key) : key;
        const keyIndex = findKeyIndex(cache.keys, cacheKey);

        if (keyIndex === -1) {
            const cutoff = options.maxSize - 1;

            if (cache.size > cutoff) {
                cache.keys.length = cutoff;
                cache.values.length = cutoff;
            }

            cache.keys.unshift(cacheKey);
            cache.values.unshift(value);

            if (options.isPromise) {
                cache.updateAsyncCache(moized);
            }

            if (onCacheAdd) {
                onCacheAdd(cache, options, moized);
            }

            if (onCacheChange) {
                onCacheChange(cache, options, moized);
            }
        } else {
            const existingKey = cache.keys[keyIndex];

            cache.values[keyIndex] = value;

            if (keyIndex > 0) {
                cache.orderByLru(existingKey, value, keyIndex);
            }

            if (options.isPromise) {
                cache.updateAsyncCache(moized);
            }

            if (typeof onCacheChange === 'function') {
                onCacheChange(cache, options, moized);
            }
        }
    };

    moized.values = function () {
        return moized.cacheSnapshot.values;
    };
}

/**
 * @private
 *
 * @description
 * add propeties to the moized fuction object that surfaces extra information
 *
 * @param memoized the memoized function
 * @param expirations the list of expirations for cache items
 * @param options the options passed to the moizer
 * @param originalFunction the function that is being memoized
 */
export function addInstanceProperties<MoizeableFn extends Moizeable>(
    memoized: Memoized<MoizeableFn>,
    {
        expirations,
        options: moizeOptions,
        originalFunction,
    }: MoizeConfiguration<MoizeableFn>
) {
    const { options: microMemoizeOptions } = memoized;

    Object.defineProperties(memoized, {
        _microMemoizeOptions: {
            configurable: true,
            get() {
                return microMemoizeOptions;
            },
        },

        cacheSnapshot: {
            configurable: true,
            get() {
                const { cache: currentCache } = memoized;

                return {
                    keys: currentCache.keys.slice(0),
                    size: currentCache.size,
                    values: currentCache.values.slice(0),
                };
            },
        },

        expirations: {
            configurable: true,
            get() {
                return expirations;
            },
        },

        expirationsSnapshot: {
            configurable: true,
            get() {
                return expirations.slice(0);
            },
        },

        isMoized: {
            configurable: true,
            get() {
                return true;
            },
        },

        options: {
            configurable: true,
            get() {
                return moizeOptions;
            },
        },

        originalFunction: {
            configurable: true,
            get() {
                return originalFunction;
            },
        },
    });

    const moized = memoized as unknown as Moized<
        MoizeableFn,
        Options<MoizeableFn>
    >;

    copyStaticProperties(originalFunction, moized);
}

/**
 * @private
 *
 * @description
 * add methods and properties to the memoized function for more features
 *
 * @param memoized the memoized function
 * @param configuration the configuration object for the instance
 * @returns the memoized function passed
 */
export function createMoizeInstance<
    MoizeableFn extends Moizeable,
    CombinedOptions extends Options<MoizeableFn>
>(
    memoized: Memoized<MoizeableFn>,
    configuration: MoizeConfiguration<MoizeableFn>
) {
    addInstanceMethods<MoizeableFn>(memoized, configuration);
    addInstanceProperties<MoizeableFn>(memoized, configuration);

    return memoized as Moized<MoizeableFn, CombinedOptions>;
}
