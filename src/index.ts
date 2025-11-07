import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import { ComponentProps, ComponentType } from 'react';
import { createMoized } from './instance';
import type { Moizable, Moized, Options } from './internalTypes';
import { getIsArgEqual, getIsKeyEqual, getTransformKey } from './options';
import { getWrappedReactMoize } from './react';

export function moize<
    const Fn extends Moizable,
    const Opts extends Options<Fn>,
>(
    fn: Fn,
    options: Opts = {} as Opts,
): {} extends Opts
    ? Moized<Fn, {}>
    : Opts['react'] extends true
      ? ComponentType<ComponentProps<Fn>>
      : Moized<Fn, Opts> {
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

    return createMoized(fn, microMemoizeOptions, options);
}
