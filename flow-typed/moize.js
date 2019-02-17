declare module 'moize' {
  type ReactComponent = Function & {
    contextTypes?: Object;
    defaultProps?: Object;
    displayName?: string;
    propTypes?: Object;
  }

  declare type Cache = {
    keys: any[][],
    size: number,
    values: any[],
  };

  declare type Options = {
    [key: string]: any,
    [index: number]: any,

    // custom equality comparator comparing a specific key argument
    equals?: (cacheKeyArgument: any, keyArgument: any) => boolean,

    // is key comparison done via deep equality
    isDeepEqual?: boolean,

    // is the result a promise
    isPromise?: boolean,

    // is the method a functional React component
    isReact?: boolean,

    // should the parameters be serialized instead of directly referenced
    isSerialized?: boolean,

    // custom equality comparator comparing the entire key
    matchesKey?: (cacheKey: any[], key: any[]) => boolean,

    // amount of time in milliseconds before the cache will expire
    maxAge?: number,

    // maximum number of arguments to use as key for caching
    maxArgs?: number,

    // maximum size of cache for this method
    maxSize?: number,

    // a callback when a new cache item is added
    onCacheAdd?: (cache: Cache, options: Options, moized: Function) => void,

    // a callback when the cache changes
    onCacheChange?: (cache: Cache, options: Options, moized: Function) => void,

    // a callback when an existing cache item is retrieved
    onCacheHit?: (cache: Cache, options: Options, moized: Function) => void,

    // a callback when a cache item expires
    onExpire?: (key: any) => boolean | void,

    // a custom name to associate stats for the method to
    profileName?: string,

    // provide a serializer and override default,
    serializer?: (args: any[]) => any[],

    // should functions be included in the serialization of multiple parameters
    shouldSerializeFunctions?: boolean,

    // transform the args prior to storage as key
    transformArgs?: (args: any[]) => any[],

    // should the expiration be updated when cache is hit
    updateExpire?: boolean,
  };

  declare type Cache = {
    keys: any[][],
    size: number,
    values: any[],
  };

  declare type Expiration = {
    expirationMethod: () => void,
    key: any[],
    timeoutId: number | NodeJS.Timer,
  };

  declare type StatsProfile = {
    calls: number;
    hits: number;
  };

  declare type StatsObject = StatsProfile & {
    profiles?: { [key: string]: StatsProfile };
    usage: string;
  };

  declare type StatsCache = {
    anonymousProfileNameCounter: number;
    isCollectingStats: boolean;
    profiles: { [key: string]: StatsProfile };
  };

  export interface ProfileFunction extends Function {
    displayName: string;
  }

  declare type AugmentationOptions = {
    expirations: Expiration[];
    options: Options;
    originalFunction: ReactComponent;
  };

  declare type Moizer = (
    fn: T | Options | ReactComponent | Moizer,
    options?: Options,
  ) => T | Moizer<T>;

  declare type Moized = Function & {
    _microMemoizeOptions: MicroMemoizeOptions;
    add: (key: any[], value: any) => boolean;
    cache: Cache;
    cacheSnapshot: Cache;
    clear: () => void;
    contextTypes?: Object;
    defaultProps?: Object;
    displayName?: string;
    expirations: Expiration[];
    expirationsSnapshot: Expiration[];
    get: (key: any[]) => any;
    getStats: () => Moize.StatsObject;
    has: (key: any[]) => boolean;
    isCollectingStats: boolean;
    isMoized: boolean;
    keys: () => any[];
    options: Options;
    originalFunction: Function;
    propTypes?: Object;
    remove: (key: any[]) => boolean;
    update: (key: any[], value: any) => boolean;
    values: () => any[];
  }

  declare export default {
    (options: Options): Fn,
    (fn: Fn, options?: Options): Fn,

    collectStats(): void,
    compose<T>(...functions: Moizer<T>[]): Moizer<T>,
    deep<T>(fn: T, options?: Options): T,
    getStats(profileName?: string): StatsProfile,
    isCollectingStats(): boolean,
    isMoized<T>(t: T): boolean,
    maxAge<T>(age: number): Moizer,
    maxArgs<T>(size: number): Moizer,
    maxSize<T>(size: number): Moizer,
    promise<T>(fn: T, options?: Options): T,
    react<T>(fn: T, options?: Options): T,
    reactSimple<T>(fn: T, options?: Options): T,
    serialize<T>(fn: T, options?: Options): T,
    simple<T>(fn: T, options?: Options): T,
  };
}
