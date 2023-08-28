import type { Options, Plugin } from '../../../core';

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

        // @ts-expect-error - `o` is not surfaced on public API
        cache.o.resolve = new Set();

        if (cache.addons.async) {
            cache.on('add', (entry) => {
                // @ts-expect-error - `g` is not surfaced on public API
                const node = cache.g(entry.key);

                node.v = node.v.then(
                    (value: any) => {
                        node.v = Promise.resolve(value);

                        cache.has(node.k) &&
                            cache.notify('resolve', {
                                key: node.k,
                                value: node.v,
                            });
                        return value;
                    },
                    (error: Error) => {
                        cache.delete(node);
                        throw error;
                    }
                );
            });
        }

        return cache;
    };
};
