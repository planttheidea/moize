/* eslint-disable */

import { MicroMemoize } from 'micro-memoize';

export type Fn<Arg extends any = any, Result extends any = any> = (
    ...args: Arg[]
) => Result;

export type FunctionalComponent<Props extends object> = Fn<Props> & {
    displayName?: string;
};

export type Key = any[];
export type Value = any;

export type Cache = MicroMemoize.Cache;

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
export type TransformKey = (key: Key) => Key;

export type MicroMemoizeOptions = MicroMemoize.Options;

export type Serialize = (key: Key) => string[];

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
    serializer: (key: Key) => string[];
    transformArgs: Serialize;
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
    defaultProps?: Record<string, any>;
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

export interface Moize<DefaultOptions extends Options = Options>
    extends Moizeable {
    <Fn extends Moizeable, PassedOptions extends Options>(
        fn: Fn,
        options?: PassedOptions
    ): Moized<Fn, Options & DefaultOptions & PassedOptions>;
    <Fn extends Moized<Moizeable>, PassedOptions extends Options>(
        fn: Fn,
        options?: PassedOptions
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
    maxAge: <
        ExpireHandler extends OnExpire,
        UpdateExpire extends boolean,
        ExpireOptions extends {
            onExpire?: ExpireHandler;
            updateExpire?: UpdateExpire;
        },
        _OnExpire = ExpireHandler | UpdateExpire | ExpireOptions
    >(
        age: number,
        onExpire?: _OnExpire
    ) => _OnExpire extends ExpireHandler
        ? Moize<{ onExpire: _OnExpire; updateExpire: true }>
        : _OnExpire extends true
        ? Moize<{ updateExpire: true }>
        : _OnExpire extends UpdateExpire
        ? Moize<ExpireOptions>
        : Moize;
    maxArgs: (args: number) => Moize;
    maxSize: (size: number) => Moize;
    profile: (profileName: string) => Moize;
    promise: Moize<{ isPromise: true }>;
    react: Moize<{ isReact: true }>;
    serialize: Moize<{ isSerialized: true }>;
    serializeWith: <Serializer extends Serialize>(
        serializer: Serializer
    ) => Moize<{ isSerialized: true; serializer: Serializer }>;
    shallow: Moize<{ isShallowEqual: true }>;
    transformArgs: <Transformer extends (key: Key) => Key>(
        transformer: Transformer
    ) => Moize<{ transformArgs: Transformer }>;
}
