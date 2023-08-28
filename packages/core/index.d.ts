export type TupleFrom<Type> = [Type] | Type[];

export type RawKey = IArguments | Key;
export type Key = any[];
export type Arg = Key[number];

export interface CacheNode<Fn extends (...args: any[]) => any> {
    n: CacheNode<Fn> | null;
    p: CacheNode<Fn> | null;
    k: Key;
    v: ReturnType<Fn>;
}

export interface CacheEntry<Fn extends (...args: any[]) => any> {
    key: Key;
    value: ReturnType<Fn>;
}

export type CacheChangeType = string;
export type CacheChangeListener<
    Fn extends (...args: any[]) => any,
    CacheInstance extends Cache<Fn, object>
> = (entry: CacheEntry<Fn>, cache: CacheInstance) => void;

type KeyTransformer<Fn extends (...args: any[]) => any> = (
    args: Parameters<Fn>
) => Key;

export type Options<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object = {}
> = {
    maxSize?: number;
    matchesArg?: (a: Arg, b: Arg) => boolean;
    matchesKey?: (a: Key, b: Key) => boolean;
    transformKey?: KeyTransformer<Fn>;
} & {
    [Key in keyof AddonOptions]: AddonOptions[Key];
};

export type CacheSnapshot<Fn extends (...args: any[]) => any> = Array<{
    key: Key;
    value: ReturnType<Fn>;
}>;

export interface Moized<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object = {}
> {
    (...args: Parameters<Fn>): ReturnType<Fn>;

    cache: Cache<Fn, AddonOptions>;
    fn: Fn;
    isMoized: true;
    options: Options<Fn, AddonOptions>;
}

export type CreateCache<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object = {}
> = (options: Options<Fn, AddonOptions>) => Cache<Fn, AddonOptions>;

export type Plugin<AddonOptions extends object = {}> = <
    Fn extends (...args: any[]) => any
>(
    createCache: CreateCache<Fn, AddonOptions>
) => CreateCache<Fn, AddonOptions>;

export type OnlyAddonOptions<AllOptions extends Options<any, any>> = {
    [Key in keyof AllOptions as Exclude<
        Key,
        keyof Options<any, {}>
    >]: AllOptions[Key];
};

export type ExtractAddonOptions<AddonPlugin extends Plugin<any>> =
    OnlyAddonOptions<Parameters<Parameters<AddonPlugin>[0]>[0]>;

export type GetAddonOptions<
    Plugins extends TupleFrom<Plugin<any>>,
    AddonOptions extends object
> = Plugins extends [infer NextPlugin, ...infer RemainingPlugins]
    ? NextPlugin extends Plugin<any>
        ? RemainingPlugins extends Array<Plugin<any>>
            ? GetAddonOptions<
                  RemainingPlugins,
                  AddonOptions & ExtractAddonOptions<NextPlugin>
              >
            : AddonOptions
        : AddonOptions
    : AddonOptions;

export declare class Cache<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object = {}
> {
    constructor(options: Options<Fn, AddonOptions>);

    addons: AddonOptions;

    clear(): void;
    delete(key: Key): void;
    get(key: Key): ReturnType<Fn> | undefined;
    has(key: Key): boolean;
    on(
        type: CacheChangeType,
        listener: CacheChangeListener<Fn, Cache<Fn, AddonOptions>>
    ): () => void;
    set(key: Key, value: ReturnType<Fn>): void;
    snapshot(): CacheSnapshot<Fn>;
}
