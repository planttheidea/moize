// test
import test from 'ava';
import sinon from 'sinon';
import {sleep} from 'test/helpers/utils';

// src
import Cache from 'src/Cache';
import {DEFAULT_OPTIONS} from 'src/constants';

test('if creating a new Cache creates an object with the correct instance values', (t) => {
  const result = new Cache(DEFAULT_OPTIONS);

  t.deepEqual(result.list, []);
  t.deepEqual(result.lastItem, {});
  t.is(result.size, 0);
});

test('if add will add the key and value passed to the cache', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);

  const key = 'foo';
  const value = 'bar';

  cache.add(key, value);

  const lastItem = {
    key,
    value
  };

  t.deepEqual(cache.list, [lastItem]);
  t.deepEqual(cache.lastItem, lastItem);
  t.is(cache.size, 1);
});

test('if clear will return the cache to its original empty state', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);

  cache.add('foo', 'bar');
  cache.add('bar', 'baz');

  t.not(cache.size, 0);
  t.notDeepEqual(cache.lastItem, {});
  t.notDeepEqual(cache.list, []);

  cache.clear();

  t.is(cache.size, 0);
  t.deepEqual(cache.lastItem, {});
  t.deepEqual(cache.list, []);
});

test('if expireAfter will remove the item from cache after maxAge', async (t) => {
  const key = 'foo';
  const maxAge = 100;

  const cache = new Cache({
    ...DEFAULT_OPTIONS,
    maxAge
  });

  cache.add(key, 'bar');

  t.true(cache.has(key));

  cache.expireAfter(key);

  await sleep(maxAge + 50);

  t.false(cache.has(key));
});

test('if expireAfter will call an onExpire callback', async (t) => {
  const key = {key: 'foo'};
  const maxAge = 100;
  const onExpire = sinon.spy((k) => {
    t.is(k, 'foo');
  });

  const cache = new Cache({
    ...DEFAULT_OPTIONS,
    maxAge,
    onExpire
  });

  cache.add(key, 'bar');
  cache.expireAfter(key);

  await sleep(maxAge + 50);

  t.true(onExpire.calledOnce);
});

test('if expireAfter will clear the timeout and add a new one when updateExpire is true if a timeout exists in cache already', async (t) => {
  const key = {key: 'foo'};
  const maxAge = 100;
  const onExpire = sinon.spy((k) => {
    t.is(k, 'foo');
  });

  const clearTimeoutSpy = sinon.spy(global, 'clearTimeout');

  const cache = new Cache({
    ...DEFAULT_OPTIONS,
    maxAge,
    onExpire,
    updateExpire: true
  });

  cache.add(key, 'bar');
  cache.expireAfter(key);

  const originalTimeoutId = cache.expirations[0].timeoutId;

  cache.expireAfter(key);

  t.true(clearTimeoutSpy.calledOnce);
  t.true(clearTimeoutSpy.calledWith(originalTimeoutId));

  await sleep(maxAge + 50);

  t.true(onExpire.calledOnce);
  t.is(cache.expirations.length, 0);
});

test('if onExpire callback can reset cache age', async (t) => {
  const key = {key: 'foo'};
  const maxAge = 100;

  let stillGood = 1;

  const onExpire = sinon.spy((k) => {
    t.is(k, 'foo');

    stillGood--;

    return !!stillGood;
  });

  const cache = new Cache({
    ...DEFAULT_OPTIONS,
    maxAge,
    onExpire
  });

  cache.add(key, 'bar');
  cache.expireAfter(key);

  await sleep(maxAge + 50);

  t.true(onExpire.calledOnce);

  await sleep(maxAge + 50);

  t.true(onExpire.calledTwice);

  await sleep(maxAge);

  t.false(onExpire.calledThrice);
});

test('if get will return undefined if there are no items in cache', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);

  const result = cache.get('foo');

  t.is(result, undefined);
});

test('if get will return the value for the passed key in cache', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';
  const value = 'bar';

  t.false(cache.has(key));

  cache.add(key, value);

  t.is(cache.get(key), value);

  t.deepEqual(cache.lastItem, {
    key,
    value
  });

  t.false(cache.has(value));

  cache.add(value, key);

  t.is(cache.get(value), key);

  t.deepEqual(cache.lastItem, {
    key: value,
    value: key
  });
});

test('if get will keep the order of retrieval correct', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);

  cache.add('first', 1);
  cache.add('second', 2);
  cache.add('third', 3);
  cache.add('fourth', 4);

  const first = {
    key: 'first',
    value: 1
  };
  const second = {
    key: 'second',
    value: 2
  };
  const third = {
    key: 'third',
    value: 3
  };
  const fourth = {
    key: 'fourth',
    value: 4
  };

  t.deepEqual(cache.list, [fourth, third, second, first]);

  cache.get('third');
  cache.get('second');

  t.deepEqual(cache.list, [second, third, fourth, first]);

  cache.add('fifth', 5);

  const fifth = {
    key: 'fifth',
    value: 5
  };

  t.deepEqual(cache.list, [fifth, second, third, fourth, first]);

  cache.remove('fifth');

  t.deepEqual(cache.list, [second, third, fourth, first]);
});

test('if get will call expireAfter with the key if updateExpire is true and is the lastItem', (t) => {
  const cache = new Cache({
    ...DEFAULT_OPTIONS,
    updateExpire: true
  });

  cache.expireAfter = sinon.stub();

  const key = 'foo';
  const value = 'bar';

  t.false(cache.has(key));

  cache.add(key, value);

  t.is(cache.get(key), value);

  t.true(cache.expireAfter.calledOnce);
  t.true(cache.expireAfter.calledWith(key));
});

test('if get will call expireAfter with the key if updateExpire is true and is not the lastItem', (t) => {
  const cache = new Cache({
    ...DEFAULT_OPTIONS,
    updateExpire: true
  });

  cache.expireAfter = sinon.stub();

  const key = 'first';
  const value = 1;

  cache.add(key, value);
  cache.add('second', 2);

  t.not(cache.lastItem.key, key);
  t.true(cache.has(key));

  t.is(cache.get(key), value);

  t.true(cache.expireAfter.calledOnce);
  t.true(cache.expireAfter.calledWith(key));
});

test('if get will return undefined when no match for the key is found', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const otherKey = 'bar';

  cache.add(key, 'baz');

  t.true(cache.has(key));
  t.false(cache.has(otherKey));

  const result = cache.get(otherKey);

  t.is(result, undefined);
});

test('if has will identify the existence of a key in the cache', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';
  const value = 'bar';

  cache.add(key, value);

  t.true(cache.has(key));
  t.deepEqual(cache.lastItem, {
    key,
    value
  });
  t.false(cache.has('bar'));
});

test('if remove will remove the key and value pair from the cache', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';

  cache.add(key, 'bar');

  t.true(cache.has(key));

  cache.remove(key);

  t.false(cache.has(key));
});

test('if remove will set lastItem to undefined when the only item is removed', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';

  cache.add(key, 'bar');

  t.true(cache.has(key));

  cache.remove(key);

  t.false(cache.has(key));
  t.deepEqual(cache.lastItem, {});
});

test('if remove will set lastItem to the first item in the list when an item is removed', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';

  cache.add(key, 'bar');
  cache.add('bar', 'baz');
  cache.add('baz', 'foo');

  t.true(cache.has(key));

  cache.remove(key);

  t.false(cache.has(key));
  t.is(cache.size, 2);
  t.is(cache.lastItem, cache.list[0]);
});

test('if remove will do nothing when a match for the key is not found', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';
  const otherKey = 'bar';

  cache.add(key, 'baz');

  t.true(cache.has(key));

  cache.remove(otherKey);

  t.true(cache.has(key));
  t.false(cache.has(otherKey));
});

test('if update will assign a new value to the item already in cache', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';
  const value = 'bar';

  cache.add(key, value);

  t.is(cache.get(key), value);

  const newValue = 'baz';

  cache.update(key, newValue);

  t.is(cache.get(key), newValue);
});

test('if update will not update anything if no match for the key is found', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';
  const otherKey = 'bar';

  cache.add(key, 'baz');

  t.true(cache.has(key));
  t.false(cache.has(otherKey));

  cache.update(otherKey, 'quz');

  t.is(cache.get(key), 'baz');
  t.is(cache.size, 1);
  t.false(cache.has(otherKey));
});

test('if update will not update the lastItem if the key does not match the lastItem key', (t) => {
  const cache = new Cache(DEFAULT_OPTIONS);
  const key = 'foo';
  const otherKey = 'bar';

  cache.add(key, 'baz');
  cache.add(otherKey, 'quz');

  cache.update(key, 'blah');

  t.is(cache.get(key), 'blah');
  t.deepEqual(cache.lastItem, {
    key,
    value: cache.get(key)
  });
});
