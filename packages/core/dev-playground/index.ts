/* eslint-disable */

import Bluebird from 'bluebird';
import { deepEqual } from 'fast-equals';

import moize from '../src';

// import '../benchmarks';

document.body.style.backgroundColor = '#1d1d1d';
document.body.style.color = '#d5d5d5';
document.body.style.margin = '0px';
document.body.style.padding = '0px';

const div = document.createElement('div');

div.textContent = 'Check the console for details.';

document.body.appendChild(div);

console.group('standard');

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';
const quz = 'quz';

function method(one: string, two: string) {
    console.log('standard method fired', one, two);

    return [one, two].join(' ');
}

const memoized = moize(method);

memoized(foo, bar);
memoized(bar, foo);
memoized(bar, foo);
memoized(foo, bar);
memoized(foo, bar);

console.log(memoized.cache.snapshot());
console.log(memoized.cache);

memoized.cache.clear();

console.log(memoized.cache.snapshot());
console.log(memoized.cache);

console.groupEnd();

console.group('standard with larger cache size');

const memoizedLargerCache = moize(method, {
    maxSize: 3,
});

(['add', 'delete', 'hit', 'update'] as const).forEach((type) => {
    memoizedLargerCache.cache.on(type, (entry) => {
        console.log(type, entry);
    });
});

memoizedLargerCache(foo, bar);
memoizedLargerCache(bar, foo);
memoizedLargerCache(bar, foo);
memoizedLargerCache(foo, baz);
memoizedLargerCache(foo, bar);
memoizedLargerCache(baz, quz);
memoizedLargerCache(foo, quz);

console.log(memoizedLargerCache.cache.snapshot());

console.groupEnd();

console.group('maxArgs');

const memoizedMax = moize(method, {
    matchesKey: (originalKey, newKey) => originalKey[0] === newKey[0],
});

memoizedMax(foo, bar);
memoizedMax(foo, baz);
memoizedMax(foo, quz);

console.groupEnd();

console.group('custom - deep equals');

const deepEqualMethod = ({
    one,
    two,
}: {
    one: string | number;
    two: string | number;
}) => {
    console.log('custom equal method fired', one, two);

    return [one, two];
};

const deepEqualMemoized = moize(deepEqualMethod, {
    matchesArg: deepEqual,
});

deepEqualMemoized({ one: 1, two: 2 });
deepEqualMemoized({ one: 2, two: 1 });
deepEqualMemoized({ one: 1, two: 2 });
deepEqualMemoized({ one: 1, two: 2 });

console.log(deepEqualMemoized.cache.snapshot());

console.groupEnd();

console.group('with default parameters');

const withDefault = (foo: string, bar: string = 'default') => {
    console.log('with default fired', foo, bar);

    return `${foo} ${bar}`;
};

const moizedWithDefault = moize(withDefault, { maxSize: 5 });

console.log(moizedWithDefault(foo));
console.log(moizedWithDefault(foo, bar));
console.log(moizedWithDefault(foo));

console.groupEnd();

console.group('transform key');

const noFns = (one: string, two: string, three: Function) => {
    console.log('transform key called');

    return { one, two, three };
};

const memoizedNoFns = moize(noFns, {
    matchesArg(key1, key2) {
        return key1 === key2;
    },
    transformKey(args) {
        return [JSON.stringify(args)];
    },
});

const options = memoizedNoFns.options;

console.log(memoizedNoFns('one', 'two', () => {}));
console.log(memoizedNoFns('one', 'two', () => {}));
console.log(memoizedNoFns('one', 'two', () => {}));

console.log(memoizedNoFns.cache);

console.groupEnd();

console.group('matching whole key');

const matchingKeyMethod = function (object: {
    deeply: { nested: { number: number } };
}) {
    return object.deeply.nested.number;
};

const matchingKeyMemoized = moize(matchingKeyMethod, {
    matchesKey: deepEqual,
    maxSize: 10,
});

matchingKeyMemoized({ deeply: { nested: { number: 35 } } });
matchingKeyMemoized({ deeply: { nested: { number: 35 } } });
matchingKeyMemoized({ deeply: { nested: { number: 35 } } });
matchingKeyMemoized({ deeply: { nested: { number: 35 } } });
matchingKeyMemoized({ deeply: { nested: { number: 35 } } });

console.log(matchingKeyMemoized.cache);

console.groupEnd();

type Dictionary<Type> = {
    [key: string]: Type;
    [index: number]: Type;
};

const calc = moize(
    (object: Dictionary<any>, metadata: Dictionary<any>): Dictionary<any> =>
        Object.keys(object).reduce((totals: Dictionary<any>, key: string) => {
            if (Array.isArray(object[key])) {
                totals[key] = object[key].map((subObject: Dictionary<any>) =>
                    calc(subObject, metadata)
                );
            } else {
                totals[key] = object[key].a + object[key].b + metadata.c;
            }

            return totals;
        }, {}),
    {
        maxSize: 10,
    }
);

const data = {
    fifth: {
        a: 4,
        b: 5,
    },
    first: [
        {
            second: {
                a: 1,
                b: 2,
            },
        },
        {
            third: [
                {
                    fourth: {
                        a: 2,
                        b: 3,
                    },
                },
            ],
        },
    ],
};
const metadata = {
    c: 6,
};

const result1 = calc(data, metadata);

console.log(result1);
console.log(calc.cache.snapshot());

const result2 = calc(data, metadata);

console.log(result2);
console.log(calc.cache.snapshot());
