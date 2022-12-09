import moize from '../src';
import { logCache, logStoredValue } from './environment';

function method(one: string, two: string, three: string) {
    console.log('transform args fired', one, two, three);

    return [two, three];
}

const memoized = moize(method, {
    transformArgs(args: string[]) {
        const newKey: string[] = [];

        let index = args.length;

        while (--index) {
            newKey[index - 1] = args[index];
        }

        return newKey;
    },
});

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

export function transformArgs() {
    memoized(foo, bar, baz);

    logStoredValue(memoized, 'exists', [foo, bar, baz]);
    logStoredValue(memoized, 'exists for different first', [null, bar, baz]);

    logCache(memoized);

    return memoized;
}
