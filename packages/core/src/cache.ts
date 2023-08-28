import type {
    Arg,
    CacheChangeListener,
    CacheChangeType,
    CacheEntry,
    CacheNode,
    CacheSnapshot,
    CreateCache,
    GetAddonOptions,
    Key,
    Options,
    Plugin,
} from '../index.d';
import { cloneKey, getDefault, getEntry, sameValueZero } from './utils';

type CacheChangeListenerMap<
    Fn extends (...args: any[]) => any,
    CacheInstance extends Cache<Fn, any>
> = Record<CacheChangeType, Array<CacheChangeListener<Fn, CacheInstance>>>;

const CACHE_CHANGE_TYPES: CacheChangeType[] = [
    'add',
    'delete',
    'hit',
    'update',
];
const NATIVE_OPTIONS = ['matchesArg', 'matchesKey', 'maxSize'];

export class Cache<
    Fn extends (...args: any[]) => any,
    AddonOptions extends object = object
> {
    addons: AddonOptions;

    private a: (a: Arg, b: Arg) => boolean;
    private c: boolean;
    private h: CacheNode<Fn> | null = null;
    private k: ((args: Parameters<Fn>) => Key) | undefined;
    private l: number;
    private m: (a: Key, b: Key) => boolean;
    private o: CacheChangeListenerMap<Fn, this>;
    private s = 0;
    private t: CacheNode<Fn> | null = null;

    constructor(options: Options<Fn, AddonOptions>) {
        const transformKey = getDefault('function', options.transformKey);

        this.a = getDefault('function', options.matchesArg, sameValueZero);
        this.l = getDefault('number', options.maxSize, 1);
        this.m = getDefault('function', options.matchesKey, this.e);
        this.o = CACHE_CHANGE_TYPES.reduce<CacheChangeListenerMap<Fn, this>>(
            (map, type) => {
                map[type] = [];
                return map;
            },
            {} as CacheChangeListenerMap<Fn, this>
        );

        this.c = !!transformKey || options.matchesKey === this.m;
        this.k = this.c
            ? transformKey
                ? (args: Parameters<Fn>) => transformKey(cloneKey<Fn>(args))
                : cloneKey
            : undefined;

        this.addons = {} as AddonOptions;

        Object.keys(options).forEach((option) => {
            if (!NATIVE_OPTIONS.includes(option)) {
                const key = option as keyof AddonOptions;

                this.addons[key] = options[key];
            }
        });
    }

    clear(): void {
        this.h = this.t = null;
        this.s = 0;
    }

    delete(key: Key): void {
        const node = this.g(key, false);

        if (node) {
            this.d(node);
        }
    }

    get(key: Key): ReturnType<Fn> | undefined {
        const node = this.g(key, false);

        return node && node.v;
    }

    has(key: Key): boolean {
        return !!this.g(key, false);
    }

    hydrate(entries: Array<CacheEntry<Fn>>): void {
        entries.forEach((entry) => {
            const existingNode = this.g(entry.key, false);

            if (existingNode) {
                this.u(existingNode, false);
            } else {
                this.n(entry.key, entry.value, false);
            }
        });
    }

    on(
        type: CacheChangeType,
        listener: (entry: CacheEntry<Fn>, cache: this) => void
    ) {
        const listeners = this.o[type];

        if (listeners.indexOf(listener) === -1) {
            listeners.push(listener);
        }

        return () => {
            const index = listeners.indexOf(listener);

            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    }

    set(key: Key, value: ReturnType<Fn>): void {
        const existingNode = this.g(key, false);

        if (!existingNode) {
            this.n(key, value, true);
        }

        existingNode.v = value;

        if (existingNode !== this.h) {
            this.u(existingNode, true);
        }
    }

    snapshot(): CacheSnapshot<Fn> {
        const cached: CacheSnapshot<Fn> = [];

        let node = this.h;

        while (node != null) {
            cached.push(getEntry(node));
            node = node.n;
        }

        return cached;
    }

    private b(type: CacheChangeType, entry: CacheEntry<Fn>): void {
        this.o[type].forEach((listener) => {
            listener(entry, this);
        });
    }

    private d(node: CacheNode<Fn>): void {
        const next = node.n;
        const prev = node.p;

        if (next) {
            next.p = prev;
        } else {
            this.t = prev;
        }

        if (prev) {
            prev.n = next;
        } else {
            this.h = next;
        }

        --this.s;

        this.o.delete.length && this.b('delete', getEntry(node));
    }

    private e(prevKey: Key, nextKey: Key): boolean {
        const length = nextKey.length;

        if (prevKey.length !== length) {
            return false;
        }

        if (length === 1) {
            return this.a(prevKey[0], nextKey[0]);
        }

        for (let index = 0; index < length; ++index) {
            if (!this.a(prevKey[index], nextKey[index])) {
                return false;
            }
        }

        return true;
    }

    private g(key: Key, notify: boolean): CacheNode<Fn> | undefined {
        if (!this.h) {
            return;
        }

        if (this.m(this.h.k, key)) {
            notify && this.o.hit.length && this.b('hit', getEntry(this.h));
            return this.h;
        }

        if (this.h === this.t) {
            return;
        }

        let cached: CacheNode<Fn> | null = this.h.n;

        while (cached) {
            if (this.m(cached.k, key)) {
                this.u(cached, notify);
                return cached;
            }

            cached = cached.n;
        }
    }

    private n(key: Key, value: ReturnType<Fn>, notify: boolean): CacheNode<Fn> {
        const prevHead = this.h;
        const prevTail = this.t;
        const node: CacheNode<Fn> = { k: key, n: prevHead, p: null, v: value };

        this.h = node;

        if (prevHead) {
            prevHead.p = node;
        } else {
            this.t = node;
        }

        if (++this.s > this.l && prevTail) {
            this.d(prevTail);
        }

        notify && this.o.add.length && this.b('add', getEntry(node));

        return node;
    }

    private u(node: CacheNode<Fn>, notify: boolean): void {
        const next = node.n;
        const prev = node.p;

        if (next) {
            next.p = prev;
        }

        if (prev) {
            prev.n = next;
        }

        this.h!.p = node;
        node.n = this.h;
        node.p = null;
        this.h = node;

        if (node === this.t) {
            this.t = prev;
        }

        notify && this.o.update.length && this.b('update', getEntry(node));
    }
}

export function createCacheCreator<
    Fn extends (...args: any[]) => any,
    Plugins extends Array<Plugin<any>>
>(plugins: Plugins) {
    type AddonOptions = GetAddonOptions<Plugins, {}>;

    const createCache: CreateCache<Fn, AddonOptions> = function createCache(
        options: Options<Fn, AddonOptions>
    ): Cache<Fn, AddonOptions> {
        return new Cache<Fn, AddonOptions>(options);
    };

    if (plugins.length === 0) {
        return createCache;
    }

    if (plugins.length === 1) {
        return plugins[0](createCache);
    }

    return plugins.reduce(
        (composed, plugin) => (options: any) => composed(plugin(options))
    ) as unknown as CreateCache<Fn, AddonOptions>;
}
