import memoize from 'micro-memoize';
import { createMoizedComponent } from './component';
import { DEFAULT_OPTIONS } from './constants';
import { createMoizeInstance } from './instance';
import { getMaxAgeOptions } from './maxAge';
import {
    createOnCacheOperation,
    getIsEqual,
    getIsMatchingKey,
    getTransformKey,
} from './options';
import {
    clearStats,
    collectStats,
    getDefaultProfileName,
    getStats,
    getStatsOptions,
    statsCache,
} from './stats';
import { createRefreshableMoized } from './updateCacheForKey';
import { combine, compose, isMoized, mergeOptions, setName } from './utils';

import type {
    Expiration,
    IsEqual,
    IsMatchingKey,
    MicroMemoizeOptions,
    Moize,
    Moizeable,
    Moized,
    OnExpire,
    Options,
    Serialize,
    TransformKey,
    UpdateCacheForKey,
} from '../index.d';

/**
 * @module moize
 */

/**
 * @description
 * memoize a function based its arguments passed, potentially improving runtime performance
 *
 * @example
 * import moize from 'moize';
 *
 * // standard implementation
 * const fn = (foo, bar) => `${foo} ${bar}`;
 * const memoizedFn = moize(fn);
 *
 * // implementation with options
 * const fn = async (id) => get(`http://foo.com/${id}`);
 * const memoizedFn = moize(fn, {isPromise: true, maxSize: 5});
 *
 * // implementation with convenience methods
 * const Foo = ({foo}) => <div>{foo}</div>;
 * const MemoizedFoo = moize.react(Foo);
 *
 * @param fn the function to memoized, or a list of options when currying
 * @param [options=DEFAULT_OPTIONS] the options to apply
 * @returns the memoized function
 */
const moize: Moize = function <
    MoizeableFn extends Moizeable,
    PassedOptions extends Options<MoizeableFn>
>(fn: MoizeableFn | PassedOptions, passedOptions?: PassedOptions) {
    type CombinedOptions = Omit<Options<MoizeableFn>, keyof PassedOptions> &
        PassedOptions;

    const options: Options<MoizeableFn> = passedOptions || DEFAULT_OPTIONS;

    if (isMoized(fn)) {
        const moizeable = fn.originalFunction as MoizeableFn;
        const mergedOptions = mergeOptions(
            fn.options,
            options
        ) as CombinedOptions;

        return moize<MoizeableFn, CombinedOptions>(moizeable, mergedOptions);
    }

    if (typeof fn === 'object') {
        return function <
            CurriedFn extends Moizeable,
            CurriedOptions extends Options<CurriedFn>
        >(
            curriedFn: CurriedFn | CurriedOptions,
            curriedOptions: CurriedOptions
        ) {
            type CombinedCurriedOptions = Omit<
                CombinedOptions,
                keyof CurriedOptions
            > &
                CurriedOptions;

            if (typeof curriedFn === 'function') {
                const mergedOptions = mergeOptions(
                    fn as CombinedOptions,
                    curriedOptions
                ) as CombinedCurriedOptions;

                return moize(curriedFn, mergedOptions);
            }

            const mergedOptions = mergeOptions(
                fn as CombinedOptions,
                curriedFn as CurriedOptions
            );

            return moize(mergedOptions);
        };
    }

    if (options.isReact) {
        return createMoizedComponent(moize, fn, options);
    }

    const coalescedOptions: Options<MoizeableFn> = {
        ...DEFAULT_OPTIONS,
        ...options,
        maxAge:
            typeof options.maxAge === 'number' && options.maxAge >= 0
                ? options.maxAge
                : DEFAULT_OPTIONS.maxAge,
        maxArgs:
            typeof options.maxArgs === 'number' && options.maxArgs >= 0
                ? options.maxArgs
                : DEFAULT_OPTIONS.maxArgs,
        maxSize:
            typeof options.maxSize === 'number' && options.maxSize >= 0
                ? options.maxSize
                : DEFAULT_OPTIONS.maxSize,
        profileName: options.profileName || getDefaultProfileName(fn),
    };
    const expirations: Array<Expiration> = [];

    const {
        matchesArg: equalsIgnored,
        isDeepEqual: isDeepEqualIgnored,
        isPromise,
        isReact: isReactIgnored,
        isSerialized: isSerialzedIgnored,
        isShallowEqual: isShallowEqualIgnored,
        matchesKey: matchesKeyIgnored,
        maxAge: maxAgeIgnored,
        maxArgs: maxArgsIgnored,
        maxSize,
        onCacheAdd,
        onCacheChange,
        onCacheHit,
        onExpire: onExpireIgnored,
        profileName: profileNameIgnored,
        serializer: serializerIgnored,
        updateCacheForKey,
        transformArgs: transformArgsIgnored,
        updateExpire: updateExpireIgnored,
        ...customOptions
    } = coalescedOptions;

    const isEqual = getIsEqual(coalescedOptions);
    const isMatchingKey = getIsMatchingKey(coalescedOptions);

    const maxAgeOptions = getMaxAgeOptions(
        expirations,
        coalescedOptions,
        isEqual,
        isMatchingKey
    );
    const statsOptions = getStatsOptions(coalescedOptions);

    const transformKey = getTransformKey(coalescedOptions);

    const microMemoizeOptions: MicroMemoizeOptions<MoizeableFn> = {
        ...customOptions,
        isEqual,
        isMatchingKey,
        isPromise,
        maxSize,
        onCacheAdd: createOnCacheOperation(
            combine(
                onCacheAdd,
                maxAgeOptions.onCacheAdd,
                statsOptions.onCacheAdd
            )
        ),
        onCacheChange: createOnCacheOperation(onCacheChange),
        onCacheHit: createOnCacheOperation(
            combine(
                onCacheHit,
                maxAgeOptions.onCacheHit,
                statsOptions.onCacheHit
            )
        ),
        transformKey,
    };

    const memoized = memoize(fn, microMemoizeOptions);

    let moized = createMoizeInstance<MoizeableFn, CombinedOptions>(memoized, {
        expirations,
        options: coalescedOptions,
        originalFunction: fn,
    });

    if (updateCacheForKey) {
        moized = createRefreshableMoized<typeof moized>(moized);
    }

    setName(moized, (fn as Moizeable).name, options.profileName);

    return moized;
};

/**
 * @function
 * @name clearStats
 * @memberof module:moize
 * @alias moize.clearStats
 *
 * @description
 * clear all existing stats stored
 */
moize.clearStats = clearStats;

/**
 * @function
 * @name collectStats
 * @memberof module:moize
 * @alias moize.collectStats
 *
 * @description
 * start collecting statistics
 */
moize.collectStats = collectStats;

/**
 * @function
 * @name compose
 * @memberof module:moize
 * @alias moize.compose
 *
 * @description
 * method to compose moized methods and return a single moized function
 *
 * @param moized the functions to compose
 * @returns the composed function
 */
moize.compose = function (...moized: Moize[]) {
    return compose<Moize>(...moized) || moize;
};

/**
 * @function
 * @name deep
 * @memberof module:moize
 * @alias moize.deep
 *
 * @description
 * should deep equality check be used
 *
 * @returns the moizer function
 */
moize.deep = moize({ isDeepEqual: true });

/**
 * @function
 * @name getStats
 * @memberof module:moize
 * @alias moize.getStats
 *
 * @description
 * get the statistics of a given profile, or overall usage
 *
 * @returns statistics for a given profile or overall usage
 */
moize.getStats = getStats;

/**
 * @function
 * @name infinite
 * @memberof module:moize
 * @alias moize.infinite
 *
 * @description
 * a moized method that will remove all limits from the cache size
 *
 * @returns the moizer function
 */
moize.infinite = moize({ maxSize: Infinity });

/**
 * @function
 * @name isCollectingStats
 * @memberof module:moize
 * @alias moize.isCollectingStats
 *
 * @description
 * are stats being collected
 *
 * @returns are stats being collected
 */
moize.isCollectingStats = function isCollectingStats(): boolean {
    return statsCache.isCollectingStats;
};

/**
 * @function
 * @name isMoized
 * @memberof module:moize
 * @alias moize.isMoized
 *
 * @description
 * is the fn passed a moized function
 *
 * @param fn the object to test
 * @returns is fn a moized function
 */
moize.isMoized = function isMoized(fn: any): fn is Moized {
    return typeof fn === 'function' && !!fn.isMoized;
};

/**
 * @function
 * @name matchesArg
 * @memberof module:moize
 * @alias moize.matchesArg
 *
 * @description
 * a moized method where the arg matching method is the custom one passed
 *
 * @param keyMatcher the method to compare against those in cache
 * @returns the moizer function
 */
moize.matchesArg = function (argMatcher: IsEqual) {
    return moize({ matchesArg: argMatcher });
};

/**
 * @function
 * @name matchesKey
 * @memberof module:moize
 * @alias moize.matchesKey
 *
 * @description
 * a moized method where the key matching method is the custom one passed
 *
 * @param keyMatcher the method to compare against those in cache
 * @returns the moizer function
 */
moize.matchesKey = function (keyMatcher: IsMatchingKey) {
    return moize({ matchesKey: keyMatcher });
};

function maxAge<MaxAge extends number>(
    maxAge: MaxAge
): Moize<{ maxAge: MaxAge }>;
function maxAge<MaxAge extends number, UpdateExpire extends boolean>(
    maxAge: MaxAge,
    expireOptions: UpdateExpire
): Moize<{ maxAge: MaxAge; updateExpire: UpdateExpire }>;
function maxAge<MaxAge extends number, ExpireHandler extends OnExpire>(
    maxAge: MaxAge,
    expireOptions: ExpireHandler
): Moize<{ maxAge: MaxAge; onExpire: ExpireHandler }>;
function maxAge<
    MaxAge extends number,
    ExpireHandler extends OnExpire,
    ExpireOptions extends {
        onExpire: ExpireHandler;
    }
>(
    maxAge: MaxAge,
    expireOptions: ExpireOptions
): Moize<{ maxAge: MaxAge; onExpire: ExpireOptions['onExpire'] }>;
function maxAge<
    MaxAge extends number,
    UpdateExpire extends boolean,
    ExpireOptions extends {
        updateExpire: UpdateExpire;
    }
>(
    maxAge: MaxAge,
    expireOptions: ExpireOptions
): Moize<{ maxAge: MaxAge; updateExpire: UpdateExpire }>;
function maxAge<
    MaxAge extends number,
    ExpireHandler extends OnExpire,
    UpdateExpire extends boolean,
    ExpireOptions extends {
        onExpire: ExpireHandler;
        updateExpire: UpdateExpire;
    }
>(
    maxAge: MaxAge,
    expireOptions: ExpireOptions
): Moize<{
    maxAge: MaxAge;
    onExpire: ExpireHandler;
    updateExpire: UpdateExpire;
}>;
function maxAge<
    MaxAge extends number,
    ExpireHandler extends OnExpire,
    UpdateExpire extends boolean,
    ExpireOptions extends {
        onExpire?: ExpireHandler;
        updateExpire?: UpdateExpire;
    }
>(
    maxAge: MaxAge,
    expireOptions?: ExpireHandler | UpdateExpire | ExpireOptions
) {
    if (expireOptions === true) {
        return moize({
            maxAge,
            updateExpire: expireOptions,
        });
    }

    if (typeof expireOptions === 'object') {
        const { onExpire, updateExpire } = expireOptions;

        return moize({
            maxAge,
            onExpire,
            updateExpire,
        });
    }

    if (typeof expireOptions === 'function') {
        return moize({
            maxAge,
            onExpire: expireOptions,
            updateExpire: true,
        });
    }

    return moize({ maxAge });
}

/**
 * @function
 * @name maxAge
 * @memberof module:moize
 * @alias moize.maxAge
 *
 * @description
 * a moized method where the age of the cache is limited to the number of milliseconds passed
 *
 * @param maxAge the TTL of the value in cache
 * @returns the moizer function
 */
moize.maxAge = maxAge;

/**
 * @function
 * @name maxArgs
 * @memberof module:moize
 * @alias moize.maxArgs
 *
 * @description
 * a moized method where the number of arguments used for determining cache is limited to the value passed
 *
 * @param maxArgs the number of args to base the key on
 * @returns the moizer function
 */
moize.maxArgs = function maxArgs(maxArgs: number) {
    return moize({ maxArgs });
};

/**
 * @function
 * @name maxSize
 * @memberof module:moize
 * @alias moize.maxSize
 *
 * @description
 * a moized method where the total size of the cache is limited to the value passed
 *
 * @param maxSize the maximum size of the cache
 * @returns the moizer function
 */
moize.maxSize = function maxSize(maxSize: number) {
    return moize({ maxSize });
};

/**
 * @function
 * @name profile
 * @memberof module:moize
 * @alias moize.profile
 *
 * @description
 * a moized method with a profile name
 *
 * @returns the moizer function
 */
moize.profile = function (profileName: string) {
    return moize({ profileName });
};

/**
 * @function
 * @name promise
 * @memberof module:moize
 * @alias moize.promise
 *
 * @description
 * a moized method specific to caching resolved promise / async values
 *
 * @returns the moizer function
 */
moize.promise = moize({
    isPromise: true,
    updateExpire: true,
});

/**
 * @function
 * @name react
 * @memberof module:moize
 * @alias moize.react
 *
 * @description
 * a moized method specific to caching React element values
 *
 * @returns the moizer function
 */
moize.react = moize({ isReact: true });

/**
 * @function
 * @name serialize
 * @memberof module:moize
 * @alias moize.serialize
 *
 * @description
 * a moized method that will serialize the arguments passed to use as the cache key
 *
 * @returns the moizer function
 */
moize.serialize = moize({ isSerialized: true });

/**
 * @function
 * @name serializeWith
 * @memberof module:moize
 * @alias moize.serializeWith
 *
 * @description
 * a moized method that will serialize the arguments passed to use as the cache key
 * based on the serializer passed
 *
 * @returns the moizer function
 */
moize.serializeWith = function (serializer: Serialize) {
    return moize({ isSerialized: true, serializer });
};

/**
 * @function
 * @name shallow
 * @memberof module:moize
 * @alias moize.shallow
 *
 * @description
 * should shallow equality check be used
 *
 * @returns the moizer function
 */
moize.shallow = moize({ isShallowEqual: true });

/**
 * @function
 * @name transformArgs
 * @memberof module:moize
 * @alias moize.transformArgs
 *
 * @description
 * transform the args to allow for specific cache key comparison
 *
 * @param transformArgs the args transformer
 * @returns the moizer function
 */
moize.transformArgs = <Transformer extends TransformKey>(
    transformArgs: Transformer
) => moize({ transformArgs });

/**
 * @function
 * @name updateCacheForKey
 * @memberof module:moize
 * @alias moize.updateCacheForKey
 *
 * @description
 * update the cache for a given key when the method passed returns truthy
 *
 * @param updateCacheForKey the method to determine when to update cache
 * @returns the moizer function
 */
moize.updateCacheForKey = <UpdateWhen extends UpdateCacheForKey>(
    updateCacheForKey: UpdateWhen
) => moize({ updateCacheForKey });

// Add self-referring `default` property for edge-case cross-compatibility of mixed ESM/CommonJS usage.
// This property is frozen and non-enumerable to avoid visibility on iteration or accidental overrides.
Object.defineProperty(moize, 'default', {
    configurable: false,
    enumerable: false,
    value: moize,
    writable: false,
});

export default moize;
