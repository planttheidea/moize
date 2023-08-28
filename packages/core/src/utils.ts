import type { CacheNode, CacheEntry, Moized } from '../index.d';

type TypeOf =
    | 'bigint'
    | 'boolean'
    | 'function'
    | 'number'
    | 'object'
    | 'string'
    | 'symbol'
    | 'undefined';

export function cloneKey<Fn extends (...args: any[]) => any>(
    args: Parameters<Fn>
): [...Parameters<Fn>] {
    const key = [] as unknown as Parameters<Fn>;

    for (let index = 0, length = args.length; index < length; ++index) {
        key[index] = args[index];
    }

    return key;
}

export function getDefault<Value>(
    type: TypeOf,
    value: Value,
    defaultValue?: undefined
): Value | undefined;
export function getDefault<Value, DefaultValue>(
    type: TypeOf,
    value: Value,
    defaultValue: DefaultValue
): Value extends undefined ? DefaultValue : Value;
export function getDefault<Value, DefaultValue>(
    type: TypeOf,
    value: Value,
    defaultValue?: DefaultValue
) {
    return typeof value === type ? value : defaultValue;
}

export function getEntry<Fn extends (...args: any[]) => any>(
    node: CacheNode<Fn>
): CacheEntry<Fn> {
    return { key: node.k, value: node.v };
}

export function isMoized(fn: any): fn is Moized<any, any> {
    return typeof fn === 'function' && fn.fn;
}

export function sameValueZero(a: any, b: any) {
    return a === b || (a !== a && b !== b);
}
