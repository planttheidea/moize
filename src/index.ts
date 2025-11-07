import { memoize } from 'micro-memoize';
import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import { ComponentProps, ComponentType } from 'react';
import { getWrappedForceUpdateMoize } from './forceUpdate';
import type { Moizable, Moized, Options } from './internalTypes';
import { getIsArgEqual, getIsKeyEqual, getTransformKey } from './options';
import { getWrappedReactMoize } from './react';

export function moize<Fn extends Moizable, Opts extends Options<Fn>>(
    fn: Fn,
    options: Opts = {} as Opts,
): Opts['react'] extends true ? ComponentType<ComponentProps<Fn>> : Moized<Fn> {
    const { async, maxSize } = options;

    const isKeyEqual = getIsKeyEqual(options);
    // `isArgEqual` is only used when `isKeyEqual` is not defined.
    const isArgEqual = isKeyEqual ? undefined : getIsArgEqual(options);
    const transformKey = getTransformKey(options);

    const microMemoizeOptions: MicroMemoizeOptions<Fn> = isKeyEqual
        ? { async, isKeyEqual, maxSize, transformKey }
        : { async, isArgEqual, maxSize, transformKey };

    if (options.react) {
        // @ts-expect-error - Conditional returns are not handled correctly.
        return getWrappedReactMoize(fn, microMemoizeOptions, options);
    }

    let moized = memoize(fn, microMemoizeOptions) as Moized<Fn>;

    if (options.forceUpdate) {
        moized = getWrappedForceUpdateMoize(moized, options);
    }

    // Override the `micro-memoize` options with the `options` passed.
    moized.options = options;

    return moized;
}
