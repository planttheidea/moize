import moize from '../src';
import { logCache, logStoredValue } from './environment';

type Arg = {
  one: number;
  two: number;
};

function method(arg: Arg) {
  const { one, two } = arg;

  return [one, two];
}

const memoized = moize.serialize(method);

export function serialize() {
  memoized({ one: 1, two: 2 });

  logStoredValue(memoized, 'exists', [{ one: 1, two: 2 }]);
  logStoredValue(memoized, 'does not exist', [{ one: 1, two: 3 }]);

  logCache(memoized);

  return memoized;
}
