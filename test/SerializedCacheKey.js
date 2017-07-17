// test
import test from 'ava';
import _ from 'lodash';

// src
import SerializedCacheKey from 'src/SerializedCacheKey';
import * as serialize from 'src/serialize';

const serializerFunction = serialize.createArgumentSerializer({
  maxArgs: Number.POSITIVE_INFINITY,
  serializeFunctions: false
});

test('if the instance is constructed with the correct values', (t) => {
  const key = [{foo: 'bar'}];

  const result = new SerializedCacheKey(key, serializerFunction);

  t.deepEqual({...result}, {
    key: serializerFunction(key),
    serializer: serializerFunction
  });
});

test('if matches will return false if the key passed is not equal to the serialized key', (t) => {
  const existingKey = [{foo: 'bar'}];

  const cacheKey = new SerializedCacheKey(existingKey, serializerFunction);

  const newKey = [{bar: 'baz'}];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the key passed is equal to the serialized key', (t) => {
  const existingKey = [{foo: 'bar'}];

  const cacheKey = new SerializedCacheKey(existingKey, serializerFunction);

  const newKey = [{...existingKey[0]}];

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom wll return false if the key passed is not equal to the serialized key based on the custom method', (t) => {
  const existingKey = [{foo: 'bar'}];

  const cacheKey = new SerializedCacheKey(existingKey, serializerFunction);

  const newKey = [{bar: 'baz'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom wll return true if the key passed is equal to the serialized key based on the custom method', (t) => {
  const existingKey = [{foo: 'bar'}];

  const cacheKey = new SerializedCacheKey(existingKey, serializerFunction);

  const newKey = [{...existingKey[0]}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});
