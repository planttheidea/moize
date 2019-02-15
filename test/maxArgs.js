// test
import sinon from 'sinon';

// src
import * as maxArgs from 'src/maxArgs';

test('if getInitialArgs will return the args themselves when the size is larger than the length', () => {
  const args = ['foo'];

  const result = maxArgs.createGetInitialArgs(2)(args);

  expect(result).toBe(args);
});

test('if a new array is produced appropriately for standard sizes', () => {
  const args = [1, 2, 3, 4, 5, 6, 7];

  for (let index = 0; index < 6; index++) {
    expect(maxArgs.createGetInitialArgs(index)(args)).toEqual(args.slice(0, index));
  }
});

test('if slice is called for all non-standard sizes', () => {
  const args = [1, 2, 3, 4, 5, 6, 7];
  const size = 6;

  const slice = sinon.spy(Array.prototype, 'slice');

  const result = maxArgs.createGetInitialArgs(size)(args);

  expect(slice.calledOnce).toBe(true);
  expect(slice.calledWith(0, size)).toBe(true);

  slice.restore();

  expect(result).toEqual(args.slice(0, size));
});
