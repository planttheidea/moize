export as namespace moize;
export default moize;

declare function moize<T extends moize.Fn>(o: moize.Cache): ((t: T) => T);
declare function moize<T extends moize.Fn>(t: T, o?: moize.Options): T;

declare namespace moize {
  export type Fn = (...args: any[]) => any;
  export type Moizer<T extends Fn> = (t: T) => T;

  export interface Cache {
    keys: Array<Array<any>>;
    size: number;
    values: Array<any>;
  }

  export interface Options {
    equals?: (cacheKeyArgument: any, keyArgument: any) => boolean; // custom equality comparator comparing a specific key argument
    isDeepEqual?: boolean; // is key comparison done via deep equality
    isPromise?: boolean; // is the result a promise
    isReact?: boolean; // is the method a functional React component
    isSerialized?: boolean; // should the parameters be serialized instead of directly referenced
    matchesKey?: (cacheKey: Array<any>, key: Array<any>) => boolean; // custom equality comparator comparing the entire key
    maxAge?: number; // amount of time in milliseconds before the cache will expire
    maxArgs?: number; // maximum number of arguments to use as key for caching
    maxSize?: number; // maximum size of cache for this method
    onCacheAdd?: (cache: Cache) => void; // a callback when a new cache item is added
    onCacheChange?: (cache: Cache) => void; // a callback when the cache changes
    onCacheHit?: (cache: Cache) => void; // a callback when an existing cache item is retrieved
    onExpire?: (key: any) => void; // a callback when a cache item expires
    profileName?: string; // a custom name to associate stats for the method to
    serializer?: (...args: any[]) => any; // provide a serializer and override default,
    shouldSerializeFunctions?: boolean; // should functions be included in the serialization of multiple parameters
    transformArgs?: (args: any[]) => any[]; // transform the args prior to storage as key
    updateExpire?: boolean; // should the expiration be updated when cache is hit
  }

  function compose<T extends Fn>(...fns: Array<Moizer<T>>): Moizer<T>;

  function deep<T extends Fn>(t: T, o?: Options): T;
  function isMoized<T extends Fn>(t: T): boolean;
  function maxAge<T extends Fn>(a: number): (t: T, o?: Options) => T;
  function maxArgs<T extends Fn>(a: number): (t: T, o?: Options) => T;
  function maxSize<T extends Fn>(a: number): (t: T, o?: Options) => T;
  function promise<T extends Fn>(t: T, o?: Options): T;
  function react<T extends Fn>(t: T, o?: Options): T;
  function reactSimple<T extends Fn>(t: T, o?: Options): T;
  function serialize<T extends Fn>(t: T, o?: Options): T;
  function simple<T extends Fn>(t: T, o?: Options): T;
}

export function collectStats<T extends moize.Fn>(): void;
