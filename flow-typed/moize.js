declare module 'moize' {
  declare type Cache = {
    keys: Array<Array<any>>,
    size: number,
    values: Array<any>
  };

  declare type Options = {
    equals?: (cacheKeyArgument: any, keyArgument: any) => boolean,
    isDeepEqual?: boolean,
    isPromise?: boolean,
    isReact?: boolean,
    isSerialized?: boolean,
    matchesKey?: (cacheKey: Array<any>, key: Array<any>) => boolean,
    maxAge?: number,
    maxArgs?: number,
    maxSize?: number,
    onCacheAdd?: (cache: Cache) => void,
    onCacheChange?: (cache: Cache) => void,
    onCacheHit?: (cache: Cache) => void,
    onExpire?: (key: any) => void,
    profileName?: string,
    serializer?: (...args: any[]) => any,
    shouldSerializeFunctions?: boolean,
    transformArgs?: (args: any[]) => any[],
    updateExpire?: boolean
  };

  declare type Fn = (...args: any[]) => any;

  declare type Moizer<T> = (t: T) => T;

  declare export function collectStats(): void;

  declare export default {
    (options: Options): Fn,
    (fn: Fn, options?: Options): Fn,

    compose<T>(...fns: Array<Moizer<T>>): Moizer<T>,
    deep<T>(t: T, c?: Options): T,
    isMoized<T>(t: T): boolean,
    maxAge<T>(a: number): (t: T, c?: Options) => T,
    maxArgs<T>(a: number): (t: T, c?: Options) => T,
    maxSize<T>(a: number): (t: T, c?: Options) => T,
    promise<T>(t: T, c?: Options): T,
    react<T>(t: T, c?: Options): T,
    reactSimple<T>(t: T, c?: Options): T,
    serialize<T>(t: T, c?: Options): T,
    simple<T>(t: T, c?: Options): T
  };
}
