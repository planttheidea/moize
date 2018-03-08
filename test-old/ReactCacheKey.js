// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

// src
import ReactCacheKey from 'src/ReactCacheKey';

test('if the instance is constructed with the correct values', (t) => {
  const key = [{foo: 'bar'}, {bar: 'baz'}];

  const result = new ReactCacheKey(key);

  t.deepEqual(
    {...result},
    {
      key: {
        context: {
          keys: Object.keys(key[1]),
          size: Object.keys(key[1]).length,
          value: key[1]
        },
        props: {
          keys: Object.keys(key[0]),
          size: Object.keys(key[0]).length,
          value: key[0]
        }
      }
    }
  );
});

test('if the instance is constructed with the correct values when not all the expected args are passed', (t) => {
  const key = [];

  const result = new ReactCacheKey(key);

  t.deepEqual(
    {...result},
    {
      key: {
        context: {
          keys: [],
          size: 0,
          value: undefined
        },
        props: {
          keys: [],
          size: 0,
          value: undefined
        }
      }
    }
  );
});

test('if _getKeyPart will return the key part when it is exists', (t) => {
  const object = {
    foo: 'bar',
    bar: 'baz'
  };

  const keyPart = ReactCacheKey.prototype._getKeyPart.call(null, object);

  t.deepEqual(keyPart, {
    keys: Object.keys(object),
    size: Object.keys(object).length,
    value: object
  });
});

test('if _getKeyPart will return an empty key part when the object is falsy', (t) => {
  const object = undefined;

  const keyPart = ReactCacheKey.prototype._getKeyPart.call(null, object);

  t.deepEqual(keyPart, {
    keys: [],
    size: 0,
    value: object
  });
});

test('if _isPropCustomEqual will return false if the key is not the same size as the prop on this.key', (t) => {
  const existingKey = [{foo: 'bar'}, {}];

  const cacheKey = new ReactCacheKey(existingKey);
  const object = {foo: 'bar', bar: 'baz'};

  const result = cacheKey._isPropCustomEqual(object, cacheKey.key.props.value, _.isEqual);

  t.false(result);
});

test('if _isPropCustomEqual will return false if the key is not equal to the prop on this.key based on the custom method', (t) => {
  const existingKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);
  const object = {
    foo: {
      bar: 'foo'
    }
  };

  const result = cacheKey._isPropCustomEqual(object, cacheKey.key.props.value, _.isEqual);

  t.false(result);
});

test('if _isPropCustomEqual will return true if the key is equal to the prop on this.key based on the custom method', (t) => {
  const existingKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const object = {
    foo: {
      bar: 'baz'
    }
  };

  const result = cacheKey._isPropCustomEqual(object, cacheKey.key.props.value, _.isEqual);

  t.true(result);
});

test('if _isPropShallowEqual will return false if the key is not the same size as the prop on this.key', (t) => {
  const existingKey = [{foo: 'bar'}, {}];

  const cacheKey = new ReactCacheKey(existingKey);

  const object = {foo: 'bar', bar: 'baz'};

  const result = cacheKey._isPropShallowEqual(object, cacheKey.key.props);

  t.false(result);
});

test('if _isPropShallowEqual will return false if the key is not shallowly equal to the prop on this.key', (t) => {
  const existingKey = [{foo: 'bar'}, {}];

  const cacheKey = new ReactCacheKey(existingKey);

  const object = {bar: 'baz'};

  const result = cacheKey._isPropShallowEqual(object, cacheKey.key.props);

  t.false(result);
});

test('if _isPropShallowEqual will return true if the key is shallowly equal to the prop on this.key', (t) => {
  const existingKey = [{foo: 'bar'}, {}];

  const cacheKey = new ReactCacheKey(existingKey);

  const object = {foo: 'bar'};

  const result = cacheKey._isPropShallowEqual(object, cacheKey.key.props);

  t.true(result);
});

test('if matches will return false if the props passed are not shallowly equal to those in this.key', (t) => {
  const existingKey = [{foo: 'bar'}, {}];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [{bar: 'baz'}, {}];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return false if the context passed is not shallowly equal to that in this.key', (t) => {
  const existingKey = [{}, {foo: 'bar'}];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [{}, {bar: 'baz'}];

  const result = cacheKey.matches(newKey);

  t.false(result);
});

test('if matches will return true if the key passed is a multi-parameter key that is shallowly equal', (t) => {
  const existingKey = [{foo: 'bar'}, {bar: 'baz'}];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [{...existingKey[0]}, {...existingKey[1]}];

  const result = cacheKey.matches(newKey);

  t.true(result);
});

test('if matchesCustom will return false if the props passed are not equal to those in this.key based on the custom method', (t) => {
  const existingKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {}
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {
      bar: {
        baz: 'foo'
      }
    },
    {}
  ];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return false if the context passed are not equal to those in this.key based on the custom method', (t) => {
  const existingKey = [
    {},
    {
      foo: {
        bar: 'baz'
      }
    }
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {},
    {
      bar: {
        baz: 'foo'
      }
    }
  ];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.false(result);
});

test('if matchesCustom will return true if the key passed is a multi-parameter key that is equal based on the custom method', (t) => {
  const existingKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {
      bar: {
        baz: 'foo'
      }
    }
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {
      bar: {
        baz: 'foo'
      }
    }
  ];

  const result = cacheKey.matchesCustom(newKey, _.isEqual);

  t.true(result);
});

test('if matchesCustom passes the key to match and the instance key as the parameters to isEqual', (t) => {
  const existingKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {
      bar: {
        baz: 'foo'
      }
    }
  ];

  const cacheKey = new ReactCacheKey(existingKey);

  const newKey = [
    {
      foo: {
        bar: 'baz'
      }
    },
    {
      bar: {
        baz: 'foo'
      }
    }
  ];

  const isEqual = sinon.stub().returns(true);

  cacheKey.matchesCustom(newKey, isEqual);

  t.true(isEqual.calledTwice);

  const propsArgs = isEqual.args[0];

  t.is(propsArgs.length, 2);

  const [propsToTest, instanceProps] = propsArgs;

  t.is(propsToTest, newKey[0]);
  t.is(instanceProps, existingKey[0]);

  const contextArgs = isEqual.args[1];

  t.is(contextArgs.length, 2);

  const [contextToTest, instanceContext] = contextArgs;

  t.is(contextToTest, newKey[1]);
  t.is(instanceContext, existingKey[1]);
});
