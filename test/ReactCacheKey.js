// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

// src
import ReactCacheKey from 'src/ReactCacheKey';

test('if the instance is constructed with the correct values', (t) => {
  const key = [
    {foo: 'bar'},
    {bar: 'baz'}
  ];

  const result = new ReactCacheKey(key);

  t.deepEqual({...result}, {
    key: {
      context: key[1],
      contextSize: Object.keys(key[1]).length,
      props: key[0],
      propsSize: Object.keys(key[0]).length
    }
  });
});

test('if the instance is constructed with the correct values when not all the expected args are passed', (t) => {
  const key = [];

  const result = new ReactCacheKey(key);

  t.deepEqual({...result}, {
    key: {
      context: undefined,
      contextSize: 0,
      props: undefined,
      propsSize: 0
    }
  });
});

test('if _isPropCustomEqual will return false if the key is not the same size as the prop on this.key', (t) => {
  const existingKey = [
    {foo: 'bar'},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const prop = 'props';
  const object = {foo: 'bar', bar: 'baz'};

  const result = cacheKey._isPropCustomEqual(prop, object, _.isEqual);

  t.false(result);
});

test('if _isPropCustomEqual will return false if the key is not equal to the prop on this.key based on the custom method', (t) => {
  const existingKey = [
    {foo: {
      bar: 'baz'
    }},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const prop = 'props';
  const object = {foo: {
    bar: 'foo'
  }};

  const result = cacheKey._isPropCustomEqual(prop, object, _.isEqual);

  t.false(result);
});

test('if _isPropCustomEqual will return true if the key is equal to the prop on this.key based on the custom method', (t) => {
  const existingKey = [
    {foo: {
      bar: 'baz'
    }},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const prop = 'props';
  const object = {foo: {
    bar: 'baz'
  }};

  const result = cacheKey._isPropCustomEqual(prop, object, _.isEqual);

  t.true(result);
});

test('if _isPropShallowEqual will return false if the key is not the same size as the prop on this.key', (t) => {
  const existingKey = [
    {foo: 'bar'},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const prop = 'props';
  const object = {foo: 'bar', bar: 'baz'};

  const result = cacheKey._isPropShallowEqual(prop, object);

  t.false(result);
});

test('if _isPropShallowEqual will return false if the key is not shallowly equal to the prop on this.key', (t) => {
  const existingKey = [
    {foo: 'bar'},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const prop = 'props';
  const object = {bar: 'baz'};

  const result = cacheKey._isPropShallowEqual(prop, object);

  t.false(result);
});

test('if _isPropShallowEqual will return true if the key is shallowly equal to the prop on this.key', (t) => {
  const existingKey = [
    {foo: 'bar'},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const prop = 'props';
  const object = {foo: 'bar'};

  const result = cacheKey._isPropShallowEqual(prop, object);

  t.true(result);
});

test('if matches will return false if the props passed are not shallowly equal to those in this.key', (t) => {
  const existingKey = [
    {foo: 'bar'},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {bar: 'baz'},
    {}
  ];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the context passed is not shallowly equal to that in this.key', (t) => {
  const existingKey = [
    {},
    {foo: 'bar'}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {},
    {bar: 'baz'}
  ];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the key passed is a multi-parameter key that is shallowly equal', (t) => {
  const existingKey = [
    {foo: 'bar'},
    {bar: 'baz'}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {...existingKey[0]},
    {...existingKey[1]}
  ];

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom will return false if the props passed are not equal to those in this.key based on the custom method', (t) => {
  const existingKey = [
    {foo: {
      bar: 'baz'
    }},
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {bar: {
      baz: 'foo'
    }},
    {}
  ];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the context passed are not equal to those in this.key based on the custom method', (t) => {
  const existingKey = [
    {},
    {foo: {
      bar: 'baz'
    }}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {},
    {bar: {
      baz: 'foo'
    }}
  ];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return true if the key passed is a multi-parameter key that is equal based on the custom method', (t) => {
  const existingKey = [
    {foo: {
      bar: 'baz'
    }},
    {bar: {
      baz: 'foo'
    }}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {foo: {
      bar: 'baz'
    }},
    {bar: {
      baz: 'foo'
    }}
  ];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom passes the key to match and the instance key as the parameters to isEqual', (t) => {
  const existingKey = [
    {foo: {
      bar: 'baz'
    }},
    {bar: {
      baz: 'foo'
    }}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {foo: {
      bar: 'baz'
    }},
    {bar: {
      baz: 'foo'
    }}
  ];

  const isEqual = sinon.stub().returns(true);

  cacheKey.matchesCustom(newKey, isEqual);

  t.true(isEqual.calledTwice);

  const propsArgs = isEqual.args[0];

  t.is(propsArgs.length, 2);

  const [
    propsToTest,
    instanceProps
  ] = propsArgs;

  t.is(propsToTest, newKey[0]);
  t.is(instanceProps, existingKey[0]);

  const contextArgs = isEqual.args[1];

  t.is(contextArgs.length, 2);

  const [
    contextToTest,
    instanceContext
  ] = contextArgs;

  t.is(contextToTest, newKey[1]);
  t.is(instanceContext, existingKey[1]);
});
