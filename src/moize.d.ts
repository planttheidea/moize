/* eslint-disable */

interface ReactComponent extends Function {
  contextTypes?: Object;
  defaultProps?: Object;
  displayName?: string;
  propTypes?: Object;
}

type MicroMemoizeOptions = {
  isEqual?: (firstValue: any, secondValue: any) => boolean;
  isMatchingKey?: (cacheKey: Array<any>, key: Array<any>) => boolean;
  isPromise?: boolean;
  maxSize?: number;
  onCacheAdd?: (cache: Cache, options: Object, memoized: Function) => void;
  onCacheChange?: (cache: Cache, options: Object, memoized: Function) => void;
  onCacheHit?: (cache: Cache, options: Object, memoized: Function) => void;
  transformKey?: (args: any[]) => any;
};

declare namespace Moize {
  export type Cache = {
    keys: (any[])[];
    size: number;
    values: any[];
  };

  export type Expiration = {
    expirationMethod: () => void;
    key: any[];
    timeoutId: number | NodeJS.Timer;
  };

  export type Options = {
    [key: string]: any;
    [index: number]: any;

    // custom equality comparator comparing a specific key argument
    equals?: (cacheKeyArgument: any, keyArgument: any) => boolean;

    // is key comparison done via deep equality
    isDeepEqual?: boolean;

    // is the result a promise
    isPromise?: boolean;

    // is the method a functional React component
    isReact?: boolean;

    // should the parameters be serialized instead of directly referenced
    isSerialized?: boolean;

    // custom equality comparator comparing the entire key
    matchesKey?: (cacheKey: any[], key: any[]) => boolean;

    // amount of time in milliseconds before the cache will expire
    maxAge?: number;

    // maximum number of arguments to use as key for caching
    maxArgs?: number;

    // maximum size of cache for this method
    maxSize?: number;

    // a callback when a new cache item is added
    onCacheAdd?: (cache: Cache, options: Options, moized: Function) => void;

    // a callback when the cache changes
    onCacheChange?: (cache: Cache, options: Options, moized: Function) => void;

    // a callback when an existing cache item is retrieved
    onCacheHit?: (cache: Cache, options: Options, moized: Function) => void;

    // a callback when a cache item expires
    onExpire?: (key: any) => boolean | void;

    // a custom name to associate stats for the method to
    profileName?: string;

    // provide a serializer and override default,
    serializer?: (args: any[]) => any[];

    // should functions be included in the serialization of multiple parameters
    shouldSerializeFunctions?: boolean;

    // transform the args prior to storage as key
    transformArgs?: (args: any[]) => any[];

    // should the expiration be updated when cache is hit
    updateExpire?: boolean;
  };

  export type StatsProfile = {
    calls: number;
    hits: number;
  };

  export type StatsObject = StatsProfile & {
    profiles?: { [key: string]: StatsProfile };
    usage: string;
  };

  export type StatsCache = {
    anonymousProfileNameCounter: number;
    isCollectingStats: boolean;
    profiles: { [key: string]: StatsProfile };
  };

  export interface ProfileFunction extends Function {
    displayName: string;
  }

  export type AugmentationOptions = {
    expirations: Expiration[];
    options: Options;
    originalFunction: ReactComponent;
  };

  export type Moizer<T extends Function> = (
    fn: T | Options,
    options?: Options,
  ) => T | Moizer<T>;

  export interface Moized extends Function {
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
}

interface moize extends Function {
  collectStats: () => void;
  compose: (...args: Function[]) => Function;
  getStats: () => Moize.StatsObject;
  isCollectingStats: () => boolean;
  isMoized: (fn: Function | Moize.Moized) => boolean;
  maxAge: (age: number) => Moize.Moizer<Function>;
  maxArgs: (args: number) => Moize.Moizer<Function>;
  maxSize: (size: number) => Moize.Moizer<Function>;
}
