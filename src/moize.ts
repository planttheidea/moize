import { memoize } from 'micro-memoize';
import { deepEqual, shallowEqual } from 'fast-equals';
import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import { getExpirationManager } from './expires';
import type { Moizeable, Moized, Options } from './internalTypes';
import { getWrappedForceUpdateMoize } from './forceUpdate';
import { getMaxArgsTransformKey } from './maxArgs';
import { getSerializeTransformKey, isSerializedKeyEqual } from './serialize';
import { compose } from './utils';
import { getStats, getStatsManager } from './stats';

/**
 * Create a moized instance of the function passed, including all necessary static properties.
 */
export function createMoized<Fn extends Moizeable, Opts extends Options<Fn>>(
    fn: Fn,
    options: Opts,
): Moized<Fn, Opts> {
    const microMemoizeOptions = getMicroMemoizeOptions(options);

    let moized = memoize(fn, microMemoizeOptions) as Moized<Fn, Opts>;

    if (options.forceUpdate) {
        moized = getWrappedForceUpdateMoize(moized, options);
    }

    moized.expirationManager = getExpirationManager(moized, options);
    moized.getStats = () =>
        options.statsName != null ? getStats(options.statsName) : undefined;
    // Override the `micro-memoize` options with the ones passed to `moize`.
    moized.options = options;
    moized.statsManager = getStatsManager(moized, options);

    return moized;
}

/**
 * Get the `isArgEqual` method passed to `micro-memoize`.
 */
function getIsArgEqualOption<Fn extends Moizeable>({
    isArgEqual,
    react,
}: Options<Fn>): MicroMemoizeOptions<Fn>['isArgEqual'] {
    if (typeof isArgEqual === 'function') {
        return isArgEqual;
    }

    if (isArgEqual === 'deep') {
        return deepEqual;
    }

    // If `react` and no custom equality comparator is passed, use `shallowEqual` to allow
    // a shallow props comparison.
    if (isArgEqual === 'shallow' || react) {
        return shallowEqual;
    }
}

/**
 * Get the `isKeyEqual` method passed to `micro-memoize`.
 */
function getIsKeyEqualOption<Fn extends Moizeable>({
    isKeyEqual,
    serialize,
}: Options<Fn>): MicroMemoizeOptions<Fn>['isKeyEqual'] {
    if (isKeyEqual) {
        return isKeyEqual;
    }

    if (serialize) {
        return isSerializedKeyEqual;
    }
}

/**
 * Get the options passed to `memoize` in the `micro-memoize` package.
 */
function getMicroMemoizeOptions<Fn extends Moizeable>(
    options: Options<Fn>,
): MicroMemoizeOptions<Fn> {
    const { async, maxSize } = options;

    const isKeyEqual = getIsKeyEqualOption(options);
    // `isArgEqual` is only used when `isKeyEqual` is not defined.
    const isArgEqual = isKeyEqual ? undefined : getIsArgEqualOption(options);
    const transformKey = getTransformKeyOption(options);

    return isKeyEqual
        ? { async, isKeyEqual, maxSize, transformKey }
        : { async, isArgEqual, maxSize, transformKey };
}

/**
 * Get the `transformKey` method passed to `micro-memoize`.
 */
function getTransformKeyOption<Fn extends Moizeable>(
    options: Options<Fn>,
): MicroMemoizeOptions<Fn>['transformKey'] {
    return compose(
        getSerializeTransformKey(options),
        options.transformKey,
        getMaxArgsTransformKey(options),
    );
}
