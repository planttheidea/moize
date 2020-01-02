import moize from '../src';
import { log, logCache, logStoredValue } from './environment';

function method(one: string, two: string) {
  console.log('standard method fired', one, two);

  return [one, two].join('|_|');
}

function methodDefaulted(one: string, two = 'default') {
  console.log('defaulted method fired', one, two);

  return [one, two].join('|_|');
}

const memoized = moize.infinite(method);
const memoizedDefaulted = moize.infinite(methodDefaulted);

const foo = 'foo';
const bar = 'bar';

export function standard() {
  memoized(foo, bar);
  logStoredValue(memoized, 1, [foo, bar]);

  logCache(memoized);

  return memoized;
}

export function addEntry() {
  memoized(foo, bar);
  logStoredValue(memoized, 1, [foo, bar]);

  memoized.set([bar, foo], 'something totally different');

  logStoredValue(memoized, 'after add', [bar, foo]);

  logCache(memoized);

  return memoized;
}

export function getEntry() {
  const result = memoized(foo, bar);
  logStoredValue(memoized, 1, [foo, bar]);

  logStoredValue(memoized, 'exists', [foo, bar]);
  logStoredValue(memoized, 'is undefined if not stored', [bar, foo]);

  log('is strictly equal', [foo, bar], result === memoized.get([foo, bar]));

  logCache(memoized);

  return memoized;
}

export function hasEntry() {
  memoized(foo, bar);
  logStoredValue(memoized, 1, [foo, bar]);

  log('is stored', [foo, bar], memoized.has([foo, bar]));
  log('is not stored', [bar, foo], memoized.has([bar, foo]));

  logCache(memoized);

  return memoized;
}

export function updateEntry() {
  memoized(foo, bar);
  logStoredValue(memoized, 1, [foo, bar]);

  memoized(bar, foo);
  logStoredValue(memoized, 2, [bar, foo]);

  memoized.set([foo, bar], 'something totally different');
  logStoredValue(memoized, 'after update', [foo, bar]);

  logCache(memoized);

  return memoized;
}

export function cacheEntries() {
  memoized(foo, bar);

  const { cacheSnapshot } = memoized;

  console.log('keys', cacheSnapshot.keys);
  console.log('values', cacheSnapshot.values);

  logCache(memoized);

  return memoized;
}

export function withDefaultParams() {
  memoizedDefaulted(foo, bar);
  memoizedDefaulted(foo);
  memoizedDefaulted(foo);
  memoizedDefaulted(foo, bar);

  logStoredValue(memoizedDefaulted, 'with value', [foo, bar]);
  logStoredValue(memoizedDefaulted, 'with default', [foo]);

  logCache(memoizedDefaulted);

  return memoizedDefaulted;
}
