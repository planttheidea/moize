import type { Key, KeyTransformer } from 'micro-memoize';
import type { Moizable, Options } from './internalTypes';

/**
 * Create a method that takes the first N number of items from the array (faster than slice).
 */
export function getMaxArgsTransformKey<Fn extends Moizable>({
    maxArgs,
    react,
}: Options<Fn>): KeyTransformer<Fn> | undefined {
    if (
        typeof maxArgs !== 'number' ||
        !Number.isFinite(maxArgs) ||
        maxArgs < 0
    ) {
        // If `react`, force the args to be limited to 2.
        return react ? getMaxArgsTransformKey({ maxArgs: 2 }) : undefined;
    }

    if (maxArgs === 0) {
        return () => [];
    }

    if (maxArgs === 1) {
        return (args: Key) => (maxArgs >= args.length ? args : [args[0]]);
    }

    // If `react`, force the args to be limited to 2 even if `maxArgs` passed is higher.
    if (maxArgs === 2 || react) {
        return (args: Key) =>
            maxArgs >= args.length ? args : [args[0], args[1]];
    }

    if (maxArgs === 3) {
        return (args: Key) =>
            maxArgs >= args.length ? args : [args[0], args[1], args[2]];
    }

    return (args: Key) => {
        if (maxArgs >= args.length) {
            return args;
        }

        const clone = new Array(maxArgs);

        for (let index = 0; index < maxArgs; ++index) {
            clone[index] = args[index];
        }

        return clone;
    };
}
