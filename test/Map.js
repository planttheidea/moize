import test from 'ava';

import {
  MapLike
} from 'src/Map';

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

test('if forEach will loop over all items in the array', (t) => {
  const map = new MapLike();
  const key = 'foo';
  const value = 'bar';

  map.set(key, value);
  map.set(value, key);

  const expectedArray = [
    {key, value},
    {key: value, value: key}
  ];

  let array = [];

  map.forEach((value, key) => {
    array.push({
      key,
      value
    });
  });

  t.deepEqual(array, expectedArray);
});

test('if get will return the value for the passed key in map', (t) => {
  const map = new MapLike();
  const key = 'foo';
  const value = 'bar';

  map.set(key, value);

  t.is(map.get(key), value);
  t.deepEqual(map.lastItem, {
    key,
    value
  });

  t.is(map.get(value), undefined);

  map.set(value, key);

  t.is(map.get(value), key);
  t.deepEqual(map.lastItem, {
    key: value,
    value: key
  });
});

test('if has will identify the existence of a key in the map', (t) => {
  const map = new MapLike();
  const key = 'foo';
  const value = 'bar';

  map.set(key, value);

  t.true(map.has(key));
  t.deepEqual(map.lastItem, {
    key,
    value
  });
  t.false(map.has('bar'));
});

test('if set will add the key and value passed to the map', (t) => {
  const map = new MapLike();

  const key = 'foo';
  const value = 'bar';

  const result = map.set(key, value);

  t.is(result, map);

  const lastItem = {
    key,
    value
  };

  t.deepEqual(map.list, [lastItem]);
  t.deepEqual(map.lastItem, lastItem);
  t.is(map.size, 1);
});

test('if set will update the key and value already in the map', (t) => {
  const map = new MapLike();

  const key = 'foo';
  const value = 'bar';
  const newValue = 'baz';

  const lastItem = {
    key: value,
    value: newValue
  };

  map.set(key, value);
  map.set(value, newValue);

  const result = map.set(key, newValue);

  t.is(result, map);

  const newLastItem = {
    key,
    value: newValue
  };

  t.deepEqual(map.list, [newLastItem, lastItem]);
  t.deepEqual(map.lastItem, newLastItem);
  t.is(map.size, 2);

  map.set(value, newValue);

  const newNewLastItem = {
    key: value,
    value: newValue
  };

  t.deepEqual(map.list, [newLastItem, newNewLastItem]);
  t.deepEqual(map.lastItem, newNewLastItem);
  t.is(map.size, 2);

  map.set(value, key);

  const finalLastItem = {
    key: value,
    value: key
  };

  t.deepEqual(map.list, [newLastItem, finalLastItem]);
  t.deepEqual(map.lastItem, finalLastItem);
  t.is(map.size, 2);
});
