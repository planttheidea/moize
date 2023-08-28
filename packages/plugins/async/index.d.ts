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

export type CacheChangeType = 'add' | 'delete' | 'hit' | 'resolve' | 'update';
export type CacheChangeListener<
    Fn extends (...args: any[]) => any,
    CacheInstance extends Cache<Fn, object>
> = (entry: CacheEntry<Fn>, cache: CacheInstance) => void;

type KeyTransformer<Fn extends (...args: any[]) => any> = (
    args: Parameters<Fn>
) => Key;

export type Options<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object
> = {
    async?: boolean;
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
    AddonOptions extends object
> {
    (...args: Parameters<Fn>): ReturnType<Fn>;

    cache: Cache<Fn, AddonOptions>;
    fn: Fn;
    isMoized: true;
    options: Options<Fn, AddonOptions>;
}

export interface Plugin<AddonOptions extends object> {
    <Fn extends (...args: any[]) => any>(
        options: Options<Fn, AddonOptions>
    ): Cache<Fn, AddonOptions>;
}

export declare class Cache<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object = object
> {
    constructor(options: Options<Fn, AddonOptions>);

    clear(): void;
    delete(node: CacheNode<Fn>): void;
    get(key: Key): ReturnType<Fn> | undefined;
    has(key: Key): boolean;
    on(
        type: CacheChangeType,
        listener: CacheChangeListener<Fn, Cache<Fn, AddonOptions>>
    ): () => void;
    set(key: Key, value: ReturnType<Fn>): CacheNode<Fn>;
    snapshot(): CacheSnapshot<Fn>;
}
