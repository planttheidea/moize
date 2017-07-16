// test
import test from 'ava';

// src
import SingleParameterCacheKey from 'src/SingleParameterCacheKey';

test('if the instance is constructed with the correct values', (t) => {
  const key = ['foo'];

  const result = new SingleParameterCacheKey(key);

  t.deepEqual({...result}, {
    isMultiParamKey: false,
    key: key[0]
  });
});

test('if matches will return false if the key passed is a multi-parameter key', (t) => {
  const existingKey = ['foo'];

  const cacheKey = new SingleParameterCacheKey(existingKey);

  const newKey = ['foo', 'bar'];
  const isMultiParamKey = true;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.false(result);
});

test('if matches will return false if the key passed is not a multi-parameter key that is not equal', (t) => {
  const existingKey = ['foo'];

  const cacheKey = new SingleParameterCacheKey(existingKey);

  const newKey = ['bar'];
  const isMultiParamKey = false;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.false(result);
});

test('if matches will return true if the key passed is not a multi-parameter key that is equal', (t) => {
  const existingKey = ['foo'];

  const cacheKey = new SingleParameterCacheKey(existingKey);

  const newKey = [...existingKey];
  const isMultiParamKey = false;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.true(result);
});
