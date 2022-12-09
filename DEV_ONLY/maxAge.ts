import moize from '../src';
import { logCache, logStoredValue } from './environment';

function method(one: string, two: string) {
    console.log('max age fired', one, two);

    return [one, two].join('|_|');
}

const memoized = moize.maxAge(1000)(method, {
    onExpire: (() => {
        let count = 0;

        return () => {
            if (count !== 0) {
                console.log(
                    'Expired! This is the last time I will fire, and this should be empty:',
                    memoized.expirationsSnapshot
                );

                console.log(moize.getStats());

                return true;
            }

            console.log(
                'Expired! I will now reset the expiration, but this should be empty:',
                memoized.expirationsSnapshot
            );

            count++;

            return false;
        };
    })(),
    updateExpire: true,
});

const foo = 'foo';
const bar = 'bar';

export function maxAge() {
    memoized(foo, bar);
    memoized(foo, bar);
    memoized(foo, bar);
    memoized(foo, bar);
    memoized(foo, bar);
    memoized(foo, bar);
    memoized(foo, bar);

    console.log('existing expirations', memoized.expirationsSnapshot);

    logStoredValue(memoized, 'exists', [foo, bar]);

    logCache(memoized);

    return memoized;
}
