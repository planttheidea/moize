import type { Moizable, Moized, Options } from './internalTypes';

export function getWrappedForceUpdateMoize<Fn extends Moizable>(
    moized: Moized<Fn>,
    { forceUpdate }: Options<Fn>,
) {
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
