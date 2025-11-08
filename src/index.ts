import { KeyTransformer, Options as MicroMemoizeOptions } from 'micro-memoize';
import { createMoized } from './moize';
import type {
    ExpiresConfig,
    ForceUpdate,
    GetExpires,
    Moize,
    Moizeable,
    Options,
    Serializer,
} from './internalTypes';
import { createWrappedReactMoize } from './react';
import {
    clearStats,
    getStats,
    isCollectingStats,
    startCollectingStats,
    stopCollectingStats,
} from './stats';
import { isMoized } from './utils';

export const moize: Moize<{}> = function moize<
    const Fn extends Moizeable,
    const Opts extends Options<Fn>,
>(fn: Fn | Opts, options: Opts = {} as Opts) {
    if (typeof fn === 'object') {
        return function curried<
            CurriedFn extends Moizeable,
            CurriedOpts extends Options<CurriedFn>,
        >(
            curriedFn: CurriedFn | CurriedOpts,
            curriedOptions?: CurriedOpts,
        ): any {
            if (typeof curriedFn === 'object') {
                return moize(Object.assign({}, fn, curriedFn));
            }

            return moize(curriedFn, Object.assign({}, fn, curriedOptions));
        };
    }

    if (typeof fn !== 'function') {
        throw new Error(
            'Must pass either a function or an object of options to `moize`.',
        );
    }

    if (isMoized(fn)) {
        // @ts-expect-error - TS does an intersection of `Fn` and the moized method
        // So it considers the properties not available.
        return moize(fn.fn, Object.assign({}, fn.options, options));
    }

    return options.react
        ? createWrappedReactMoize(fn, options)
        : createMoized(fn, options);
};

moize.async = moize({ async: true });

moize.clearStats = clearStats;

moize.deep = moize({ isArgEqual: 'deep' });

moize.expires = <
    Expires extends number | GetExpires<Moizeable> | ExpiresConfig<Moizeable>,
>(
    expires: Expires,
) => moize({ expires });

moize.forceUpdate = <Update extends ForceUpdate<Moizeable>>(
    forceUpdate: Update,
) => moize({ forceUpdate });

moize.getStats = getStats;

moize.infinite = moize({ maxSize: Infinity });

moize.isArgEqual = <
    IsArgEqual extends Required<MicroMemoizeOptions<Moizeable>>['isArgEqual'],
>(
    isArgEqual: IsArgEqual,
) => moize({ isArgEqual });

moize.isKeyEqual = <
    IsKeyEqual extends Required<MicroMemoizeOptions<Moizeable>>['isKeyEqual'],
>(
    isKeyEqual: IsKeyEqual,
) => moize({ isKeyEqual });

moize.isCollectingStats = isCollectingStats;

moize.maxArgs = <MaxArgs extends number>(maxArgs: MaxArgs) =>
    moize({ maxArgs });

moize.maxSize = <MaxSize extends number>(maxSize: MaxSize) =>
    moize({ maxSize });

moize.react = moize({ react: true });

moize.serialize = <Serialize extends boolean | Serializer>(
    serialize: Serialize,
) => moize({ serialize });

moize.shallow = moize({ isArgEqual: 'shallow' });

moize.startCollectingStats = startCollectingStats;

moize.statsName = <StatsName extends string>(statsName: StatsName) =>
    moize({ statsName });

moize.stopCollectingStats = stopCollectingStats;

moize.transformKey = <TransformKey extends KeyTransformer<Moizeable>>(
    transformKey: TransformKey,
) => moize({ transformKey });
