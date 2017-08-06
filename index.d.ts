interface Config {
    equals?: (firstValue: any, secondValue: any) => boolean; // custom equality comparator
    isPromise?: boolean; // is the result a promise
    isReact?: boolean; // is the method a functional React component
    maxAge?: number; // amount of time in milliseconds before the cache will expire
    maxArgs?: number; // maximum number of arguments to use as key for caching
    maxSize?: number; // maximum size of cache for this method
    onExpire?: (key: any) => void; // a callback when a cache item expires
    promiseLibrary?: PromiseLibrary<any>; // provide a promise library to be used and override default
    serialize?: boolean; // should the parameters be serialized instead of directly referenced
    serializeFunctions?: boolean; // should functions be included in the serialization of multiple parameters
    serializer?: (...args: any[]) => any; // provide a serializer and override default,
    transformArgs?: (args: any[]) => any[]; // transform the args prior to storage as key
}

interface PromiseLibrary<T> {
    (callback: (resolve: (r?: T | PromiseLike<T>) => void, reject: (e?: any) => void) => void): PromiseLike<T>;
    reject: (err: Error) => any;
    resolve: (v: T) => any;
}

type Fn = (...args: any[]) => any;

type Moizer<T extends Fn> = (t: T) => T;

declare function moize<T extends Fn>(c: Config): ((t: T) => T);
declare function moize<T extends Fn>(t: T, c?: Config): T;

declare namespace moize {
    function maxAge<T extends Fn>(a: number): (t: T) => T;
    function maxArgs<T extends Fn>(a: number): (t: T) => T;
    function maxSize<T extends Fn>(a: number): (t: T) => T;
    function promise<T extends Fn>(t: T): T;
    function react<T extends Fn>(t: T): T;
    function reactSimple<T extends Fn>(t: T): T;
    function serialize<T extends Fn>(t: T): T;
    function simple<T extends Fn>(t: T): T;

    function compose<T extends Fn>(...fns: Array<Moizer<T>>): Moizer<T>;
}

export default moize;
