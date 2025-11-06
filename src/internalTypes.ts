import type {
    Options as BaseOptions,
    Cache,
    Key,
    Memoized as BaseMemoized,
} from 'micro-memoize';

export type ForceUpdate = (key: Key) => boolean;
export type GetMaxAge<Fn extends (...args: any) => any> = (
    key: Key,
    value: ReturnType<Fn>,
    cache: Cache<Fn>,
) => number;
export type OnExpire = (key: Key) => any;
export type Serialize = (key: Key) => [string];

interface ExpireConfig<Fn extends (...args: any[]) => any> {
    after: number | GetMaxAge<Fn>;
    updateExpire?: boolean;
}

export type Options<Fn extends (...args: any[]) => any> = Omit<
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
    forceUpdate?: ForceUpdate;
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
    react?: boolean;
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
    statsProfile?: string;
};

export type Memoized<Fn extends (...args: any[]) => any> = Fn &
    Omit<BaseMemoized<Fn, BaseOptions<Fn>>, 'options'> & {
        /**
         * Options passed for the memoized method.
         */
        options: Options<Fn>;
    };

export type Moized<Fn extends (...args: any[]) => any> = Memoized<Fn> & {};
