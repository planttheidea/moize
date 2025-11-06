import { memoize } from 'micro-memoize';
import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import type { Moized, Options } from './internalTypes';
import { getIsArgEqual, getIsKeyEqual, getTransformKey } from './options';

export function moize<Fn extends (...args: any[]) => any>(
    fn: Fn,
    options: Options<Fn> = {}
): Moized<Fn> {
    const { async, expires, forceUpdate, maxSize, react, statsProfile } =
        options;

    const isKeyEqual = getIsKeyEqual(options);
    const isArgEqual = isKeyEqual ? undefined : getIsArgEqual(options);
    const transformKey = getTransformKey(options);

    const microMemoizeOptions: MicroMemoizeOptions<Fn> = isKeyEqual
        ? { async, isKeyEqual, maxSize, transformKey }
        : { async, isArgEqual, maxSize, transformKey };

    let moized = memoize(fn, microMemoizeOptions) as Moized<Fn>;

    if (forceUpdate) {
        const baseMoized = moized;

        moized = Object.assign(function (this: any, ...args: Parameters<Fn>) {
            if (!forceUpdate(args)) {
                return baseMoized.apply(this, args);
            }

            const result = moized.fn.apply(this, args);

            moized.cache.set(args, result);

            return result;
        }, baseMoized);
    }

    // Override the `micro-memoize` options with the `options` passed.
    moized.options = options;

    return moized;
}
