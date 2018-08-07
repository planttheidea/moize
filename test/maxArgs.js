// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as maxArgs from 'src/maxArgs';

test('if getInitialArgs will return the args themselves when the size is larger than the length', (t) => {
  const args = ['foo'];

  const result = maxArgs.createGetInitialArgs(2)(args);

  t.is(result, args);
});

test('if a new array is produced appropriately for standard sizes', (t) => {
  const args = [1, 2, 3, 4, 5, 6, 7];

  for (let index = 0; index < 6; index++) {
    t.deepEqual(maxArgs.createGetInitialArgs(index)(args), args.slice(0, index));
  }
});

test('if slice is called for all non-standard sizes', (t) => {
  const args = [1, 2, 3, 4, 5, 6, 7];
  const size = 6;

  const slice = sinon.spy(Array.prototype, 'slice');

  const result = maxArgs.createGetInitialArgs(size)(args);

  t.true(slice.calledOnce);
  t.true(slice.calledWith(0, size));

  slice.restore();

  t.deepEqual(result, args.slice(0, size));
});
