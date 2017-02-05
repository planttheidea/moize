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

test('if get will return the value for the passed key in cache', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  cache.set(key, value);

  t.is(cache.get(key), value);
  t.deepEqual(cache.lastItem, {
    key,
    isMultiParamKey: false,
    value
  });

  t.is(cache.get(value), undefined);

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

  t.deepEqual(cache.list, [
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);

  cache.get('third');
  cache.get('second');

  t.deepEqual(cache.list, [
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);

  cache.set('fifth', 5);

  t.deepEqual(cache.list, [
    {key: 'fifth', isMultiParamKey: false, value: 5},
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);

  cache.delete('fifth');

  t.deepEqual(cache.list, [
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);
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

test('if setLastItem will assign the item passed to lastItem', (t) => {
  const cache = new Cache();
  const value = {
    foo: 'bar'
  };

  cache.setLastItem(value);

  t.is(cache.lastItem, value);
});

test('if updateSize will assign the list length to the cache size property', (t) => {
  const cache = new Cache();

  cache.list = [
    'foo',
    'bar'
  ];

  t.is(cache.list.length, 2);

  cache.updateSize();

  t.is(cache.size, cache.list.length);
});
