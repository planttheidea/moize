import { copyStaticProperties } from './instance';

import type { Moized } from '../index.d';

export function createRefreshableMoized<MoizedFn extends Moized>(
    moized: MoizedFn
) {
    const {
        options: { updateCacheForKey },
    } = moized;

    /**
     * @private
     *
     * @description
     * Wrapper around already-`moize`d function which will intercept the memoization
     * and call the underlying function directly with the purpose of updating the cache
     * for the given key.
     *
     * Promise values use a tweak of the logic that exists at cache.updateAsyncCache, which
     * reverts to the original value if the promise is rejected and there was already a cached
     * value.
     */
    const refreshableMoized = function refreshableMoized(
        this: any,
        ...args: Parameters<typeof moized.fn>
    ) {
        if (!updateCacheForKey(args)) {
            return moized.apply(this, args);
        }

        const result = moized.fn.apply(this, args);

        moized.set(args, result);

        return result;
    } as typeof moized;

    copyStaticProperties(moized, refreshableMoized);

    return refreshableMoized;
}
