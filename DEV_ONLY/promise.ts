import Bluebird from 'bluebird';
import moize from '../src';
import { type Moized } from '../index.d';
import { logCache, logStoredValue } from './environment';

function createMethod(
    type: string,
    method: 'resolve' | 'reject',
    PromiseLibrary: PromiseConstructor
) {
    if (method === 'reject') {
        return function (number: number, otherNumber: number) {
            console.log(`${type} promise reject fired`, number, otherNumber);

            return PromiseLibrary.reject(
                new Error(`rejected ${number * otherNumber}`)
            );
        };
    }

    return function (number: number, otherNumber: number) {
        console.log(`${type} promise fired`, number, otherNumber);

        return PromiseLibrary.resolve(number * otherNumber);
    };
}

const bluebirdMemoized = moize.promise(
    createMethod(
        'bluebird',
        'resolve',
        Bluebird as unknown as PromiseConstructor
    ),
    { profileName: 'bluebird (reject)' }
);
const bluebirdMemoizedReject = moize.promise(
    createMethod(
        'bluebird',
        'reject',
        Bluebird as unknown as PromiseConstructor
    ),
    { profileName: 'bluebird (reject)' }
);

const nativeMemoized = moize.promise(
    createMethod('native', 'resolve', Promise),
    {
        profileName: 'native',
    }
);
const nativeMemoizedReject = moize.promise(
    createMethod('native', 'reject', Promise),
    {
        profileName: 'native (reject)',
    }
);
const nativeExpiring = moize.promise(
    createMethod('native', 'resolve', Promise),
    {
        maxAge: 1500,
        onCacheHit(cache) {
            console.log('resolved with', cache);
        },
        onExpire() {
            console.log('expired');
        },
        profileName: 'native (expiring)',
    }
);

function logItems(items: [number, number, Moized, string][]) {
    items.forEach(([number, otherNumber, method, name]) => {
        const key = [number, otherNumber];

        method(number, otherNumber).then(() => {
            console.groupCollapsed(`delayed results for ${name}`);

            logStoredValue(method, 'exists', key);
            logStoredValue(method, 'does not exist', key.slice().reverse());

            logCache(method);

            console.groupEnd();
        });
    });
}

export function bluebirdPromise() {
    logItems([
        [4, 9, bluebirdMemoized, 'bluebird (resolve)'],
        [7, 25, bluebirdMemoizedReject, 'bluebird (reject)'],
    ]);

    return bluebirdMemoized;
}

export function nativePromise() {
    logItems([
        [6, 9, nativeMemoized, 'native (resolve)'],
        [21, 12, nativeMemoizedReject, 'native (reject)'],
        [13, 4, nativeExpiring, 'native (expiring)'],
    ]);

    return nativeMemoized;
}
