// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

// src
import MultipleParameterCacheKey from 'src/MultipleParameterCacheKey';

test('if the instance is constructed with the correct values', (t) => {
  const key = ['foo', 'bar'];

  const result = new MultipleParameterCacheKey(key);

  t.deepEqual({...result}, {
    isMultiParamKey: true,
    key,
    size: key.length
  });
});

test('if matches will return false if the key passed is not a multi-parameter key', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = ['foo'];
  const isMultiParamKey = false;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.false(result);
});

test('if matches will return false if the key passed is a multi-parameter key that is a different length', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = ['foo', 'bar', 'baz'];
  const isMultiParamKey = true;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.false(result);
});

test('if matches will return false if the key passed is a multi-parameter key that is not shallowly equal', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = ['foo', 'baz'];
  const isMultiParamKey = true;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.false(result);
});

test('if matches will return true if the key passed is a multi-parameter key that is shallowly equal', (t) => {
  const existingKey = ['foo', 'bar'];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [...existingKey];
  const isMultiParamKey = true;

  const result = cacheKey.matches(newKey, isMultiParamKey);

  t.true(result);
});

test('if matchesCustom will return false if the key passed is not a multi-parameter key', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}];
  const isMultiParamKey = false;

  const result = cacheKey.matchesCustom(newKey, isMultiParamKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the key passed is a multi-parameter key that is a different length', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}, {baz: 'baz'}];
  const isMultiParamKey = true;

  const result = cacheKey.matchesCustom(newKey, isMultiParamKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the key passed is a multi-parameter key that is not equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'baz'}];
  const isMultiParamKey = true;

  const result = cacheKey.matchesCustom(newKey, isMultiParamKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the key passed is a multi-parameter key that is equal based on the custom method', (t) => {
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}];
  const isMultiParamKey = true;

  const result = cacheKey.matchesCustom(newKey, isMultiParamKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom passes the key to match and the instance key as the parameters to isEqual', (t) =>{
  const existingKey = [{foo: 'foo'}, {bar: 'bar'}];

  const cacheKey = new MultipleParameterCacheKey(existingKey);

  const newKey = [{foo: 'foo'}, {bar: 'bar'}];
  const isMultiParamKey = true;

  const isEqual = sinon.spy();

  cacheKey.matchesCustom(newKey, isMultiParamKey, isEqual);

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
