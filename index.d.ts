/* eslint-disable */

import {
    Cache as BaseCache,
    Memoized as BaseMemoized,
    Options as BaseOptions,
} from 'micro-memoize';

export type AnyFn = (...args: any[]) => any;
export type Moizeable = AnyFn & Record<string, any>;

interface MoizedReactElement {
    type: any;
    props: any;
    key: string | number | null;
}

/**
 * @deprecated
 *
 * Use `AnyFn` instead, as it is more flexible and works better with type inference.
 */
export type Fn<Arg extends any = any, Result extends any = any> = (
    ...args: Arg[]
) => Result;

/**
 * @deprecated
 *
 * This should not longer need to be explicitly used, as inference of the function
 * returning the element should suffice.
 */
export type FunctionalComponent<Props extends object> = ((
    props: Props
) => MoizedReactElement) & {
    displayName?: string;
};

export type Key<Arg extends any = any> = Arg[];
export type Value = any;

export type Cache<MoizeableFn extends Moizeable = Moizeable> =
    BaseCache<MoizeableFn>;
export type MicroMemoizeOptions<MoizeableFn extends Moizeable = Moizeable> =
    BaseOptions<MoizeableFn>;

export type Expiration = {
    expirationMethod: () => void;
    key: Key;
    timeoutId: ReturnType<typeof setTimeout>;
};

export type OnCacheOperation<MoizeableFn extends Moizeable = Moizeable> = (
    cache: Cache<MoizeableFn>,
    options: Options<MoizeableFn>,
    moized: (...args: any[]) => any
) => void;

export type IsEqual = (cacheKeyArg: any, keyArg: any) => boolean;
export type IsMatchingKey = (cacheKey: Key, key: Key) => boolean;
export type OnExpire = (key: Key) => any;
export type Serialize = (key: Key) => string[];
export type TransformKey = (key: Key) => Key;
export type UpdateCacheForKey = (key: Key) => boolean;

export type Options<MoizeableFn extends Moizeable = Moizeable> = Partial<{
    isDeepEqual: boolean;
    isPromise: boolean;
    isReact: boolean;
    isSerialized: boolean;
    isShallowEqual: boolean;
    matchesArg: IsEqual;
    matchesKey: IsMatchingKey;
    maxAge: number;
    maxArgs: number;
    maxSize: number;
    onCacheAdd: OnCacheOperation<MoizeableFn>;
    onCacheChange: OnCacheOperation<MoizeableFn>;
    onCacheHit: OnCacheOperation<MoizeableFn>;
    onExpire: OnExpire;
    profileName: string;
    serializer: Serialize;
    transformArgs: TransformKey;
    updateCacheForKey: UpdateCacheForKey;
    updateExpire: boolean;
}>;

export type StatsProfile = {
    calls: number;
    hits: number;
};

export type StatsObject = {
    calls: number;
    hits: number;
    usage: string;
};

export type GlobalStatsObject = StatsObject & {
    profiles?: Record<string, StatsProfile>;
};

export type StatsCache = {
    anonymousProfileNameCounter: number;
    isCollectingStats: boolean;
    profiles: Record<string, StatsProfile>;
};

export type Memoized<MoizeableFn extends Moizeable = Moizeable> =
    BaseMemoized<MoizeableFn>;

export type Moized<
    MoizeableFn extends Moizeable = Moizeable,
    CombinedOptions extends Options<MoizeableFn> = Options<MoizeableFn>
> = Memoized<MoizeableFn> & {
    // values
    _microMemoizeOptions: Pick<
        CombinedOptions,
        'isPromise' | 'maxSize' | 'onCacheAdd' | 'onCacheChange' | 'onCacheHit'
    > & {
        isEqual: CombinedOptions['matchesArg'];
        isMatchingKey: CombinedOptions['matchesKey'];
        transformKey: CombinedOptions['transformArgs'];
    };
    cache: Cache<MoizeableFn>;
    cacheSnapshot: Cache<MoizeableFn>;
    expirations: Expiration[];
    expirationsSnapshot: Expiration[];
    options: CombinedOptions;
    originalFunction: MoizeableFn;

    // react-specific values
    contextTypes?: Record<string, Function>;
    defaultProps?: Record<string, unknown>;
    displayName?: string;
    propTypes: Record<string, Function>;

    // methods
    clear: () => void;
    clearStats: () => void;
    get: (key: Key) => any;
    getStats: () => StatsProfile;
    has: (key: Key) => boolean;
    isCollectingStats: () => boolean;
    isMoized: () => true;
    keys: () => Cache<MoizeableFn>['keys'];
    remove: (key: Key) => void;
    set: (key: Key, value: any) => void;
    values: () => Cache<MoizeableFn>['values'];
};

export type MoizeConfiguration<MoizeableFn extends Moizeable = Moizeable> = {
    expirations: Expiration[];
    options: Options<MoizeableFn>;
    originalFunction: MoizeableFn;
};

export type CurriedMoize<OriginalOptions> = <
    CurriedFn extends Moizeable,
    CurriedOptions extends Options<CurriedFn>
>(
    curriedFn: CurriedFn | CurriedOptions,
    curriedOptions?: CurriedOptions
) =>
    | Moized<CurriedFn, OriginalOptions & CurriedOptions>
    | CurriedMoize<OriginalOptions & CurriedOptions>;

export interface MaxAge {
    <MaxAge extends number>(maxAge: MaxAge): Moizer<{ maxAge: MaxAge }>;
    <MaxAge extends number, UpdateExpire extends boolean>(
        maxAge: MaxAge,
        expireOptions: UpdateExpire
    ): Moizer<{ maxAge: MaxAge; updateExpire: UpdateExpire }>;
    <MaxAge extends number, ExpireHandler extends OnExpire>(
        maxAge: MaxAge,
        expireOptions: ExpireHandler
    ): Moizer<{ maxAge: MaxAge; onExpire: ExpireHandler }>;
    <
        MaxAge extends number,
        ExpireHandler extends OnExpire,
        ExpireOptions extends {
            onExpire: ExpireHandler;
        }
    >(
        maxAge: MaxAge,
        expireOptions: ExpireOptions
    ): Moizer<{ maxAge: MaxAge; onExpire: ExpireOptions['onExpire'] }>;
    <
        MaxAge extends number,
        UpdateExpire extends boolean,
        ExpireOptions extends {
            updateExpire: UpdateExpire;
        }
    >(
        maxAge: MaxAge,
        expireOptions: ExpireOptions
    ): Moizer<{ maxAge: MaxAge; updateExpire: UpdateExpire }>;
    <
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
    ): Moizer<{
        maxAge: MaxAge;
        onExpire: ExpireHandler;
        updateExpire: UpdateExpire;
    }>;
}

export interface Moizer<
    DefaultOptions extends Options<Moizeable> = Options<Moizeable>
> {
    <MoizeableFn extends Moizeable>(fn: MoizeableFn): Moized<
        MoizeableFn,
        Options<MoizeableFn> & DefaultOptions
    >;
    <MoizeableFn extends Moizeable, PassedOptions extends Options<MoizeableFn>>(
        fn: MoizeableFn,
        options: PassedOptions
    ): Moized<
        MoizeableFn,
        Options<MoizeableFn> & DefaultOptions & PassedOptions
    >;
    <MoizedFn extends Moized<Moizeable>>(fn: MoizedFn): Moized<
        MoizedFn['fn'],
        Options<MoizedFn> & DefaultOptions
    >;
    <
        MoizedFn extends Moized<Moizeable>,
        PassedOptions extends Options<MoizedFn>
    >(
        fn: MoizedFn,
        options: PassedOptions
    ): Moized<
        MoizedFn['fn'],
        Options<MoizedFn> & DefaultOptions & PassedOptions
    >;
    <PassedOptions extends Options<Moizeable>>(
        options: PassedOptions
    ): Moizer<PassedOptions>;
}

export interface Moize<
    DefaultOptions extends Options<Moizeable> = Options<Moizeable>
> extends Moizer<DefaultOptions> {
    clearStats: (profileName?: string) => void;
    collectStats: (isCollectingStats?: boolean) => void;
    compose: (...moizers: Array<Moize | Moizer>) => Moizer;
    deep: Moizer<{ isDeepEqual: true }>;
    getStats: (profileName?: string) => StatsObject;
    infinite: Moizer;
    isCollectingStats: () => boolean;
    isMoized: (value: any) => value is Moized;
    matchesArg: <Matcher extends IsEqual>(
        argMatcher: Matcher
    ) => Moizer<{ matchesArg: Matcher }>;
    matchesKey: <Matcher extends IsMatchingKey>(
        keyMatcher: Matcher
    ) => Moizer<{ matchesKey: Matcher }>;
    maxAge: MaxAge;
    maxArgs: <MaxArgs extends number>(
        args: MaxArgs
    ) => Moizer<{ maxArgs: MaxArgs }>;
    maxSize: <MaxSize extends number>(
        size: MaxSize
    ) => Moizer<{ maxSize: MaxSize }>;
    profile: <ProfileName extends string>(
        profileName: ProfileName
    ) => Moizer<{ profileName: ProfileName }>;
    promise: Moizer<{ isPromise: true }>;
    react: Moizer<{ isReact: true }>;
    serialize: Moizer<{ isSerialized: true }>;
    serializeWith: <Serializer extends Serialize>(
        serializer: Serializer
    ) => Moizer<{ isSerialized: true; serializer: Serializer }>;
    shallow: Moizer<{ isShallowEqual: true }>;
    transformArgs: <Transformer extends TransformKey>(
        transformer: Transformer
    ) => Moizer<{ transformArgs: Transformer }>;
    updateCacheForKey: <UpdateWhen extends UpdateCacheForKey>(
        updateCacheForKey: UpdateWhen
    ) => Moizer<{ updateCacheForKey: UpdateWhen }>;
}

declare const moize: Moize;

export default moize;
