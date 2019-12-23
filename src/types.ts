import { MicroMemoize } from 'micro-memoize/src/types';

export type Dictionary<Type> = Record<number | string, Type>;

export type Serializer = (...args: any[]) => [string];

export type CacheHandler = (
    cache: MicroMemoize.Cache,
    options: Options,
    memoized: Moized<Moizeable>,
  ) => void;

export type CacheHandlers = {
    // handled for when an item is added to cache (overrides micro-memoize)
    onCacheAdd?: CacheHandler;

    // handled for when an item is added to cache (overrides micro-memoize)
    onCacheChange?: CacheHandler;

    // handled for when an item is added to cache (overrides micro-memoize)
    onCacheHit?: CacheHandler;
  };

export type Options = Pick<MicroMemoize.Options, 'isPromise' | 'maxSize'> &
    CacheHandlers & {
      // micro-memoize options
      _mm?: Omit<
        MicroMemoize.NormalizedOptions,
        'onCacheAdd' | 'onCacheChange' | 'onCacheHit'
      > &
        CacheHandlers;

      // custom equality comparator comparing a specific key argument
      equals?: (cacheKeyArgument: any, keyArgument: any) => boolean;

      // is key comparison done via deep equality
      isDeepEqual?: boolean;

      // is the method a functional React component
      isReact?: boolean;

      // is the react component memoized globally
      isReactGlobal?: boolean;

      // should the parameters be serialized instead of directly referenced
      isSerialized?: boolean;

      // custom equality comparator comparing the entire key
      matchesKey?: (cacheKey: any[], key: any[]) => boolean;

      // amount of time in milliseconds before the cache will expire
      maxAge?: number;

      // maximum number of arguments to use as key for caching
      maxArgs?: number;

      // a callback when a cache item expires
      onExpire?: (key: any) => boolean | void;

      // a custom name to associate stats for the method to
      profileName?: string;

      // provide a serializer and override default,
      serializer?: Serializer;

      // transform the args prior to storage as key
      transformArgs?: (args: any[]) => any[];

      // should the expiration be updated when cache is hit
      updateExpire?: boolean;

      // should a location be calculated for stats
      useProfileNameLocation?: boolean;
    } & Dictionary<any>;

export type Expiration = {
    expirationMethod: () => void;
    key: any[];
    timeoutId: number | NodeJS.Timer;
  };

export type Expirations = Expiration[] & {
    snapshot: Expiration[];
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
    isCollectingStats: boolean;
    profiles: { [key: string]: StatsProfile };
  };

export interface ProfiledFunction extends Fn {
    displayName?: string;
  }

export type Cache = MicroMemoize.Cache & {
    expirations: Expirations;
    stats: StatsCache;
  };

export type Fn = (...args: any[]) => any;

export type Moizeable = Fn &
    Dictionary<any> & {
      defaultProps?: Dictionary<any>;
      displayName?: string;
      propTypes?: Dictionary<Fn>;
    };

export type Moized<Fn extends Moizeable> = MicroMemoize.Memoized<Fn> & {
    // native properties
    cache: Cache;
    fn: Fn;
    isMemoized: true;
    options: Options;

    // added properties
    clear: () => boolean;
    delete: (key: MicroMemoize.Key) => boolean;
    get: (key: MicroMemoize.Key) => MicroMemoize.Value | void;
    getStats: () => StatsObject;
    has: (key: MicroMemoize.Key) => boolean;
    keys: () => MicroMemoize.Key[];
    set: (key: MicroMemoize.Key, value: MicroMemoize.Value) => boolean;
    values: () => MicroMemoize.Value[];
  };

export type Moizer<Fn extends Moizeable> = (
    fn: Fn,
    options: Options,
  ) => Moized<Fn>;
