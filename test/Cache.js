import test from 'ava';

import Cache from 'src/Cache';

test('if creating a new Cache creates an object with the correct instance values', (t) => {
  const result = new Cache();

  t.deepEqual(result.list, []);
  t.is(result.lastItem, undefined);
  t.is(result.size, 0);
});

test('if delete will remove the key and value pair from the cache', (t) => {
  const cache = new Cache();
  const key = 'foo';

  cache.set(key, 'bar');

  t.true(cache.has(key));

  cache.delete(key);

  t.false(cache.has(key));
});

test('if delete will set lastItem to undefined when the only item is removed', (t) => {
  const cache = new Cache();
  const key = 'foo';

  cache.set(key, 'bar');

  t.true(cache.has(key));

  cache.delete(key);

  t.false(cache.has(key));
  t.is(cache.lastItem, undefined);
});

test('if delete will set lastItem to the first item in the list when an item is removed', (t) => {
  const cache = new Cache();
  const key = 'foo';

  cache.set(key, 'bar');
  cache.set('bar', 'baz');
  cache.set('baz', 'foo');

  t.true(cache.has(key));

  cache.delete(key);

  t.false(cache.has(key));
  t.is(cache.size, 2);
  t.is(cache.lastItem, cache.list[0]);
});

test('if delete will do nothing when a match for the key is not found', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const otherKey = 'bar';

  cache.set(key, 'baz');

  t.true(cache.has(key));

  cache.delete(otherKey);

  t.true(cache.has(key));
  t.false(cache.has(otherKey));
});

test('if get will return the value for the passed key in cache', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  t.false(cache.has(key));

  cache.set(key, value);

  t.is(cache.get(key), value);

  t.deepEqual(cache.lastItem, {
    key,
    isMultiParamKey: false,
    value
  });

  t.false(cache.has(value));

  cache.set(value, key);

  t.is(cache.get(value), key);

  t.deepEqual(cache.lastItem, {
    key: value,
    isMultiParamKey: false,
    value: key
  });
});

test('if get will keep the order of retrieval correct', (t) => {
  const cache = new Cache();

  cache.set('first', 1);
  cache.set('second', 2);
  cache.set('third', 3);
  cache.set('fourth', 4);

  const first = {
    key: 'first',
    isMultiParamKey: false,
    value: 1
  };
  const second = {
    key: 'second',
    isMultiParamKey: false,
    value: 2
  };
  const third = {
    key: 'third',
    isMultiParamKey: false,
    value: 3
  };
  const fourth = {
    key: 'fourth',
    isMultiParamKey: false,
    value: 4
  };

  t.deepEqual(cache.list, [
    fourth,
    third,
    second,
    first
  ]);

  cache.get('third');
  cache.get('second');

  t.deepEqual(cache.list, [
    second,
    third,
    fourth,
    first
  ]);

  cache.set('fifth', 5);

  const fifth = {
    key: 'fifth',
    isMultiParamKey: false,
    value: 5
  };

  t.deepEqual(cache.list, [
    fifth,
    second,
    third,
    fourth,
    first
  ]);

  cache.delete('fifth');

  t.deepEqual(cache.list, [
    second,
    third,
    fourth,
    first
  ]);
});

test('if get will return undefined when no match for the key is found', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const otherKey = 'bar';

  cache.set(key, 'baz');

  t.true(cache.has(key));
  t.false(cache.has(otherKey));

  const result = cache.get(otherKey);

  t.is(result, undefined);
});

test('if has will identify the existence of a key in the cache', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  cache.set(key, value);

  t.true(cache.has(key));
  t.deepEqual(cache.lastItem, {
    key,
    isMultiParamKey: false,
    value
  });
  t.false(cache.has('bar'));
});

test('if set will add the key and value passed to the cache', (t) => {
  const cache = new Cache();

  const key = 'foo';
  const value = 'bar';

  cache.set(key, value);

  const lastItem = {
    key,
    isMultiParamKey: false,
    value
  };

  t.deepEqual(cache.list, [lastItem]);
  t.deepEqual(cache.lastItem, lastItem);
  t.is(cache.size, 1);
});

test('if update will assign a new value to the item already in cache', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  cache.set(key, value);

  t.is(cache.get(key), value);

  const newValue = 'baz';

  cache.update(key, newValue);

  t.is(cache.get(key), newValue);
});

test('if update will not update anything if no match for the key is found', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const otherKey = 'bar';

  cache.set(key, 'baz');

  t.true(cache.has(key));
  t.false(cache.has(otherKey));

  cache.update(otherKey, 'quz');

  t.is(cache.get(key), 'baz');
  t.is(cache.size, 1);
  t.false(cache.has(otherKey));
});

test('if update will not update the lastItem if the key does not match the lastItem key', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const otherKey = 'bar';

  cache.set(key, 'baz');
  cache.set(otherKey, 'quz');

  cache.update(key, 'blah');

  t.is(cache.get(key), 'blah');
  t.deepEqual(cache.lastItem, {
    isMultiParamKey: false,
    key,
    value: cache.get(key)
  });
});
