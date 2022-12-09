import moize from '../src';
import { logCache, logStoredValue } from './environment';

type Arg = {
    one: number;
    two: number;
};

function method({ one, two }: Arg) {
    console.log('deep equal fired', one, two);

    return [one, two];
}

const memoized = moize.shallow(method);

export function shallowEqual() {
    memoized({ one: 1, two: 2 });

    logStoredValue(memoized, 'exists', [{ one: 1, two: 2 }]);
    logStoredValue(memoized, 'does not exist', [{ one: 1, two: 3 }]);

    logCache(memoized);

    return memoized;
}
