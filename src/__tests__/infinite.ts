import { expect, test, vi } from 'vitest';
import { moize } from '../index.js';

test('it stores all the unique calls made', () => {
    const fn = vi.fn((index: number) => ({ index }));
    const moized = moize.infinite(fn);

    const size = 1000;

    for (let index = 0; index < size; ++index) {
        moized(index);
    }

    expect(fn).toHaveBeenCalledTimes(size);

    for (let index = 0; index < size; ++index) {
        moized(index);
    }

    expect(fn).toHaveBeenCalledTimes(size);
});
