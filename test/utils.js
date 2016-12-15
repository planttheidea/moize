import test from 'ava';

import {
  decycle,
  deleteItemFromCache,
  getCacheKey,
  getFunctionWithCacheAdded,
  getIndexOf,
  getStringifiedArgument,
  isComplexObject,
  isEqual,
  isKeyLastItem,
  isValueObjectOrArray,
  serializeArguments,
  setNewCachedValue,
  splice,
  unshift,
  setExpirationOfCache,
  setUsageOrder,
  stringify
} from 'src/utils';

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

test('if decycle will return an object that has circular references removed', (t) => {
  const object = {
    foo: {
      bar: 'baz'
    }
  };

  object.foo.baz = object.foo;
  object.foo.blah = [object.foo];

  const result = decycle(object);

  t.deepEqual(result, {
    foo: {
      bar: 'baz',
      baz: {
        $ref: '$["foo"]'
      },
      blah: [
        {
          $ref: '$["foo"]'
        }
      ]
    }
  });
});

test('if deleteItemFromCache will remove an item from both cache and usage', (t) => {
  const key = 'foo';
  const cache = new Map().set(key, 'bar');
  const usage = [key];

  deleteItemFromCache(cache, usage, key);

  t.false(cache.has(key));
  t.deepEqual(usage, []);
});

test('if deleteItemFromCache will only delete something when the key is actually found', (t) => {
  const key = 'foo';
  const cache = new Map().set(key, 'bar');
  const usage = [key];

  deleteItemFromCache(cache, usage, 'bar');

  t.true(cache.has(key));
  t.deepEqual(usage, [key]);
});

test('if getCacheKey returns the first item in the array if the only item', (t) => {
  const item = {
    foo: 'bar'
  };
  const args = [item];

  const result = getCacheKey(args);

  t.is(result, item);
});

test('if getCacheKey returns a stringified value of the args passed if more than one item', (t) => {
  const item = {
    foo: 'bar'
  };
  const item2 = 'baz';
  const args = [item, item2];

  const expectedResult = '|{"foo":"bar"}|baz|';
  const result = getCacheKey(args, serializeArguments);

  t.is(result, expectedResult);
});

test('if getFunctionWithCacheAdded will add the cache passed to the function and create the usage array', (t) => {
  let fn = () => {};
  let cache = {
    foo: 'bar'
  };

  const result = getFunctionWithCacheAdded(fn, cache);

  t.is(result, fn);
  t.is(result.cache, cache);
  t.deepEqual(result.usage, []);
  t.is(typeof result.clear, 'function');
  t.is(typeof result.delete, 'function');
  t.is(typeof result.keys, 'function');
});

test('if getFunctionWithCacheAdded clear method will clear cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Map();

  const result = getFunctionWithCacheAdded(fn, cache);

  result.cache.set(key, 'bar');
  result.usage.push(key);

  t.true(result.cache.has(key));
  t.deepEqual(result.usage, [key]);

  result.clear();

  t.is(result.cache.size, 0);
  t.deepEqual(result.usage, []);
});

test('if getFunctionWithCacheAdded delete method will remove the key passed from cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Map();

  const result = getFunctionWithCacheAdded(fn, cache);

  result.cache.set(key, 'bar');
  result.usage.push(key);

  t.true(result.cache.has(key));
  t.deepEqual(result.usage, [key]);

  result.delete(key);

  t.false(result.cache.has(key));
  t.deepEqual(result.usage, []);
});

test('if getFunctionWithCacheAdded keys method will return the list of keys in cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Map();

  const cachedFn = getFunctionWithCacheAdded(fn, cache);

  cachedFn.cache.set(key, 'bar');
  cachedFn.usage.push(key);

  t.true(cachedFn.cache.has(key));

  const result = cachedFn.keys();

  t.deepEqual(result, [key]);
});

test('if getIndexOf returns the index of the item in the map, else -1', (t) => {
  const map = {
    list: [{key: 'foo'}, {key: 'bar'}, {key: 'baz'}],
    size: 3
  };
  const foo = 'foo';
  const notFoo = 'notFoo';

  t.is(getIndexOf(map, foo), 0);
  t.is(getIndexOf(notFoo), -1);
});

test('if getStringifiedArgument returns the argument if primitive, else returns a JSON.stringified version of it', (t) => {
  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar'
  };

  t.is(getStringifiedArgument(string), string);
  t.is(getStringifiedArgument(number), number);
  t.is(getStringifiedArgument(boolean), boolean);
  t.is(getStringifiedArgument(object), JSON.stringify(object));
});

test('if isComplexObject correctly identifies a complex object', (t) => {
  const fail = ['foo', 123, true, undefined, null, () => {}];
  const pass = [{foo: 'bar'}, ['foo']];

  fail.forEach((item) => {
    t.false(isComplexObject(item));
  });

  pass.forEach((item) => {
    t.true(isComplexObject(item));
  });
});

test('if isEqual checks strict equality and if NaN', (t) => {
  const foo = 'foo';
  const otherFoo = 'foo';
  const notFoo = 'bar';
  const nan = NaN;
  const otherNan = NaN;
  const notNan = 123;

  t.true(isEqual(foo, otherFoo));
  t.false(isEqual(foo, notFoo));

  t.true(isEqual(nan, otherNan));
  t.false(isEqual(nan, notNan));
});

test('if isValueObjectOrArray correctly determines if an item is an object / array or not', (t) => {
  const bool = new Boolean(true);
  const string = new String('foo');
  const date = new Date();
  const number = new Number(1);
  const regexp = /foo/;
  const object = {};
  const array = [];

  t.false(isValueObjectOrArray(bool));
  t.false(isValueObjectOrArray(string));
  t.false(isValueObjectOrArray(date));
  t.false(isValueObjectOrArray(number));
  t.false(isValueObjectOrArray(regexp));
  t.true(isValueObjectOrArray(object));
  t.true(isValueObjectOrArray(array));
});

test('if isKeyLastItem checks for the existence of the lastItem and then if the key matches the value passed', (t) => {
  const key = 'foo';
  const lastItem = {
    key
  };
  const lastItemNotKey = {
    key: 'bar'
  };

  t.false(isKeyLastItem(undefined, key));
  t.true(isKeyLastItem(lastItem, key));
  t.false(isKeyLastItem(lastItemNotKey, key));
});

test('if serializeArguments produces a stringified version of the arguments with a separator', (t) => {
  const args = ['foo', 123, true, {
    bar: 'baz'
  }];

  const expectedResult = '|foo|123|true|{"bar":"baz"}|';
  const result = serializeArguments(args);

  t.is(expectedResult, result);
});

test('if serializeArguments limits the key creation when maxArgs is passed', (t) => {
  const args = ['foo', 123, true, {
    bar: 'baz'
  }];

  const expectedResult = '|foo|123|';
  const result = serializeArguments(args, true, 2);

  t.is(expectedResult, result);
});

test('if setNewCachedValue will run the set method if not a promise', async (t) => {
  const keyToSet = 'foo';
  const valueToSet = 'bar';

  let fn = {
    cache: {
      set(key, value) {
        t.is(key, keyToSet);
        t.is(value, valueToSet);
      }
    }
  };

  const result = await setNewCachedValue(fn, keyToSet, valueToSet, false);

  t.is(result, valueToSet);
});

test('if setNewCachedValue will run the set method upon resolution if a promise', async (t) => {
  const resolutionValue = 'bar';

  const keyToSet = 'foo';
  const valueToSet = Promise.resolve(resolutionValue);

  let fn = {
    cache: {
      set(key, value) {
        t.is(key, keyToSet);
        t.is(value, resolutionValue);
      }
    }
  };

  const result = await setNewCachedValue(fn, keyToSet, valueToSet, true);

  t.is(result, resolutionValue);
});

test('if setNewCachedValue will set the cache to expire if isMaxAgeFinite is true', async (t) => {
  const keyToSet = 'foo';
  const valueToSet = 'bar';
  const maxAge = 100;

  let fn = {
    cache: new Map(),
    usage: [keyToSet]
  };

  await setNewCachedValue(fn, keyToSet, valueToSet, false, true, maxAge);

  t.is(fn.cache.get(keyToSet), valueToSet);

  await sleep(maxAge);

  t.is(fn.cache.get(keyToSet), undefined);
});

test('if splice performs the same operation as the native splice', (t) => {
  const indexToSpice = 1;

  let nativeArray = ['foo', 'bar'],
      customArray = [...nativeArray];

  nativeArray.splice(indexToSpice, 1);
  splice(customArray, indexToSpice);

  t.deepEqual(nativeArray, customArray);
});

test('if splice returns immediately when an empty array is passed', (t) => {
  let array = [];

  const originalArrayLength = array.length;

  splice(array, 0);

  t.is(array.length, originalArrayLength);
});

test('if unshift performs the same operation as the native unshift', (t) => {
  const valueToUnshift = 'baz';

  let nativeArray = ['foo', 'bar'],
      customArray = [...nativeArray];

  nativeArray.unshift(valueToUnshift);
  unshift(customArray, valueToUnshift);

  t.deepEqual(nativeArray, customArray);
});

test('if setExpirationOfCache will expire the cache after the age passed', async (t) => {
  const fn = {
    cache: new Map().set('foo', 'bar'),
    usage: ['foo']
  };

  setExpirationOfCache(fn, 'foo', 100);

  t.deepEqual(fn.cache, new Map().set('foo', 'bar'));
  t.deepEqual(fn.usage, ['foo']);

  await sleep(100);

  t.deepEqual(fn.cache, new Map());
  t.deepEqual(fn.usage, []);
});

test('if setExpirationOfCache will expire the cache immediately if less than 0', async (t) => {
  const fn = {
    cache: new Map().set('foo', 'bar'),
    usage: ['foo']
  };

  setExpirationOfCache(fn, 'foo', -1);

  await sleep(0);

  t.deepEqual(fn.cache, new Map());
  t.deepEqual(fn.usage, []);
});

test('if setUsageOrder will add the item to cache in the front', (t) => {
  const fn = {
    cache: new Map().set('foo', 'bar'),
    usage: ['foo']
  };

  setUsageOrder(fn, 'bar', Infinity);

  t.deepEqual(fn.usage, ['bar', 'foo']);
});

test('if setUsageOrder will move the existing item to the front', (t) => {
  const fn = {
    cache: new Map().set('foo', 'bar').set('bar', 'baz'),
    usage: ['foo', 'bar']
  };

  setUsageOrder(fn, 'bar', Infinity);

  t.deepEqual(fn.usage, ['bar', 'foo']);
});

test('if setUsageOrder will remove the item from cache if maxSize is reached', (t) => {
  const fn = {
    cache: new Map().set('foo', 'bar').set('bar', 'baz'),
    usage: ['foo', 'bar']
  };

  setUsageOrder(fn, 'bar', 1);

  t.deepEqual(fn.cache, new Map().set('bar', 'baz'));
  t.deepEqual(fn.usage, ['bar']);
});

test('if cycle.decycle is called only when object is cannot be handled by JSON.stringify', (t) => {
  const standard = {
    foo: 'bar'
  };
  const circular = {
    foo: {
      bar: 'baz'
    }
  };

  circular.foo.baz = circular.foo;

  const standardResult = stringify(standard);

  t.is(standardResult, '{"foo":"bar"}');

  const circularResult = stringify(circular);

  t.is(circularResult, '{"foo":{"bar":"baz","baz":{"$ref":"$[\\\"foo\\\"]"}}}');
});