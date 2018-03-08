// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

// src
import StandardCacheKey from 'src/StandardCacheKey';

test('if the instance is constructed with the correct values for single-parameter key', (t) => {
  const key = ['foo'];

  const result = new StandardCacheKey(key);

  t.deepEqual(
    {...result},
    {
      key: key[0],
      size: 1
    }
  );
});

test('if matches will return false if the original key is single-parameter and the new key passed is a multi-parameter key', (t) => {
  const existingKey = ['foo'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = ['foo', 'bar'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the original key is single-parameter and the new key passed is a single-parameter key that is not equal', (t) => {
  const existingKey = ['foo'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = ['bar'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the original key is single-parameter and the new key passed is a single-parameter key that is equal', (t) => {
  const existingKey = ['foo'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [...existingKey];

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom will return false if the original key is single-parameter and the new key passed is a multi-parameter key', (t) => {
  const existingKey = [{foo: 'foo'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the original key is single-parameter and the new key passed is a single-parameter key that is not equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'bar'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return true if the original key is single-parameter and the new key passed is a single-parameter key that is equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom pases the key to match and the instance key as the parameters to isEqual', (t) => {
  const existingKey = [{foo: 'foo'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}];

  const isEqual = sinon.spy();

  cacheKey.matchesCustom(newKey, isEqual);

  t.true(isEqual.calledOnce);

  const args = isEqual.args[0];

  t.is(args.length, 2);

  const [keyToTest, instanceKey] = args;

  t.is(keyToTest, newKey[0]);
  t.is(instanceKey, existingKey[0]);
});

test('if the instance is constructed with the correct values for multi-parameter key', (t) => {
  const key = ['foo', 'bar'];

  const result = new StandardCacheKey(key);

  t.deepEqual(
    {...result},
    {
      key,
      size: key.length
    }
  );
});

test('if matches will return false if the original key is multi-parameter and the new key passed is a single-parameter key', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = ['foo'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the original key is multi-parameter and the new key passed is a multi-parameter key that is a different length', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = ['foo', 'bar', 'baz'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the original key is multi-parameter and the new key passed is a multi-parameter key that is not shallowly equal', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = ['foo', 'baz'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the original key is multi-parameter and the new key passed is a multi-parameter key that is shallowly equal', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [...existingKey];

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom will return false if the original key is multi-parameter and the new key passed is a single-parameter key', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the original key is multi-parameter and the new key passed is a multi-parameter key that is a different length', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the original key is multi-parameter and the new key passed is a multi-parameter key that is not equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'baz'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the original key is multi-parameter and the new key passed is a multi-parameter key that is equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom passes the key to match and the instance key as the parameters to isEqual', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new StandardCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}];

  const isEqual = sinon.spy();

  cacheKey.matchesCustom(newKey, isEqual);

  t.true(isEqual.calledOnce);

  const args = isEqual.args[0];

  t.is(args.length, 2);

  const [keyToTest, instanceKey] = args;

  t.is(keyToTest, newKey);
  t.is(instanceKey, existingKey);
});
