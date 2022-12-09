import moize from '../src/index';

moize.collectStats();

const method = function (one: string, two: string) {
    console.log('standard method fired', one, two);

    return [one, two].join(' ');
};

const foo = 'foo';
const bar = 'bar';

console.group('expiration');

const expiringMemoized = moize.maxAge(1000)(method, {
    onExpire: (() => {
        let count = 0;

        return () => {
            if (count !== 0) {
                console.log(
                    'Expired! This is the last time I will fire, and this should be empty:',
                    expiringMemoized.expirationsSnapshot
                );

                console.log(moize.getStats());

                return true;
            }

            console.log(
                'Expired! I will now reset the expiration, but this should be empty:',
                expiringMemoized.expirationsSnapshot
            );

            count++;

            return false;
        };
    })(),
    updateExpire: true,
});

expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);

console.log('existing expirations', expiringMemoized.expirationsSnapshot);

console.groupEnd();
