import { memoize } from 'micro-memoize';
import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import { getExpirationManager } from './expires';
import { Moizable, Moized, Options } from './internalTypes';
import { getWrappedForceUpdateMoize } from './forceUpdate';

export function createMoized<Fn extends Moizable, Opts extends Options<Fn>>(
    fn: Fn,
    microMemoizeOptions: MicroMemoizeOptions<Fn>,
    options: Opts,
) {
    let moized = memoize(fn, microMemoizeOptions) as Moized<Fn, Opts>;

    if (options.forceUpdate) {
        moized = getWrappedForceUpdateMoize(moized, options);
    }

    moized.expirationManager = getExpirationManager(moized, options);
    // Override the `micro-memoize` options with the ones passed to `moize`.
    moized.options = options;

    return moized;
}
