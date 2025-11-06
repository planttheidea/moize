import { memoize } from 'micro-memoize';
import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import { getWrappedForceUpdateMoize } from './forceUpdate';
import type { Moized, Options } from './internalTypes';
import { getIsArgEqual, getIsKeyEqual, getTransformKey } from './options';

export function moize<Fn extends (...args: any[]) => any>(
    fn: Fn,
    options: Options<Fn> = {},
): Moized<Fn> {
    const { async, maxSize } = options;

    const isKeyEqual = getIsKeyEqual(options);
    // `isArgEqual` is only used when `isKeyEqual` is not defined.
    const isArgEqual = isKeyEqual ? undefined : getIsArgEqual(options);
    const transformKey = getTransformKey(options);

    const microMemoizeOptions: MicroMemoizeOptions<Fn> = isKeyEqual
        ? { async, isKeyEqual, maxSize, transformKey }
        : { async, isArgEqual, maxSize, transformKey };

    let moized = memoize(fn, microMemoizeOptions) as Moized<Fn>;

    if (options.forceUpdate) {
        moized = getWrappedForceUpdateMoize(moized, options);
    }

    // Override the `micro-memoize` options with the `options` passed.
    moized.options = options;

    return moized;
}
