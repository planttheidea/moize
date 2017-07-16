// test
import test from 'ava';

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
