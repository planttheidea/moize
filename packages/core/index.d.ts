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

type OnChange<Fn extends (...args: any[]) => any> = (
    type: 'add' | 'delete' | 'hit' | 'resolved' | 'update',
    entry: CacheEntry<Fn>,
    cache: Cache<Fn>
) => void;
type KeyTransformer<Fn extends (...args: any[]) => any> = (
    args: Parameters<Fn>
) => Key;

export interface Options<Fn extends (...args: any[]) => any> {
    async?: boolean;
    maxSize?: number;
    matchesArg?: (a: Arg, b: Arg) => boolean;
    matchesKey?: (a: Key, b: Key) => boolean;
    onCache?: OnChange<Fn>;
    transformKey?: KeyTransformer<Fn>;
}

export type CacheSnapshot<Fn extends (...args: any[]) => any> = Array<{
    key: Key;
    value: ReturnType<Fn>;
}>;

export interface Memoized<Fn extends (...args: any[]) => any> {
    (...args: Parameters<Fn>): ReturnType<Fn>;

    cache: Cache<Fn>;
    fn: Fn;
    isMemoized: true;
    options: Options<Fn>;
}

export declare class Cache<Fn extends (...args: any[]) => any> {
    constructor(options: Options<Fn>);

    clear(): void;
    delete(node: CacheNode<Fn>): void;
    get(key: Key): ReturnType<Fn> | undefined;
    has(key: Key): boolean;
    set(key: Key, value: ReturnType<Fn>): CacheNode<Fn>;
    snapshot(): CacheSnapshot<Fn>;
}
