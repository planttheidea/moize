import { Moized, Options } from './internalTypes';

export function getUpdatableMoize<Fn extends (...args: any[]) => any>(
    moized: Moized<Fn>,
    options: Options<Fn>
): Moized<Fn> {
    const { forceUpdate } = options;

    if (forceUpdate == null) {
        return moized;
    }

    const refreshableMoized = function refreshableMoized(
        this: any,
        ...args: Parameters<Fn>
    ) {
        if (!forceUpdate(args)) {
            return moized.apply(this, args);
        }

        const result = moized.fn.apply(this, args);

        moized.cache.set(args, result);

        return result;
    } as Moized<Fn>;

    refreshableMoized.cache = moized.cache;
    refreshableMoized.fn = moized.fn;
    refreshableMoized.isMemoized = moized.isMemoized;
    refreshableMoized.options = moized.options;

    return refreshableMoized;
}
