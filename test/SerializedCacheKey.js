// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

// src
import SerializedCacheKey from 'src/SerializedCacheKey';
import * as serialize from 'src/serialize';

const serializerFunction = serialize.createArgumentSerializer({
  maxArgs: Number.POSITIVE_INFINITY,
  serializeFunctions: false
});

test('if the instance is constructed with the correct values', (t) => {
  const key = [{foo: 'bar'}];

  const result = new SerializedCacheKey(serializerFunction(key));

  t.deepEqual({...result}, {
    key: serializerFunction(key)
  });
});

test('if matches will return false if the key passed is not equal to the serialized key', (t) => {
  const key = [{foo: 'bar'}];
  const existingKey = serializerFunction(key);

  const cacheKey = new SerializedCacheKey(existingKey);

  const newKey = [{bar: 'baz'}];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the key passed is equal to the serialized key', (t) => {
  const key = [{foo: 'bar'}];
  const existingKey = serializerFunction(key);

  const cacheKey = new SerializedCacheKey(existingKey);

  const newKey = serializerFunction([{...key[0]}]);

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom wll return false if the key passed is not equal to the serialized key based on the custom method', (t) => {
  const key = [{foo: 'bar'}];
  const existingKey = serializerFunction(key);

  const cacheKey = new SerializedCacheKey(existingKey);

  const newKey = serializerFunction([{bar: 'baz'}]);

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return true if the key passed is equal to the serialized key based on the custom method', (t) => {
  const key = [{foo: 'bar'}];
  const existingKey = serializerFunction(key);

  const cacheKey = new SerializedCacheKey(existingKey);

  const newKey = serializerFunction([{...key[0]}]);

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom passes the key to match and the instance key as the parameters to isEqual', (t) => {
  const key = [{foo: 'bar'}];
  const existingKey = serializerFunction(key);

  const cacheKey = new SerializedCacheKey(existingKey);

  const newKey = serializerFunction([{...key[0]}]);

  const isEqual = sinon.spy();

  cacheKey.matchesCustom(newKey, isEqual);

  t.true(isEqual.calledOnce);

  const args = isEqual.args[0];

  t.is(args.length, 2);

  const [
    keyToTest,
    instanceKey
  ] = args;

  t.is(keyToTest, newKey);
  t.is(instanceKey, existingKey);
});
