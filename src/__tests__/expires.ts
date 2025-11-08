import { expect, test, vi } from 'vitest';
import { moize } from '../index.js';

function method(one: string, two: string) {
    return [one, two];
}

const foo = 'foo';
const bar = 'bar';

test('removes the item from cache after the time passed via option', async () => {
    const memoized = moize.expires(100)(method);
    const onExpire = vi.fn();

    memoized.cache.on('delete', onExpire);

    memoized(foo, bar);

    expect(memoized.cache.has([foo, bar])).toBe(true);
    expect(onExpire).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(memoized.cache.has([foo, bar])).toBe(false);
    expect(onExpire).toHaveBeenCalled();
});

test('removes the item from cache after the time passed via convenience method', async () => {
    const memoized = moize(method, { expires: 100 });
    const onExpire = vi.fn();

    memoized.cache.on('delete', onExpire);

    memoized(foo, bar);

    expect(memoized.cache.has([foo, bar])).toBe(true);
    expect(onExpire).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(memoized.cache.has([foo, bar])).toBe(false);
    expect(onExpire).toHaveBeenCalled();
});

test('updates the expiration when called and cache is hit via option', async () => {
    const withUpdateExpire = moize.expires({ after: 100, update: true })(
        method,
    );

    withUpdateExpire(foo, bar);

    setTimeout(() => {
        expect(withUpdateExpire.cache.has([foo, bar])).toBe(true);
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 70));

    withUpdateExpire(foo, bar);

    expect(withUpdateExpire.cache.has([foo, bar])).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(withUpdateExpire.cache.has([foo, bar])).toBe(false);
});

test('updates the expiration when called and cache is hit via convenience method', async () => {
    const withUpdateExpire = moize(method, {
        expires: { after: 100, update: true },
    });

    withUpdateExpire(foo, bar);

    setTimeout(() => {
        expect(withUpdateExpire.cache.has([foo, bar])).toBe(true);
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 70));

    withUpdateExpire(foo, bar);

    expect(withUpdateExpire.cache.has([foo, bar])).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(withUpdateExpire.cache.has([foo, bar])).toBe(false);
});

test('updates the expiration timing via option and calls the onExpire method when the item is removed from cache', async () => {
    const withExpireOptions = moize(method, {
        expires: { after: 100, update: true },
    });
    const onExpire = vi.fn();

    withExpireOptions.cache.on('delete', onExpire);

    withExpireOptions(foo, bar);
    expect(onExpire).not.toHaveBeenCalled();

    setTimeout(() => {
        expect(onExpire).not.toHaveBeenCalled();
        expect(withExpireOptions.cache.has([foo, bar])).toBe(true);
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 70));

    withExpireOptions(foo, bar);
    expect(onExpire).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(withExpireOptions.cache.has([foo, bar])).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
});

test('updates the expiration timing via convenience method and calls the onExpire method when the item is removed from cache', async () => {
    const withExpireOptions = moize.expires({
        after: 100,
        update: true,
    })(method);
    const onExpire = vi.fn();

    withExpireOptions.cache.on('delete', onExpire);

    withExpireOptions(foo, bar);
    expect(onExpire).not.toHaveBeenCalled();

    setTimeout(() => {
        expect(onExpire).not.toHaveBeenCalled();
        expect(withExpireOptions.cache.has([foo, bar])).toBe(true);
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 70));

    withExpireOptions(foo, bar);
    expect(onExpire).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(withExpireOptions.cache.has([foo, bar])).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
});

test('allows the expiration to be re-established if `shouldRemove returns false', async () => {
    const shouldRemove = vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValue(true);
    const withShouldRemove = moize.expires({ after: 100, shouldRemove })(
        method,
    );

    withShouldRemove(foo, bar);

    expect(withShouldRemove.cache.has([foo, bar])).toBe(true);
    expect(shouldRemove).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 110));

    expect(withShouldRemove.cache.has([foo, bar])).toBe(true);
    expect(shouldRemove).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 110));

    expect(withShouldRemove.cache.has([foo, bar])).toBe(false);
    expect(shouldRemove).toHaveBeenCalledTimes(2);
});

test('notifies of cache change when expiration re-established if onCacheChange', async () => {
    const shouldRemove = vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValue(true);
    const withShouldRemove = moize(method, {
        expires: { after: 100, shouldRemove },
    });

    const onUpdate = vi.fn();
    withShouldRemove.cache.on('update', onUpdate);

    withShouldRemove(foo, bar);

    expect(withShouldRemove.cache.has([foo, bar])).toBe(true);
    expect(shouldRemove).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 110));

    expect(withShouldRemove.cache.has([foo, bar])).toBe(true);
    expect(shouldRemove).toHaveBeenCalledWith(
        [foo, bar],
        [foo, bar],
        100,
        withShouldRemove.cache,
    );

    await new Promise((resolve) => setTimeout(resolve, 110));

    expect(withShouldRemove.cache.has([foo, bar])).toBe(false);
    expect(shouldRemove).toHaveBeenNthCalledWith(
        2,
        [foo, bar],
        [foo, bar],
        100,
        withShouldRemove.cache,
    );

    expect(onUpdate).toHaveBeenCalledWith({
        cache: withShouldRemove.cache,
        key: [foo, bar],
        reason: 'expiration reset',
        type: 'update',
        value: [foo, bar],
    });
});
