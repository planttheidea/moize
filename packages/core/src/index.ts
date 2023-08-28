import type { GetAddonOptions, Key, Moized, Options, Plugin } from '../index.d';
import { createCacheCreator } from './cache';
import { cloneKey, isMoized } from './utils';

type Tuple<Type> = [Type] | Type[];

export function createMoize<Plugins extends Tuple<Plugin<any>>>(
    plugins: Plugins
) {
    type AddonOptions = GetAddonOptions<Plugins, {}>;

    function moize<Fn extends (...args: any[]) => any>(
        fn: Fn,
        additionalOptions?: Options<Fn, AddonOptions>
    ): Moized<Fn, AddonOptions>;
    function moize<Fn extends (...args: any[]) => any>(
        fn: Moized<Fn, AddonOptions>,
        additionalOptions?: Options<Fn, AddonOptions>
    ): Moized<Fn, AddonOptions>;
    function moize<Fn extends (...args: any[]) => any>(
        fn: Fn | Moized<Fn, AddonOptions>,
        additionalOptions: Options<Fn, AddonOptions> = {} as Options<
            Fn,
            AddonOptions
        >
    ): Moized<Fn, AddonOptions> {
        if (isMoized(fn)) {
            return moize(
                fn.fn,
                Object.assign({}, fn.options, additionalOptions)
            );
        }

        const options = additionalOptions || ({} as Options<Fn, AddonOptions>);
        const cache = createCacheCreator<Fn, Plugins>(plugins)(options);
        // @ts-expect-error - Capture internal properties not surfaced on public API
        const { k: transformKey } = cache;

        const moized: Moized<Fn, AddonOptions> = function moized(this: any) {
            const key: Key = transformKey ? transformKey(arguments) : arguments;
            // @ts-expect-error - `g` is not surfaced on public API
            let node = cache.g(key, true);

            if (node) {
                return node.v;
            }

            // @ts-expect-error - `n` is not surfaced on public API
            node = cache.n(
                transformKey ? key : cloneKey(key),
                fn.apply(this, key),
                true
            );

            return node.v;
        };

        moized.cache = cache;
        moized.fn = fn;
        moized.isMoized = true;
        moized.options = options;

        return moized;
    }

    return moize;
}

export default createMoize([]);
