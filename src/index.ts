import { ComponentProps, ComponentType } from 'react';
import { createMoized } from './moize';
import type { Moizable, Moized, Options } from './internalTypes';
import { createWrappedReactMoize } from './react';

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
    return options.react
        ? // @ts-expect-error - Conditional returns are not handled well internally,
          // but the explicit return signature allows consumers to be correct.
          createWrappedReactMoize(fn, options)
        : createMoized(fn, options);
}
