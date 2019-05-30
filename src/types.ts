import { MicroMemoize } from 'micro-memoize';

export type Dictionary<Type> = {
  [key: string]: Type;
  [index: number]: Type;
};

export type Handler = (...args: any[]) => any;

export type Options = Pick<
  MicroMemoize.Options,
  'isPromise' | 'maxSize' | 'onCacheAdd' | 'onCacheChange' | 'onCacheHit'
> &
  Dictionary<any> & {
    // micro-memoize options
    _mm?: MicroMemoize.Options;

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
    serializer?: (args: any[]) => [string];

    // transform the args prior to storage as key
    transformArgs?: (args: any[]) => any[];

    // should the expiration be updated when cache is hit
    updateExpire?: boolean;

    // should a location be calculated for stats
    useProfileNameLocation?: boolean;
  };

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

export interface ProfiledFunction extends Function {
  displayName?: string;
}

export type Cache = MicroMemoize.Cache & {
  expirations: Expirations;
  stats: StatsCache;
};

export type Moizable = Function &
  Dictionary<any> & {
    defaultProps?: Dictionary<any>;
    displayName?: string;
    propTypes?: Dictionary<Function>;
  };

export type Moizer<Fn extends Function> = (
  fn: Fn | Options | Moized<Fn>,
  options: Options,
) => Moized<Fn>;

export type Moized<Fn extends Function> = MicroMemoize.Memoized<Fn> &
  Dictionary<any> & {
    // native properties
    cache: Cache;
    fn: Fn;
    isMemoized: boolean;
    options: Options;
  };
