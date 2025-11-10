import { TransformKey } from 'micro-memoize';
import { createMoized } from './moize.js';
import type {
    ExpiresConfig,
    ForceUpdate,
    GetExpires,
    IsKeyEqual,
    IsKeyItemEqual,
    Moize,
    Moizeable,
    Options,
    Serializer,
} from './internalTypes.ts';
import {
    clearStats,
    getStats,
    isCollectingStats,
    startCollectingStats,
    stopCollectingStats,
} from './stats.js';
import { isMoized } from './utils.js';

/**
 * Create a memoized method based on the options passed.
 *
 * @example
 * import { moize } from 'moize';
 *
 * // standard implementation
 * const fn = (foo, bar) => `${foo} ${bar}`;
 * const memoizedFn = moize(fn);
 *
 * // implementation with options
 * const fn = async (id) => get(`http://foo.com/${id}`);
 * const memoizedFn = moize(fn, {async: true, maxSize: 5});
 *
 * // implementation with convenience methods
 * const Foo = ({foo}) => <div>{foo}</div>;
 * const memoizedFn = moize.async(Foo, { maxSize: 5});
 *
 * // implementation with currying
 * const fn = (foo, bar) => [foo, bar];
 * const memoizedFn = moize({ async: true, maxSize: 5 })(fn);
 */
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

    return createMoized(fn, options);
};

moize.async = moize({ async: true });
moize.clearStats = clearStats;
moize.deep = moize({ isKeyItemEqual: 'deep' });
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
moize.isKeyEqual = <IsEqual extends IsKeyEqual<Moizeable>>(
    isKeyEqual: IsEqual,
) => moize({ isKeyEqual });
moize.isKeyItemEqual = <IsEqual extends IsKeyItemEqual<Moizeable>>(
    isKeyItemEqual: IsEqual,
) => moize({ isKeyItemEqual });
moize.isCollectingStats = isCollectingStats;
moize.maxArgs = <MaxArgs extends number>(maxArgs: MaxArgs) =>
    moize({ maxArgs });
moize.maxSize = <MaxSize extends number>(maxSize: MaxSize) =>
    moize({ maxSize });
moize.serialize = moize({ serialize: true });
moize.serializeWith = <Serialize extends Serializer>(serialize: Serialize) =>
    moize({ serialize });
moize.shallow = moize({ isKeyItemEqual: 'shallow' });
moize.startCollectingStats = startCollectingStats;
moize.statsName = <StatsName extends string>(statsName: StatsName) =>
    moize({ statsName });
moize.stopCollectingStats = stopCollectingStats;
moize.transformKey = <Transform extends TransformKey<Moizeable>>(
    transformKey: Transform,
) => moize({ transformKey });
