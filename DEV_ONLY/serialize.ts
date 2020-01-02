/* eslint-disable @typescript-eslint/no-empty-function */

import moize from '../src';
import { logCache, logStoredValue } from './environment';

type Arg = {
  one: number;
  two: number;
  three: () => void;
  four: symbol;
  five: null;
};

function method({ one, two, three, four }: Arg) {
  return [one, two, three, four];
}

const memoized = moize.serialize(method);

export function serialize() {
  memoized({ one: 1, two: 2, three() {}, four: Symbol('foo'), five: null });

  logStoredValue(memoized, 'exists', [
    { one: 1, two: 2, three() {}, four: Symbol('foo'), five: null },
  ]);
  logStoredValue(memoized, 'does not exist', [{ one: 1, two: 2, three: 3, four: 4 }]);

  logCache(memoized);

  return memoized;
}
