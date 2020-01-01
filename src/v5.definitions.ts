export as namespace moize;
export default moize;

declare function moize<O extends moize.Options>(
  options: O
): <Fn extends moize.Fn>(fn: Fn) => moize.Moized<Fn, moize.Options & O>;
declare function moize<Fn extends moize.Fn>(fn: Fn): moize.Moized<Fn>;
declare function moize<Fn extends moize.Fn, O extends moize.Options>(
  fn: Fn,
  options: O
): moize.Moized<Fn, moize.Options & O>;

declare namespace moize {
  export type Expiration = {
    expirationMethod: Function;
    key: Array<any>;
    timeoutId: number;
  };

  export type Moized<
    Method extends Fn = Fn,
    CombinedOptions extends Options = Options
  > = Method & {
    // values
    _microMemoizeOptions: Pick<
      CombinedOptions,
      "isPromise" | "maxSize" | "onCacheAdd" | "onCacheChange" | "onCacheHit"
    > & {
      isEqual: CombinedOptions["equals"];
      isMatchingKey: CombinedOptions["matchesKey"];
      transformKey: CombinedOptions["transformArgs"];
    };
    cache: Cache;
    expirations: Expiration[];
    expirationsSnapshot: Expiration[];
    options: CombinedOptions;
    originalFunction: Method;

    // methods
    add: (key: any[], value: any) => void;
    clear: () => void;
    get: (key: any[]) => any;
    getStats: () => StatsProfile;
    has: (key: any[]) => boolean;
    isCollectingStats: () => boolean;
    isMoized: () => true;
    keys: () => Cache["keys"];
    remove: (key: any[]) => void;
    update: (key: any[], value: any) => void;
    values: () => Cache["values"];
  };

  export type Fn = (...args: any[]) => any;
  // no longer used internally, but keeping for backwards compatibility
  export type Moizer<T extends Fn> = (t: T) => Moized<T>;

  export interface Cache {
    keys: Array<Array<any>>;
    size: number;
    values: Array<any>;
  }

  export type StatsProfile = {
    calls: number;
    hits: number;
  };

  export type StatsObject = {
    calls: number;
    hits: number;
    profiles?: {
      [key: string]: StatsProfile;
    };
    usage: string;
  };

  export interface Options {
    equals?: (cacheKeyArgument: any, keyArgument: any) => boolean; // custom equality comparator comparing a specific key argument
    isDeepEqual?: boolean; // is key comparison done via deep equality
    isPromise?: boolean; // is the result a promise
    isReact?: boolean; // is the method a functional React component
    isSerialized?: boolean; // should the parameters be serialized instead of directly referenced
    matchesKey?: (cacheKey: any[], key: any[]) => boolean; // custom equality comparator comparing the entire key
    maxAge?: number; // amount of time in milliseconds before the cache will expire
    maxArgs?: number; // maximum number of arguments to use as key for caching
    maxSize?: number; // maximum size of cache for this method
    onCacheAdd?: (cache: Cache) => void; // a callback when a new cache item is added
    onCacheChange?: (cache: Cache) => void; // a callback when the cache changes
    onCacheHit?: (cache: Cache) => void; // a callback when an existing cache item is retrieved
    onExpire?: (key: any) => void; // a callback when a cache item expires
    profileName?: string; // a custom name to associate stats for the method to
    serializer?: (...args: any[]) => string; // provide a serializer and override default,
    shouldSerializeFunctions?: boolean; // should functions be included in the serialization of multiple parameters
    transformArgs?: (args: any[]) => any[]; // transform the args prior to storage as key
    updateExpire?: boolean; // should the expiration be updated when cache is hit
  }

  function collectStats(): void;
  function compose(...fns: Array<typeof moize>): typeof moize;
  function deep<T extends Fn, O extends Options>(
    t: T,
    o?: Options
  ): Moized<T, O & { isDeepEqual: true }>;
  function getStats(profileName?: string): moize.StatsObject;
  function isCollectingStats(): boolean;
  function isMoized<T extends Fn>(t: T): boolean;
  function maxAge<T extends Fn, O extends Options, A extends number>(
    a: A
  ): (t: T, o?: Options) => Moized<T, O & { maxAge: A }>;
  function maxArgs<T extends Fn, O extends Options, A extends number>(
    a: A
  ): (t: T, o?: Options) => Moized<T, O & { maxArgs: A }>;
  function maxSize<T extends Fn, O extends Options, S extends number>(
    a: S
  ): (t: T, o?: Options) => Moized<T, O & { maxSize: S }>;
  function promise<T extends Fn, O extends Options>(
    t: T,
    o?: Options
  ): Moized<T, O & { isPromise: true }>;
  function react<T extends Fn, O extends Options>(
    t: T,
    o?: Options
  ): Moized<T, O & { isReact: true }>;
  function reactSimple<T extends Fn, O extends Options>(
    t: T,
    o?: Options
  ): Moized<T, O & { isReact: true; maxSize: 1 }>;
  function serialize<T extends Fn, O extends Options>(
    t: T,
    o?: O
  ): Moized<T, O & { isSerialized: true }>;
  function simple<T extends Fn, O extends Options>(
    t: T,
    o?: Options
  ): Moized<T, O & { maxSize: 1 }>;
}

export function collectStats(): void;
