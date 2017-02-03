import test from 'ava';

import MapLike from 'src/MapLike';

test('if creating a new MapLike creates an object with the correct instance values', (t) => {
  const result = new MapLike();

  t.deepEqual(result.list, []);
  t.is(result.lastItem, undefined);
  t.is(result.size, 0);
});

test('if delete will remove the key and value pair from the map', (t) => {
  const map = new MapLike();
  const key = 'foo';

  map.set(key, 'bar');

  t.true(map.has(key));

  map.delete(key);

  t.false(map.has(key));
});

test('if get will return the value for the passed key in map', (t) => {
  const map = new MapLike();
  const key = 'foo';
  const value = 'bar';

  map.set(key, value);

  t.is(map.get(key), value);
  t.deepEqual(map.lastItem, {
    key,
    isMultiParamKey: false,
    value
  });

  t.is(map.get(value), undefined);

  map.set(value, key);

  t.is(map.get(value), key);
  t.deepEqual(map.lastItem, {
    key: value,
    isMultiParamKey: false,
    value: key
  });
});

test('if get will keep the order of retrieval correct', (t) => {
  const map = new MapLike();

  map.set('first', 1);
  map.set('second', 2);
  map.set('third', 3);
  map.set('fourth', 4);

  t.deepEqual(map.list, [
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);

  map.get('third');
  map.get('second');

  t.deepEqual(map.list, [
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);

  map.set('fifth', 5);

  t.deepEqual(map.list, [
    {key: 'fifth', isMultiParamKey: false, value: 5},
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);

  map.delete('fifth');

  t.deepEqual(map.list, [
    {key: 'second', isMultiParamKey: false, value: 2},
    {key: 'third', isMultiParamKey: false, value: 3},
    {key: 'fourth', isMultiParamKey: false, value: 4},
    {key: 'first', isMultiParamKey: false, value: 1}
  ]);
});

test('if has will identify the existence of a key in the map', (t) => {
  const map = new MapLike();
  const key = 'foo';
  const value = 'bar';

  map.set(key, value);

  t.true(map.has(key));
  t.deepEqual(map.lastItem, {
    key,
    isMultiParamKey: false,
    value
  });
  t.false(map.has('bar'));
});

test('if set will add the key and value passed to the map', (t) => {
  const map = new MapLike();

  const key = 'foo';
  const value = 'bar';

  map.set(key, value);

  const lastItem = {
    key,
    isMultiParamKey: false,
    value
  };

  t.deepEqual(map.list, [lastItem]);
  t.deepEqual(map.lastItem, lastItem);
  t.is(map.size, 1);
});
