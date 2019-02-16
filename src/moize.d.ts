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
    keys: Array<Array<any>>;
    size: number;
    values: Array<any>;
  };

  export type Expiration = {
    expirationMethod: () => void;
    key: any[];
    timeoutId: number | NodeJS.Timer;
  };

  export type Options = {
    [key: string]: any;
    [index: number]: any;
    equals?: (cacheKeyArgument: any, keyArgument: any) => boolean; // custom equality comparator comparing a specific key argument
    isDeepEqual?: boolean; // is key comparison done via deep equality
    isPromise?: boolean; // is the result a promise
    isReact?: boolean; // is the method a functional React component
    isSerialized?: boolean; // should the parameters be serialized instead of directly referenced
    matchesKey?: (cacheKey: any[], key: any[]) => boolean; // custom equality comparator comparing the entire key
    maxAge?: number; // amount of time in milliseconds before the cache will expire
    maxArgs?: number; // maximum number of arguments to use as key for caching
    maxSize?: number; // maximum size of cache for this method
    onCacheAdd?: (cache: Cache, options: Options, moized: Function) => void; // a callback when a new cache item is added
    onCacheChange?: (cache: Cache, options: Options, moized: Function) => void; // a callback when the cache changes
    onCacheHit?: (cache: Cache, options: Options, moized: Function) => void; // a callback when an existing cache item is retrieved
    onExpire?: (key: any) => boolean | void; // a callback when a cache item expires
    profileName?: string; // a custom name to associate stats for the method to
    serializer?: (...args: any[]) => any; // provide a serializer and override default,
    shouldSerializeFunctions?: boolean; // should functions be included in the serialization of multiple parameters
    transformArgs?: (args: any[]) => any[]; // transform the args prior to storage as key
    updateExpire?: boolean; // should the expiration be updated when cache is hit
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
