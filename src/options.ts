import { deepEqual, shallowEqual } from 'fast-equals';
import { Options } from './internalTypes';
import { getMaxArgsTransformKey } from './maxArgs';
import { compose } from './utils';

export function getIsArgEqual<Fn extends (...args: any[]) => any>({
    isArgEqual,
}: Options<Fn>) {
    if (typeof isArgEqual === 'function') {
        return isArgEqual;
    }

    if (isArgEqual === 'deep') {
        return deepEqual;
    }

    if (isArgEqual === 'shallow') {
        return shallowEqual;
    }
}
export function getIsKeyEqual<Fn extends (...args: any[]) => any>(
    options: Options<Fn>
) {
    return options.isKeyEqual;
}

export function getTransformKey<Fn extends (...args: any[]) => any>(
    options: Options<Fn>
) {
    return compose(options.transformKey, getMaxArgsTransformKey(options));
}
