import Bluebird from 'bluebird';
import moize from '../src';

import type { Moized } from '../index.d';

function createMethod(
    type: string,
    method: 'resolve' | 'reject',
    PromiseLibrary: PromiseConstructor
) {
    if (method === 'reject') {
        return function (number: number, otherNumber: number) {
            return PromiseLibrary.reject(
                new Error(`rejected ${number * otherNumber}`)
            );
        };
    }

    return function (number: number, otherNumber: number) {
        return PromiseLibrary.resolve(number * otherNumber);
    };
}

const bluebirdMemoizedResolve = moize.promise(
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
const bluebirdMemoizedExpiring = moize.promise(
    createMethod(
        'native',
        'resolve',
        Bluebird as unknown as PromiseConstructor
    ),
    {
        maxAge: 1500,
        onCacheHit: jest.fn(),
        onExpire: jest.fn(),
        profileName: 'bluebird (expiring)',
    }
);

const nativeMemoizedResolve = moize.promise(
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
const nativeMemoizedExpiring = moize.promise(
    createMethod('native', 'resolve', Promise),
    {
        maxAge: 1500,
        onCacheHit: jest.fn(),
        onExpire: jest.fn(),
        profileName: 'native (expiring)',
    }
);

function testItem(key: number[], method: Moized, Constructor: any) {
    const [number, otherNumber] = key;

    return method(number, otherNumber).then((result: number) => {
        expect(method.get(key)).toBeInstanceOf(Constructor);
        expect(method.get(key.slice().reverse())).toBe(undefined);

        expect(result).toEqual(number * otherNumber);
    });
}

const TYPES = {
    bluebird: Bluebird,
    native: Promise,
};

const METHODS = {
    bluebird: {
        resolve: bluebirdMemoizedResolve,
        reject: bluebirdMemoizedReject,
        expiring: bluebirdMemoizedExpiring,
    },
    native: {
        resolve: nativeMemoizedResolve,
        reject: nativeMemoizedReject,
        expiring: nativeMemoizedExpiring,
    },
};

describe('moize.promise', () => {
    ['native', 'bluebird'].forEach((type) => {
        const Constructor = TYPES[type as keyof typeof TYPES];

        ['resolve', 'reject', 'expiring'].forEach((test) => {
            const methodType = METHODS[type as keyof typeof METHODS];
            const method = methodType[test as keyof typeof methodType];

            it(`should handle ${test}`, async () => {
                try {
                    await testItem([6, 9], method, Constructor);

                    if (test === 'reject') {
                        throw new Error(`${test} should have rejected`);
                    }
                } catch (error) {
                    if (test !== 'reject') {
                        throw error;
                    }
                }

                if (test === 'expiring') {
                    expect(method.options.onCacheHit).toHaveBeenCalledWith(
                        method.cache,
                        method.options,
                        method
                    );

                    await new Promise((resolve) =>
                        setTimeout(resolve, method.options.maxAge * 2)
                    ).then(() => {
                        expect(method.options.onExpire).toHaveBeenCalledTimes(
                            1
                        );
                    });
                }
            });
        });
    });
});
