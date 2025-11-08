import type { Moizeable, Moized, Options } from './internalTypes';

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

    return Object.assign(function (this: any, ...args: Parameters<Fn>) {
        if (!forceUpdate(args) || !cache.has(args)) {
            return moized.apply(this, args);
        }

        const value = moized.fn.apply(this, args) as ReturnType<Fn>;

        // @TODO - just call `moized.cache.set(args, value, 'forced')` when the API is available.
        const normalizedKey = cache.k ? cache.k(args) : args;
        let node = cache.g(normalizedKey);

        if (node) {
            // @ts-expect-error - `w` is not surfaced in types yet.
            node.v = cache.p && value !== node.v ? cache.w(value) : value;
            node !== cache.h && cache.u(node);
            cache.o && cache.o.n('update', node, 'forced');
        } else {
            node = cache.n(normalizedKey, value);
            cache.o && cache.o.n('add', node);
        }

        return value;
    }, moized);
}
