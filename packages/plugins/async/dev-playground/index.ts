/* eslint-disable */

import Bluebird from 'bluebird';
import { deepEqual } from 'fast-equals';

import { createMoize } from '../../../core/src';
import { asyncPlugin } from '../src';

// import '../benchmarks';

document.body.style.backgroundColor = '#1d1d1d';
document.body.style.color = '#d5d5d5';
document.body.style.margin = '0px';
document.body.style.padding = '0px';

const promiseMethod = (number: number, otherNumber: number) => {
    console.log('promise method fired', number);

    return new Promise((resolve: Function) => {
        resolve(number * otherNumber);
    });
};

const promiseMethodRejected = (number: number) => {
    console.log('promise rejection method fired', number);

    return new Bluebird((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('boom'));
        }, 100);
    });
};

const memoize = createMoize([asyncPlugin]);
const memoizedPromise = memoize(promiseMethod, { async: true });
const memoizedPromiseRejected = memoize(promiseMethodRejected, {
    async: true,
});

memoizedPromiseRejected(3)
    .then((value: any) => {
        console.log(value);
    })
    .catch((error: Error) => {
        console.log(memoizedPromiseRejected.cache.snapshot());
        console.error(error);
    });

memoizedPromiseRejected(3)
    .then((value: any) => {
        console.log(value);
    })
    .catch((error: Error) => {
        console.log(memoizedPromiseRejected.cache.snapshot());
        console.error(error);
    });

memoizedPromiseRejected(3)
    .then((value: any) => {
        console.log(value);
    })
    .catch((error: Error) => {
        console.log(memoizedPromiseRejected.cache.snapshot());
        console.error(error);
    });

// get result
memoizedPromise(2, 2).then((value: unknown) => {
    console.log(`computed value: ${value}`);
});

// pull from cache
memoizedPromise(2, 2).then((value: unknown) => {
    console.log(`cached value: ${value}`);
});

console.log(memoizedPromise.cache.snapshot().map(({ key }) => key));
