import { Key } from 'micro-memoize';
import { Options, Serialize } from './internalTypes';
import stringify from 'fast-stringify';

function defaultReplacer(key: string, value: any) {
    const type = typeof value;

    return type === 'function' || type === 'symbol' ? value.toString() : value;
}

export function getSerializeTransformKey<Fn extends (...args: any[]) => any>({
    serialize,
}: Options<Fn>): Serialize | undefined {
    if (typeof serialize === 'function') {
        return serialize;
    }

    if (serialize) {
        return (args: Key) => [stringify(args, { replacer: defaultReplacer })];
    }
}
