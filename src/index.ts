import { ComponentProps, ComponentType } from 'react';
import { createMoized } from './moize';
import type { Moizeable, Moized, Options } from './internalTypes';
import { createWrappedReactMoize } from './react';
import {
    clearStats,
    getStats,
    startCollectingStats,
    stopCollectingStats,
} from './stats';

export function moize<
    const Fn extends Moizeable,
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

moize.clearStats = clearStats;
moize.getStats = getStats;
moize.startCollectingStats = startCollectingStats;
moize.stopCollectingStats = stopCollectingStats;
