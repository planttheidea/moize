// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

// src
import MultipleParameterCacheKey from 'src/MultipleParameterCacheKey';

test('if the instance is constructed with the correct values', (t) => {
  const key = ['foo', 'bar'];

  const result = new MultipleParameterCacheKey(key);

  t.deepEqual(
    {...result},
    {
      key,
      size: key.length
    }
  );
});

test('if matches will return false if the key passed is not a multi-parameter key', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = ['foo'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the key passed is a multi-parameter key that is a different length', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = ['foo', 'bar', 'baz'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the key passed is a multi-parameter key that is not shallowly equal', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = ['foo', 'baz'];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the key passed is a multi-parameter key that is shallowly equal', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [...existingKey];

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom will return false if the key passed is not a multi-parameter key', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the key passed is a multi-parameter key that is a different length', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the key passed is a multi-parameter key that is not equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'baz'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the key passed is a multi-parameter key that is equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom passes the key to match and the instance key as the parameters to isEqual', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

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
