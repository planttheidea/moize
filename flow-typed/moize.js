declare module 'moize' {
  declare type PromiseLike<R> = {
    then<U>(onFulfill?: (value: R) => Promise<U> | U, onReject?: (error: any) => Promise<U> | U): Promise<U>
  };

  declare type PromiseLibrary<T> = {
    (callback: (resolve: (r?: T | PromiseLike<T>) => void, reject: (e?: any) => void) => void): PromiseLike<T>,
    reject: (err: Error) => any,
    resolve: (v: T) => any
  };

  declare type Config = {
    equals?: (firstValue: any, secondValue: any) => boolean,
    isPromise?: boolean,
    isReact?: boolean,
    maxAge?: number,
    maxArgs?: number,
    maxSize?: number,
    onExpire?: (key: any) => void,
    promiseLibrary?: PromiseLibrary<any>,
    serialize?: boolean,
    serializeFunctions?: boolean,
    serializer?: (...args: any[]) => any,
    transformArgs?: (args: any[]) => any[],
    updateExpire?: boolean
  };

  declare type Fn = (...args: any[]) => any;

  declare type Moizer<T> = (t: T) => T;

  declare module.exports: {
    (config: Config): Fn,
    (fn: Fn, config?: Config): Fn,

    maxAge<T>(a: number): (t: T, c?: Config) => T,
    maxArgs<T>(a: number): (t: T, c?: Config) => T,
    maxSize<T>(a: number): (t: T, c?: Config) => T,
    promise<T>(t: T, c?: Config): T,
    react<T>(t: T, c?: Config): T,
    reactSimple<T>(t: T, c?: Config): T,
    serialize<T>(t: T, c?: Config): T,
    simple<T>(t: T, c?: Config): T,
    compose<T>(...fns: Array<Moizer<T>>): Moizer<T>
  };
}
