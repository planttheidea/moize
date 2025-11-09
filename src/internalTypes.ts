import type {
    Options as BaseOptions,
    Cache,
    Key,
    Memoized as BaseMemoized,
    TransformKey,
} from 'micro-memoize';
import type { ExpirationManager } from './expires';
import type {
    clearStats,
    getStats,
    isCollectingStats,
    startCollectingStats,
    StatsManager,
    stopCollectingStats,
} from './stats';

export type ForceUpdate<Fn extends Moizeable> = (
    args: Parameters<Fn>,
) => boolean;
export type GetExpires<Fn extends Moizeable> = (
    key: Key,
    value: ReturnType<Fn>,
    cache: Cache<Fn>,
) => number;
export type OnExpire = (key: Key) => any;
export type ShouldPersist<Fn extends Moizeable> = (
    key: Key,
    value: ReturnType<Fn>,
    cache: Cache<Fn>,
) => boolean;
export type ShouldRemoveOnExpire<Fn extends Moizeable> = (
    key: Key,
    value: ReturnType<Fn>,
    time: number,
    cache: Cache<Fn>,
) => boolean;
export type Serializer = (key: Key) => [string];

export interface ExpiresConfig<Fn extends Moizeable> {
    /**
     * The amount of time before the cache entry is automatically removed.
     */
    after: number | GetExpires<Fn>;
    /**
     * Determine whether the cache entry should never expire.
     */
    shouldPersist?: ShouldPersist<Fn>;
    /**
     * Determine whether the cache entry should be removed upon expiration.
     * If `false` is returned, a new expiration is generated (not persistent).
     */
    shouldRemove?: ShouldRemoveOnExpire<Fn>;
    /**
     * Whether the cache entry expiration should be reset upon being hit.
     */
    update?: boolean;
}

export interface ProfileStats {
    calls: number;
    hits: number;
    name: string;
    usage: string;
}

export interface GlobalStats {
    profiles: Record<string, ProfileStats>;
    usage: string;
}

export type Moizeable = ((...args: any[]) => any) & {
    displayName?: string;
};

export type Options<Fn extends Moizeable> = Omit<
    BaseOptions<Fn>,
    'isKeyItemEqual'
> & {
    /**
     * Whether the entry in cache should automatically remove itself
     * after a period of time.
     */
    expires?: number | GetExpires<Fn> | ExpiresConfig<Fn>;
    /**
     * Method to determine whether to bypass the cache to force an update
     * of the underlying entry based on new results.
     *
     * This should only be necessary if the memoized function is not
     * deterministic due to side-effects.
     */
    forceUpdate?: ForceUpdate<Fn>;
    /**
     * Whether the two args are equal in value. This is used to compare
     * specific arguments in order for a cached key versus the key the
     * function is called with to determine whether the cached entry
     * can be used.
     *
     * @default isSameValueZero
     *
     * @note
     * This option will be ignored if the `isKeyEqual` option is provided.
     */
    isKeyItemEqual?: 'deep' | 'shallow' | BaseOptions<Fn>['isKeyItemEqual'];
    /**
     * The maximum number of args to consider for caching.
     */
    maxArgs?: number;
    /**
     * Whether the function wrapped is a React component.
     *
     * If `true` is passed, it will assume latest v19. If a number is passed,
     * it will use that as the expected major version.
     */
    react?: boolean | 19 | 18 | 17 | 16;
    /**
     * Whether to serialize the arguments into a string value for cache
     * purposes. A custom serializer can also be provided, if the default
     * one is insufficient.
     *
     * This can potentially be faster than `isKeyItemEqual: 'deep'` in rare
     * cases, but can also be used to provide a deep equal check that handles
     * circular references.
     */
    serialize?: boolean | Serializer;
    /**
     * The name to give this method when recording profiling stats.
     */
    statsName?: string;
};

export type Moized<Fn extends Moizeable, Opts extends Options<Fn>> = Fn &
    Omit<BaseMemoized<Fn, BaseOptions<Fn>>, 'options'> & {
        /**
         * Manager for the expirations cache. This is only populated when
         * `options.expires` is set.
         */
        expirationManager: ExpirationManager<Fn> | undefined;
        /**
         * Get the stats for the given method based on its `statsName`. If
         * statistics are not being collected on the method, this will return
         * undefined.
         */
        getStats: () => ProfileStats | undefined;
        /**
         * Options passed for the memoized method.
         */
        options: Opts;
        /**
         * Manager for the stats cache. This is only populated when `options.statsName`
         * is set.
         */
        statsManager: StatsManager<Fn> | undefined;
    };

export interface Moize<BaseOpts extends Options<Moizeable>> {
    <Fn extends Moizeable>(fn: Fn): Moized<Fn, BaseOpts>;
    <Fn extends Moizeable, Opts extends Options<Fn>>(
        fn: Fn,
        options: Opts,
    ): Moized<Fn, Omit<BaseOpts, keyof Opts> & Opts>;
    <Fn extends Moized<Moizeable, Options<Moizeable>>>(
        fn: Fn,
    ): Moized<Fn['fn'], Omit<Fn['options'], keyof BaseOpts> & BaseOpts>;
    <Fn extends Moized<Moizeable, Options<Fn>>, PassedOpts extends Options<Fn>>(
        fn: Fn,
        options: PassedOpts,
    ): Moized<
        Fn['fn'],
        Omit<Fn['options'], keyof BaseOpts | keyof PassedOpts> &
            Omit<BaseOpts, keyof PassedOpts> &
            PassedOpts
    >;
    <PassedOpts extends Options<Moizeable>>(
        options: PassedOpts,
    ): Moize<Omit<BaseOpts, keyof PassedOpts> & PassedOpts>;

    /**
     * Create a moized method specific to caching resolved values. Method passed
     * should return a `Promise`-like object.
     */
    async: Moize<{ async: true }>;
    /**
     * Clear all existing stats stored, either of the specific profile whose name is passed,
     * or globally if no name is passed.
     */
    clearStats: typeof clearStats;
    /**
     * Create a moized method that uses deep equality comparison in argument checks.
     */
    deep: Moize<{ isKeyItemEqual: 'deep' }>;
    /**
     * Create a moized method where the existence in cache is limited to a specific time window
     * after being added to the cache.
     */
    expires: <
        Expires extends
            | number
            | GetExpires<Moizeable>
            | ExpiresConfig<Moizeable>,
    >(
        expires: Expires,
    ) => Moize<{ expires: Expires }>;
    /**
     * Create a moized method that will call the underlying (unmemoized) function and update the
     * cache value with its return. This is mainly used if the function has side-effects, and is
     * therefore not deterministic.
     */
    forceUpdate: <Update extends ForceUpdate<Moizeable>>(
        forceUpdate: Update,
    ) => Moize<{ forceUpdate: Update }>;
    /**
     * Get the stats of a given profile, or global stats if no `profileName` is given.
     */
    getStats: typeof getStats;
    /**
     * Create a moized method that will have no limit on the size of the cache.
     */
    infinite: Moize<{ maxSize: typeof Infinity }>;
    /**
     * Create a moized method that will use the method passed for equality comparison
     * in argument checks.
     */
    isKeyItemEqual: <
        IsArgEqual extends Required<BaseOptions<Moizeable>>['isKeyItemEqual'],
    >(
        isKeyItemEqual: IsArgEqual,
    ) => Moize<{ isKeyItemEqual: IsArgEqual }>;
    /**
     * Create a moized method that will use the method passed for complete key
     * equality comparison.
     */
    isKeyEqual: <
        IsKeyEqual extends Required<BaseOptions<Moizeable>>['isKeyEqual'],
    >(
        isKeyEqual: IsKeyEqual,
    ) => Moize<{ isKeyEqual: IsKeyEqual }>;
    /**
     * Whether stats are currently being collected.
     */
    isCollectingStats: typeof isCollectingStats;
    /**
     * Create a moized method where the number of arguments used as the key in cache is limited
     * to the value passed.
     */
    maxArgs: <MaxArgs extends number>(
        maxArgs: MaxArgs,
    ) => Moize<{ maxArgs: MaxArgs }>;
    /**
     * Create a moized method where the total size of the cache is limited to the value passed.
     */
    maxSize: <MaxSize extends number>(
        maxSize: MaxSize,
    ) => Moize<{ maxSize: MaxSize }>;
    /**
     * Create a moized React component. This will memoize renders on a per-instance basis, similar
     * to `React.memo()`.
     */
    react: Moize<{ react: true }>;
    /**
     * Create a moized method that will serialize the arguments for use as the key in cache.
     */
    serialize: Moize<{ serialize: true }>;
    /**
     * Create a moized method that will serialize the arguments with the custom serializer for use
     * as the key in cache.
     */
    serializeWith: <Serialize extends Serializer>(
        serialize: Serialize,
    ) => Moize<{ serialize: Serialize }>;
    /**
     * Create a moized method that uses shallow equality comparison in argument checks.
     */
    shallow: Moize<{ isKeyItemEqual: 'shallow' }>;
    /**
     * Start collecting stats.
     */
    startCollectingStats: typeof startCollectingStats;
    /**
     * Collect stats for the method under the given name.
     */
    statsName: <StatsName extends string>(
        statsName: StatsName,
    ) => Moize<{ statsName: StatsName }>;
    /**
     * Stop collecting stats.
     */
    stopCollectingStats: typeof stopCollectingStats;
    /**
     * Create a moized method that will transform the arguments passed for use as the key in cache.
     */
    transformKey: <Transform extends TransformKey<Moizeable>>(
        transformKey: Transform,
    ) => Moize<{ transformKey: Transform }>;
}
