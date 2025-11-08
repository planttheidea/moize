import type {
    Options as BaseOptions,
    Cache,
    Key,
    Memoized as BaseMemoized,
} from 'micro-memoize';
import type { ExpirationManager } from './expires';
import { StatsManager } from './stats';

export type ForceUpdate<Fn extends Moizeable> = (
    args: Parameters<Fn>,
) => boolean;
export type GetMaxAge<Fn extends Moizeable> = (
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
export type Serialize = (key: Key) => [string];

interface ExpireConfig<Fn extends Moizeable> {
    /**
     * The amount of time before the cache entry is automatically removed.
     */
    after: number | GetMaxAge<Fn>;
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
    'isArgEqual'
> & {
    /**
     * Whether the entry in cache should automatically remove itself
     * after a period of time.
     */
    expires?: number | GetMaxAge<Fn> | ExpireConfig<Fn>;
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
    isArgEqual?: 'deep' | 'shallow' | BaseOptions<Fn>['isArgEqual'];
    /**
     * The maximum number of args to consider for caching.
     */
    maxArgs?: number;
    /**
     * Whether the function wrapped is a React component.
     */
    react?: boolean | '19' | '18' | '17' | '16';
    /**
     * Whether to serialize the arguments into a string value for cache
     * purposes. A custom serializer can also be provided, if the default
     * one is insufficient.
     *
     * This can potentially be faster than `isArgEqual: 'deep'` in rare
     * cases, but can also be used to provide a deep equal check that handles
     * circular references.
     */
    serialize?: boolean | Serialize;
    /**
     * The name to give this method when recording profiling stats.
     */
    statsName?: string;
};

export type Memoized<Fn extends Moizeable, Opts extends Options<Fn>> = Fn &
    Omit<BaseMemoized<Fn, BaseOptions<Fn>>, 'options'> & {
        /**
         * Options passed for the memoized method.
         */
        options: Opts;
    };

export type Moized<Fn extends Moizeable, Opts extends Options<Fn>> = Memoized<
    Fn,
    Opts
> & {
    expirationManager: ExpirationManager<Fn> | undefined;
    statsManager: StatsManager<Fn> | undefined;
};
