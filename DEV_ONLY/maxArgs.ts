import moize from '../src';
import { logCache, logStoredValue } from './environment';

function method(one: string, two: string) {
    console.log('max args fired', one, two);

    return [one, two].join('|_|');
}

const memoized = moize.maxArgs(1)(method);

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

export function maxArgs() {
    memoized(foo, bar);
    memoized(foo, baz);

    logStoredValue(memoized, 'exists only for foo', [foo, bar]);

    logCache(memoized);

    return memoized;
}
