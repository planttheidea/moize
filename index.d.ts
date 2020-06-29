/* eslint-disable */

import { MicroMemoize } from 'micro-memoize/src/types';

export type Fn<Arg extends any = any, Result extends any = any> = (
    ...args: Arg[]
) => Result;

export type FunctionalComponent<Props extends object> = Fn<Props> & {
    displayName?: string;
};

export type Key<Arg extends any = any> = Arg[];
export type Value = any;

export type Cache = MicroMemoize.Cache;
export type MicroMemoizeOptions = MicroMemoize.Options;

export type Expiration = {
    expirationMethod: () => void;
    key: Key;
    timeoutId: ReturnType<typeof setTimeout>;
};

export type OnCacheOperation = (
    cache: Cache,
    options: Options,
    moized: (...args: any[]) => any
) => void;

export type IsEqual = (cacheKeyArg: any, keyArg: any) => boolean;
export type IsMatchingKey = (cacheKey: Key, key: Key) => boolean;
export type OnExpire = (key: Key) => any;
export type Serialize = (key: Key) => string[];
export type TransformKey = (key: Key) => Key;
export type UpdateCacheForKey = (key: Key) => boolean;

export type Options = Partial<{
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
    onCacheAdd: OnCacheOperation;
    onCacheChange: OnCacheOperation;
    onCacheHit: OnCacheOperation;
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

export type Moizeable = Fn & Record<string, any>;

export type Memoized<OriginalFn extends Moizeable> = MicroMemoize.Memoized<
    OriginalFn
>;

export type Moized<
    OriginalFn extends Moizeable = Moizeable,
    CombinedOptions extends Options = Options
> = Memoized<OriginalFn> & {
    // values
    _microMemoizeOptions: Pick<
        CombinedOptions,
        'isPromise' | 'maxSize' | 'onCacheAdd' | 'onCacheChange' | 'onCacheHit'
    > & {
        isEqual: CombinedOptions['matchesArg'];
        isMatchingKey: CombinedOptions['matchesKey'];
        transformKey: CombinedOptions['transformArgs'];
    };
    cache: Cache;
    cacheSnapshot: Cache;
    expirations: Expiration[];
    expirationsSnapshot: Expiration[];
    options: CombinedOptions;
    originalFunction: OriginalFn;

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
    keys: () => Cache['keys'];
    remove: (key: Key) => void;
    set: (key: Key, value: any) => void;
    values: () => Cache['values'];
};

export type MoizeConfiguration<OriginalFn extends Moizeable> = {
    expirations: Expiration[];
    options: Options;
    originalFunction: OriginalFn;
};

export type CurriedMoize<OriginalOptions> = <
    CurriedFn extends Moizeable,
    CurriedOptions extends Options
>(
    curriedFn: CurriedFn | CurriedOptions,
    curriedOptions?: CurriedOptions
) =>
    | Moized<CurriedFn, OriginalOptions & CurriedOptions>
    | CurriedMoize<OriginalOptions & CurriedOptions>;

export interface MaxAge {
    <MaxAge extends number>(maxAge: MaxAge): Moize<{ maxAge: MaxAge }>;
    <MaxAge extends number, UpdateExpire extends boolean>(
        maxAge: MaxAge,
        expireOptions: UpdateExpire
    ): Moize<{ maxAge: MaxAge; updateExpire: UpdateExpire }>;
    <MaxAge extends number, ExpireHandler extends OnExpire>(
        maxAge: MaxAge,
        expireOptions: ExpireHandler
    ): Moize<{ maxAge: MaxAge; onExpire: ExpireHandler }>;
    <
        MaxAge extends number,
        ExpireHandler extends OnExpire,
        ExpireOptions extends {
            onExpire: ExpireHandler;
        }
    >(
        maxAge: MaxAge,
        expireOptions: ExpireOptions
    ): Moize<{ maxAge: MaxAge; onExpire: ExpireOptions['onExpire'] }>;
    <
        MaxAge extends number,
        UpdateExpire extends boolean,
        ExpireOptions extends {
            updateExpire: UpdateExpire;
        }
    >(
        maxAge: MaxAge,
        expireOptions: ExpireOptions
    ): Moize<{ maxAge: MaxAge; updateExpire: UpdateExpire }>;
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
    ): Moize<{
        maxAge: MaxAge;
        onExpire: ExpireHandler;
        updateExpire: UpdateExpire;
    }>;
}

export interface Moize<DefaultOptions extends Options = Options> {
    <Fn extends Moizeable>(fn: Fn): Moized<Fn, Options & DefaultOptions>;
    <Fn extends Moizeable, PassedOptions extends Options>(
        fn: Fn,
        options: PassedOptions
    ): Moized<Fn, Options & DefaultOptions & PassedOptions>;
    <Fn extends Moized<Moizeable>>(fn: Fn): Moized<
        Fn['fn'],
        Options & DefaultOptions
    >;
    <Fn extends Moized<Moizeable>, PassedOptions extends Options>(
        fn: Fn,
        options: PassedOptions
    ): Moized<Fn['fn'], Options & DefaultOptions & PassedOptions>;
    <PassedOptions extends Options>(options: PassedOptions): Moize<
        PassedOptions
    >;

    clearStats: (profileName?: string) => void;
    collectStats: (isCollectingStats?: boolean) => void;
    compose: (...moizers: Moize[]) => Moize;
    deep: Moize<{ isDeepEqual: true }>;
    getStats: (profileName?: string) => StatsObject;
    infinite: Moize;
    isCollectingStats: () => boolean;
    isMoized: (value: any) => value is Moized;
    matchesArg: <Matcher extends IsEqual>(
        argMatcher: Matcher
    ) => Moize<{ matchesArg: Matcher }>;
    matchesKey: <Matcher extends IsMatchingKey>(
        keyMatcher: Matcher
    ) => Moize<{ matchesKey: Matcher }>;
    maxAge: MaxAge;
    maxArgs: <MaxArgs extends number>(
        args: MaxArgs
    ) => Moize<{ maxArgs: MaxArgs }>;
    maxSize: <MaxSize extends number>(
        size: MaxSize
    ) => Moize<{ maxSize: MaxSize }>;
    profile: <ProfileName extends string>(
        profileName: ProfileName
    ) => Moize<{ profileName: ProfileName }>;
    promise: Moize<{ isPromise: true }>;
    react: Moize<{ isReact: true }>;
    serialize: Moize<{ isSerialized: true }>;
    serializeWith: <Serializer extends Serialize>(
        serializer: Serializer
    ) => Moize<{ isSerialized: true; serializer: Serializer }>;
    shallow: Moize<{ isShallowEqual: true }>;
    transformArgs: <Transformer extends TransformKey>(
        transformer: Transformer
    ) => Moize<{ transformArgs: Transformer }>;
    updateCacheForKey: <UpdateWhen extends UpdateCacheForKey>(
        updateCacheForKey: UpdateWhen
    ) => Moize<{ updateCacheForKey: UpdateWhen }>;
}

declare const moize: Moize;

export default moize;
