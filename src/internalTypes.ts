import type {
    Options as BaseOptions,
    Cache,
    Key,
    Memoized as BaseMemoized,
} from 'micro-memoize';

export type ForceRefreshKey = (key: Key) => boolean;
export type GetMaxAge<Fn extends (...args: any) => any> = (
    key: Key,
    value: ReturnType<Fn>,
    cache: Cache<Fn>
) => number;
export type OnExpire = (key: Key) => any;
export type Serialize = (key: Key) => [string];

interface ExpireConfig<Fn extends (...args: any[]) => any> {
    after: number | GetMaxAge<Fn>;
    updateExpire?: boolean;
}

export type Options<Fn extends (...args: any[]) => any> = Omit<
    BaseOptions<Fn>,
    'isArgEqual'
> & {
    expires?: number | GetMaxAge<Fn> | ExpireConfig<Fn>;
    forceRefreshKey?: ForceRefreshKey;
    isArgEqual?: 'deep' | 'shallow' | BaseOptions<Fn>['isArgEqual'];
    maxArgs?: number;
    react?: boolean;
    serialize?: boolean | Serialize;
    statsProfile?: string;
};

export type Memoized<Fn extends (...args: any[]) => any> = Fn &
    Omit<BaseMemoized<Fn, BaseOptions<Fn>>, 'options'> & {
        /**
         * Options passed for the memoized method.
         */
        options: Options<Fn>;
    };

export type Moized<Fn extends (...args: any[]) => any> = Memoized<Fn> & {};
