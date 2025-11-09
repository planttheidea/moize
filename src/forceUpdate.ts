import type { Moizeable, Moized, Options } from './internalTypes';
import { setName } from './utils';

/**
 * Create a wrapped moized method that will conditionally update the cache based on
 * the result of the option passed.
 */
export function getWrappedForceUpdateMoize<
    Fn extends Moizeable,
    Opts extends Options<Fn>,
>(moized: Moized<Fn, Opts>, { forceUpdate }: Opts) {
    if (forceUpdate == null) {
        return moized;
    }

    const { cache } = moized;

    const wrappedMoized = Object.assign(function (
        this: any,
        ...args: Parameters<Fn>
    ) {
        if (!forceUpdate(args) || !cache.has(args)) {
            return moized.apply(this, args);
        }

        const value = moized.fn.apply(this, args) as ReturnType<Fn>;

        moized.cache.set(args, value, 'forced');

        return value;
    }, moized) as Moized<Fn, Opts>;

    setName(wrappedMoized, moized.fn, moized.options);

    return wrappedMoized;
}
