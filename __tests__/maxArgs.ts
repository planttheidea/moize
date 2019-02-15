// src
import { createGetInitialArgs } from '../src/maxArgs';

describe('getInitialArgs', () => {
  it('should return the args themselves when the size is larger than the length', () => {
    const args = ['foo'];

    const result = createGetInitialArgs(2)(args);

    expect(result).toBe(args);
  });

  it('should produce a new array for standard sizes', () => {
    const args = [1, 2, 3, 4, 5, 6, 7];

    for (let index = 0; index < 6; index++) {
      expect(createGetInitialArgs(index)(args)).toEqual(args.slice(0, index));
    }
  });

  it('should create a shallow copy for all non-standard sizes', () => {
    const args = [1, 2, 3, 4, 5, 6, 7];
    const size = 6;

    const result = createGetInitialArgs(size)(args);

    expect(result).not.toBe(args);
    expect(result).toEqual(args.slice(0, size));
  });
});
