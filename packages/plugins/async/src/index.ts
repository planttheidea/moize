import type {
    Cache,
    CacheChangeListener,
    Options,
    Plugin,
} from '../../../core';

export interface AddonOptions {
    async: boolean;
}

export const asyncPlugin: Plugin<AddonOptions> = function asyncPlugin(
    createCache
) {
    return function createAsyncCache<Fn extends (...args: any[]) => any>(
        options: Options<Fn, AddonOptions>
    ) {
        const cache = createCache(options as any);
        const resolveListeners: Array<
            CacheChangeListener<Fn, Cache<Fn, AddonOptions>>
            // @ts-expect-error - `o` is not surfaced on public API
        > = (cache.o.resolve = []);
        const rejectListeners: Array<
            CacheChangeListener<Fn, Cache<Fn, AddonOptions>>
            // @ts-expect-error - `o` is not surfaced on public API
        > = (cache.o.reject = []);

        if (cache.addons.async) {
            cache.on('add', (entry) => {
                // @ts-expect-error - `g` is not surfaced on public API
                const node = cache.g(entry.key);

                node.v = node.v.then(
                    (value: any) => {
                        node.v = Promise.resolve(value);

                        resolveListeners.length &&
                            cache.has(node.k) &&
                            // @ts-expect-error - `b` is not surfaced on public API
                            cache.b('resolve', { key: node.k, value: node.v });
                        return value;
                    },
                    (error: Error) => {
                        const hasEntry = cache.has(entry.key);

                        cache.delete(entry.key);

                        rejectListeners.length &&
                            hasEntry &&
                            // @ts-expect-error - `b` is not surfaced on public API
                            cache.b('reject', entry);
                        throw error;
                    }
                );
            });
        }

        return cache;
    };
};
