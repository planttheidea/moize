import moize from '../src';
import { logCache, logStoredValue } from './environment';

type Arg = {
  one: number;
  two: {
    deep: 2;
  };
};

function method({ one, two }: Arg) {
  console.log('deep equal fired', one, two);

  return [one, two];
}

const memoized = moize.deep(method);

export function deepEqual() {
  memoized({ one: 1, two: { deep: 2 } });

  logStoredValue(memoized, 'exists', [{ one: 1, two: { deep: 2 } }]);
  logStoredValue(memoized, 'does not exist', [{ one: 1, two: { three: 3 } }]);

  logCache(memoized);

  return memoized;
}
