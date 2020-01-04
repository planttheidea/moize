import moize from '../src';

function method(one: string, two: string) {
  return [one, two];
}

const foo = 'foo';
const bar = 'bar';

describe('moize.maxAge', () => {
  it('removes the item from cache after the time passed', async () => {
    const memoized = moize.maxAge(1000)(method, {
      onExpire: jest.fn(),
    });

    memoized(foo, bar);

    expect(memoized.has([foo, bar])).toBe(true);
    expect(memoized.options.onExpire).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(memoized.has([foo, bar])).toBe(false);
    expect(memoized.options.onExpire).toHaveBeenCalled();
  });

  it('updates the expiration when called and cache is hit', async () => {
    const withUpdateExpire = moize.maxAge(1000, true)(method);

    withUpdateExpire(foo, bar);

    setTimeout(() => {
      expect(withUpdateExpire.has([foo, bar])).toBe(true);
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, 700));

    withUpdateExpire(foo, bar);

    expect(withUpdateExpire.has([foo, bar])).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(withUpdateExpire.has([foo, bar])).toBe(false);
  });

  it('calls the onExpire method when the item is removed from cache', async () => {
    const onExpire = jest.fn();

    const withOnExpire = moize.maxAge(1000, onExpire)(method);

    withOnExpire(foo, bar);

    expect(withOnExpire.has([foo, bar])).toBe(true);
    expect(withOnExpire.options.onExpire).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(withOnExpire.has([foo, bar])).toBe(false);
    expect(withOnExpire.options.onExpire).toHaveBeenCalledTimes(1);
  });

  it('updates the expiration timing and calls the onExpire method when the item is removed from cache', async () => {
    const onExpire = jest.fn();

    const withExpireOptions = moize.maxAge(1000, { onExpire, updateExpire: true })(method);

    withExpireOptions(foo, bar);

    setTimeout(() => {
      expect(withExpireOptions.has([foo, bar])).toBe(true);
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, 700));

    withExpireOptions(foo, bar);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(withExpireOptions.has([foo, bar])).toBe(false);
    expect(withExpireOptions.options.onExpire).toHaveBeenCalledTimes(1);
  });
});
