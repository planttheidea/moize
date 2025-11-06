import { memoize } from 'micro-memoize';
import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import type { Moized, Options } from './internalTypes';
import { getIsArgEqual, getIsKeyEqual, getTransformKey } from './options';

export function moize<Fn extends (...args: any[]) => any>(
    fn: Fn,
    options: Options<Fn> = {}
): Moized<Fn> {
    const {
        expires,
        forceRefreshKey,
        maxArgs,
        maxSize,
        react,
        serialize,
        statsProfile,
    } = options;

    const isKeyEqual = getIsKeyEqual(options);
    const isArgEqual = isKeyEqual ? undefined : getIsArgEqual(options);
    const transformKey = getTransformKey(options);

    const microMemoizeOptions: MicroMemoizeOptions<Fn> = isKeyEqual
        ? { isArgEqual, maxSize, transformKey }
        : { isKeyEqual, maxSize, transformKey };
    const moizeOptions = {
        ...microMemoizeOptions,
        expires,
        forceRefreshKey,
        maxArgs,
        maxSize,
        react,
        serialize,
        statsProfile,
    };

    const moized = memoize(fn, microMemoizeOptions) as Moized<Fn>;

    moized.fn = fn;
    moized.options = moizeOptions;

    return moized;
}
