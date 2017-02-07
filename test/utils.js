// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

//src
import {
  addStaticPropertiesToFunction,
  createAddPropertiesToFunction,
  createGetCacheKey,
  createPluckFromInstanceList,
  createSetExpirationOfCache,
  createSetNewCachedValue,
  decycle,
  deleteItemFromCache,
  every,
  getFunctionName,
  getFunctionNameViaRegexp,
  getIndexOfKey,
  getMultiParamKey,
  getSerializerFunction,
  getStringifiedArgument,
  isArray,
  isCache,
  isComplexObject,
  isFunction,
  isFiniteAndPositive,
  isKeyShallowEqualWithArgs,
  isValueObjectOrArray,
  splice,
  unshift,
  stringify
} from '../src/utils';
import Cache from '../src/Cache';

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

test('if addStaticPropertiesToFunction will add static properties to the originalFn', (t) => {
  const originalFn = () => {};
  const memoizedFn = () => {};

  const foo = 'foo';
  const bar = 'bar';
  const baz = 'baz';

  originalFn.contextTypes = foo;
  originalFn.defaultProps = bar;
  originalFn.propTypes = baz;

  const result = addStaticPropertiesToFunction(originalFn, memoizedFn);

  t.is(result, memoizedFn);

  t.is(memoizedFn.contextTypes, foo);
  t.is(memoizedFn.defaultProps, bar);
  t.is(memoizedFn.propTypes, baz);
});

test('if addStaticPropertiesToFunction will only static properties that exist on the originalFn', (t) => {
  const originalFn = () => {};
  const memoizedFn = () => {};

  const foo = 'foo';

  originalFn.defaultProps = foo;

  addStaticPropertiesToFunction(originalFn, memoizedFn);

  t.is(memoizedFn.contextTypes, undefined);
  t.is(memoizedFn.defaultProps, foo);
  t.is(memoizedFn.propTypes, undefined);
});

test('if every matches the output of the native function', (t) => {
  const everyFoo = ['foo', 'foo'];
  const someFoo = ['foo', 'bar'];
  const noneFoo = ['bar', 'bar'];

  const isFoo = (item) => {
    return item === 'foo';
  };

  const everyResult = every(everyFoo, isFoo);
  const someResult = every(someFoo, isFoo);
  const noneResult = every(noneFoo, isFoo);

  t.true(everyResult);
  t.false(someResult);
  t.false(noneResult);

  t.is(everyResult, everyFoo.every(isFoo));
  t.is(someResult, someFoo.every(isFoo));
  t.is(noneResult, noneFoo.every(isFoo));
});

test('if every returns true when the array is empty', (t) => {
  t.true(every([]));
});

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

test('if deleteItemFromCache will remove an item from both cache', (t) => {
  const key = 'foo';
  const cache = new Cache();

  cache.set(key, 'bar');

  deleteItemFromCache(cache, key);

  t.false(cache.has(key));
});

test('if deleteItemFromCache will only delete something when the key is actually found', (t) => {
  const key = 'foo';
  const cache = new Cache();

  cache.set(key, 'bar');

  deleteItemFromCache(cache, 'bar');

  t.true(cache.has(key));
});

test('if createGetCacheKey returns a function that returns the first item in the array if the only item', (t) => {
  const getCacheKey = createGetCacheKey();

  const item = {
    foo: 'bar'
  };
  const args = [item];

  const result = getCacheKey(args);

  t.is(result, item);
});

test('if createGetCacheKey returns a function that returns a stringified value of the args passed if more than one item', (t) => {
  const cache = new Cache();
  const getCacheKey = createGetCacheKey(cache);

  const item = {
    foo: 'bar'
  };
  const item2 = 'baz';
  const args = [item, item2];

  const result = getCacheKey(args);

  t.is(result, args);
});

test('if createGetCacheKey returns a function that returns a limited arguments key for the arguments passed', (t) => {
  const cache = new Cache();
  const maxArgs = 1;
  const getCacheKey = createGetCacheKey(cache, false, null, false, maxArgs);

  const item = {
    foo: 'bar'
  };
  const item2 = 'baz';
  const args = [item, item2];

  const result = getCacheKey(args);

  t.is(result.length, maxArgs);
  t.deepEqual(result, [item]);
});

test('if createGetCacheKey will return undefined as a key when no arguments are passed', (t) => {
  const cache = new Cache();
  const getCacheKey = createGetCacheKey(cache);

  const args = [];

  const result = getCacheKey(args);

  t.is(result, undefined);
});

test('if createPluckFromInstanceList will create a method to pluck the key passed from the instance', (t) => {
  const cache = new Cache();

  cache.set('foo', 'bar');
  cache.set('bar', 'baz');

  const fn = createPluckFromInstanceList(cache, 'value');

  t.true(_.isFunction(fn));

  t.deepEqual(fn().sort(), ['bar', 'baz']);
});

test('if createPluckFromInstanceList will return a noop if the cache is not an instance of cache', (t) => {
  const cache = {
    list: [
      {
        key: 'foo',
        value: 'bar'
      }
    ]
  };

  const fn = createPluckFromInstanceList(cache, 'value');

  t.true(_.isFunction(fn));

  t.is(fn(), undefined);
});

test('if getFunctionName returns the name if it exists, else returns function', (t) => {
  function foo() {};

  const namedResult = getFunctionName(foo);

  t.is(namedResult, 'foo');

  foo.displayName = 'bar';

  const displayNameResult = getFunctionName(foo);

  t.is(displayNameResult, 'bar');

  const arrow = () => {};
  const arrowResult = getFunctionName(arrow);

  t.is(arrowResult, 'arrow');

  const lamdaResult = getFunctionName(() => {});

  t.is(lamdaResult, 'function');
});

test('if getFunctionNameViaRegexp will match the function name if it exists', (t) => {
  function foo() {}

  const namedResult = getFunctionNameViaRegexp(foo);

  t.is(namedResult, 'foo');

  const anonymousResult = getFunctionNameViaRegexp(function() {});

  t.is(anonymousResult, '');
});

test('if getFunctionWithAdditionalProperties will add the cache passed to the function', (t) => {
  let fn = () => {};
  let cache = {
    foo: 'bar'
  };

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  t.is(result, fn);
  t.is(result.cache, cache);
  t.is(typeof result.add, 'function');
  t.is(typeof result.clear, 'function');
  t.is(typeof result.delete, 'function');
  t.is(typeof result.keys, 'function');
  t.is(typeof result.values, 'function');
});

test('if getFunctionWithAdditionalProperties clear method will clear cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Cache();

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.cache.set(key, 'bar');

  t.true(result.cache.has(key));

  result.clear();

  t.is(result.cache.size, 0);
});

test('if getFunctionWithAdditionalProperties will have a displayName reflecting the original', (t) => {
  const originalFn = () => {};
  const key = 'foo';
  const cache = new Cache();

  cache.set(key, key);

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, originalFn);

  const fn = () => {};

  const result = getFunctionWithAdditionalProperties(fn);

  t.is(result.displayName, `Memoized(${originalFn.name})`);
});

test('if getFunctionWithAdditionalProperties add method will add a key => value pair to cache if it doesnt exist', (t) => {
  const fn = () => {};
  const cache = new Cache();
  const key = ['foo'];
  const value = 'bar';

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.add(key, value);

  t.true(result.cache.has(key));
  t.is(result.cache.get(key), value);
});

test('if getFunctionWithAdditionalProperties add method will not add a key => value pair to cache if it already exists', (t) => {
  const fn = () => {};
  const cache = new Cache();
  const key = ['foo'];
  const value = 'bar';

  cache.set(key, value);

  const spy = sinon.spy(cache, 'set');

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.add(key, value);

  t.true(result.cache.has(key));
  t.is(result.cache.size, 1);
  t.false(spy.calledOnce);

  spy.restore();
});

test('if getFunctionWithAdditionalProperties delete method will remove the key passed from cache', (t) => {
  const fn = () => {};
  const cache = new Cache();
  const key = getMultiParamKey(cache, ['foo']);

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.cache.set(key, 'bar');

  t.true(result.cache.has(key));

  result.delete(key);

  t.false(result.cache.has(key));
});

test('if getFunctionWithAdditionalProperties keys method will return the list of keys in cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Cache();

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const cachedFn = getFunctionWithAdditionalProperties(fn);

  cachedFn.cache.set(key, 'bar');

  t.true(cachedFn.cache.has(key));

  const result = cachedFn.keys();

  t.deepEqual(result, [key]);
});

test('if getFunctionWithAdditionalProperties values method will return the list of values in cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Cache();

  const getFunctionWithAdditionalProperties = createAddPropertiesToFunction(cache, fn);

  const cachedFn = getFunctionWithAdditionalProperties(fn);

  cachedFn.cache.set(key, 'bar');

  t.true(cachedFn.cache.has(key));

  const result = cachedFn.values();

  t.deepEqual(result, [cachedFn.cache.get(key)]);
});

test('if getIndexOfKey returns the index of the item in the map, else -1', (t) => {
  const map = {
    list: [{key: 'foo'}, {key: 'bar'}, {key: 'baz'}],
    size: 3
  };
  const foo = 'foo';
  const notFoo = 'notFoo';

  t.is(getIndexOfKey(map.list, map.size, foo), 0);
  t.is(getIndexOfKey(map.list, map.size, notFoo), -1);
});

test('if getMultiParamKey augments the arguments passed when no match is found', (t) => {
  const cache = new Cache();
  const args = ['foo', 'bar'];

  const result = getMultiParamKey(cache, args);

  t.is(result, args);
  t.true(result.isMultiParamKey);
});

test('if getMultiParamKey returns an existing array of arguments when match is found', (t) => {
  const existingArgList = [
    {
      key: ['foo', 'bar'],
      value: 'baz'
    }, {
      key: ['bar', 'baz'],
      value: 'foo'
    }
  ];
  const cache = new Cache();
  const args = ['foo', 'bar'];

  existingArgList.forEach((arg) => {
    arg.key.isMultiParamKey = true;

    cache.set(arg.key, arg.value);
  });

  const result = getMultiParamKey(cache, args);

  t.not(result, args);
  t.is(result, existingArgList[0].key);
  t.deepEqual(result, args);
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

test('if isArray correctly tests if array or not', (t) => {
  t.true(isArray([1, 2, 3]));
  t.false(isArray(123));
});

test('if isCache correctly tests if object passed is an instance of Cache', (t) => {
  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar'
  };
  const cache = new Cache();

  t.false(isCache(string));
  t.false(isCache(number));
  t.false(isCache(boolean));
  t.false(isCache(object));

  t.true(isCache(cache));
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

test('if isFunction tests if the item is a function or not', (t) => {
  const bool = true;
  const string = 'foo';
  const number = 123;
  const regexp = /foo/;
  const undef = undefined;
  const nil = null;
  const object = {};
  const array = [];
  const fn = () => {};

  t.false(isFunction(bool));
  t.false(isFunction(string));
  t.false(isFunction(number));
  t.false(isFunction(regexp));
  t.false(isFunction(undef));
  t.false(isFunction(nil));
  t.false(isFunction(object));
  t.false(isFunction(array));

  t.true(isFunction(fn));
});

test('if isFiniteAndPositive tests for finiteness and positivity', (t) => {
  t.true(isFiniteAndPositive(123));

  t.false(isFiniteAndPositive(Infinity));
  t.false(isFiniteAndPositive(0));
  t.false(isFiniteAndPositive(-0));
  t.false(isFiniteAndPositive(-123));
  t.false(isFiniteAndPositive(-Infinity));
});

test('if isKeyShallowEqualWithArgs returns false when value is falsy', (t) => {
  const value = null;
  const args = ['foo', 'bar'];

  const result = isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns false when value is not a multi-parameter key', (t) => {
  const value = {
    isMultiParamKey: false
  };
  const args = ['foo', 'bar'];

  const result = isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns false when value is an array whose length is different than that of args', (t) => {
  const value = ['foo'];
  const args = ['foo', 'bar'];

  const result = isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns false when value is an array whose values are different than args', (t) => {
  const object = {
    bar: 'baz'
  };
  const value = ['foo', object];
  const args = ['foo', {
    ...object
  }];

  const result = isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns true when value is an array whose values are shallowly equal to args', (t) => {
  const object = {
    bar: 'baz'
  };
  const value = ['foo', object];
  const args = ['foo', object];

  const result = isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns true when value and args both are empty arrays', (t) => {
  const value = [];
  const args = [];

  const result = isKeyShallowEqualWithArgs(value, args);

  t.false(result);
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

test('if getSerializerFunction returns a function that produces a stringified version of the arguments with a separator', (t) => {
  const serializeArguments = getSerializerFunction();

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const fn = () => {};
  const object = {
    foo() {},
    bar: 'baz'
  };
  const args = [string, number, boolean, fn, object];

  const expectedResult = `|${string}|${number}|${boolean}|${fn}|{"bar":"baz"}|`;
  const result = serializeArguments(args);

  t.is(expectedResult, result);
});

test('if serializeArguments limits the key creation when maxArgs is passed', (t) => {
  const serializeArguments = getSerializerFunction(null, false, 2);

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const fn = () => {};
  const object = {
    foo() {},
    bar: 'baz'
  };
  const args = [string, number, boolean, fn, object];

  const expectedResult = `|${string}|${number}|`;
  const result = serializeArguments(args);

  t.is(expectedResult, result);
});

test('if serializeArguments converts functions nested in objects to string when serializeFunctions is true', (t) => {
  const serializeArguments = getSerializerFunction(null, true);

  const string = 'foo';
  const number = 123;
  const boolean = true;
  const fn = () => {};
  const object = {
    foo() {},
    bar: 'baz'
  };
  const args = [string, number, boolean, fn, object];

  const expectedResult = `|${string}|${number}|${boolean}|${fn}|{"foo":"${object.foo.toString()}","bar":"baz"}|`;
  const result = serializeArguments(args);

  t.is(expectedResult, result);
});

test('if setNewCachedValue will run the set method if not a promise', async (t) => {
  const setNewCachedValue = createSetNewCachedValue(false);

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

  const result = await setNewCachedValue(fn, keyToSet, valueToSet);

  t.is(result, valueToSet);
});

test('if setNewCachedValue will run the set method upon resolution of a promise', async (t) => {
  const setNewCachedValue = createSetNewCachedValue(true);

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

  const result = await setNewCachedValue(fn, keyToSet, valueToSet);

  t.is(result, resolutionValue);
});

test('if setNewCachedValue will set the cache to expire if maxAge is finite', async (t) => {
  const keyToSet = 'foo';
  const valueToSet = 'bar';
  const maxAge = 100;

  const setNewCachedValue = createSetNewCachedValue(false, maxAge);

  let fn = {
    cache: new Cache()
  };

  await setNewCachedValue(fn, keyToSet, valueToSet);

  t.is(fn.cache.get(keyToSet), valueToSet);

  await sleep(maxAge);

  t.is(fn.cache.get(keyToSet), undefined);
});

test('if setNewCacheValue will delete the item if the maxSize is set', (t) => {
  const keyToSet = 'foo';
  const valueToSet = 'bar';
  const cache = new Cache();

  cache.set('bar', 'baz');

  const setNewCacheValue = createSetNewCachedValue(false, Infinity, 1);

  const fn = {
    cache
  };

  setNewCacheValue(fn, keyToSet, valueToSet);

  t.deepEqual(cache.list, [
    {key: keyToSet, isMultiParamKey: false, value: valueToSet}
  ]);
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
  const setExpirationOfCache = createSetExpirationOfCache(100);

  const fn = {
    cache: new Cache()
  };

  fn.cache.set('foo', 'bar');

  setExpirationOfCache(fn, 'foo');

  const expectedCache = new Cache();

  expectedCache.set('foo', 'bar');

  t.deepEqual(fn.cache, expectedCache);

  await sleep(100);

  t.deepEqual(fn.cache, new Cache());
});

test('if setExpirationOfCache will expire the cache immediately if less than 0', async (t) => {
  const setExpirationOfCache = createSetExpirationOfCache(-1);

  const fn = {
    cache: new Cache()
  };

  fn.cache.set('foo', 'bar');

  setExpirationOfCache(fn, 'foo');

  await sleep(0);

  t.deepEqual(fn.cache, new Cache());
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
