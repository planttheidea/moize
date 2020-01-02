import Bluebird from 'bluebird';
import moize, { Moized } from '../src';
import { logCache, logStoredValue } from './environment';

function createMethod(
  type: string,
  method: 'resolve' | 'reject',
  PromiseLibrary: PromiseConstructor
) {
  if (method === 'reject') {
    return function(number: number, otherNumber: number) {
      console.log(`${type} promise reject fired`, number, otherNumber);

      return PromiseLibrary.reject(new Error(`rejected ${number * otherNumber}`));
    };
  }

  return function(number: number, otherNumber: number) {
    console.log(`${type} promise fired`, number, otherNumber);

    return PromiseLibrary.resolve(number * otherNumber);
  };
}

const bluebirdMemoized = moize.promise(
  createMethod('bluebird', 'resolve', (Bluebird as unknown) as PromiseConstructor),
  { profileName: 'bluebird (reject)' }
);
const bluebirdMemoizedReject = moize.promise(
  createMethod('bluebird', 'reject', (Bluebird as unknown) as PromiseConstructor),
  { profileName: 'bluebird (reject)' }
);

const nativeMemoized = moize.promise(createMethod('native', 'resolve', Promise), {
  profileName: 'native',
});
const nativeMemoizedReject = moize.promise(createMethod('native', 'reject', Promise), {
  profileName: 'native (reject)',
});

const nativeExpiring = moize.promise(createMethod('native', 'resolve', Promise), {
  maxAge: 1500,
  onCacheHit(cache) {
    console.log('resolved with', cache);
  },
  onExpire() {
    console.log('expired');
  },
  profileName: 'native (expiring)',
});

function logItems(items: [number, number, Moized][]) {
  items.forEach(([number, otherNumber, method]) => {
    method(number, otherNumber).then(() => {
      logStoredValue(method, 'exists', [number, otherNumber]);
      logStoredValue(method, 'does not exist', [number, otherNumber]);

      logCache(method);
    });
  });
}

export function bluebirdPromise() {
  logItems([
    [4, 9, bluebirdMemoized],
    [7, 25, bluebirdMemoizedReject],
  ]);

  return bluebirdMemoized;
}

export function nativePromise() {
  logItems([
    [4, 9, nativeMemoized],
    [7, 25, nativeMemoizedReject],
    [13, 4, nativeExpiring],
  ]);

  return nativeMemoized;
}
