// test
import test from 'ava';
import _ from 'lodash';
import sinon from 'sinon';

//src
import * as utils from '../src/utils';
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

  const result = utils.addStaticPropertiesToFunction(originalFn, memoizedFn);

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

  utils.addStaticPropertiesToFunction(originalFn, memoizedFn);

  t.is(memoizedFn.contextTypes, undefined);
  t.is(memoizedFn.defaultProps, foo);
  t.is(memoizedFn.propTypes, undefined);
});

test('if compose will compose multiple functions to a single function', (t) => {
  const firstStub = sinon.stub().callsFake(_.identity);
  const secondStub = sinon.stub().callsFake(_.identity);
  const thirdStub = sinon.stub().callsFake(_.identity);

  const value = 'foo';

  const composed = utils.compose(thirdStub, secondStub, firstStub);

  const result = composed(value);

  t.true(firstStub.calledOnce);
  t.true(firstStub.calledWith(value));

  t.true(secondStub.calledOnce);
  t.true(secondStub.calledWith(value));

  t.true(thirdStub.calledOnce);
  t.true(thirdStub.calledWith(value));

  t.is(result, value);
});

test('if createCurriableOptionMethod will create a method that accepts a value and passes the option with that value to the function passed', (t) => {
  const option = 'foo';
  const value = 'bar';

  const fn = sinon.stub().callsFake((object) => {
    t.deepEqual(object, {
      [option]: value
    });
  });

  const result = utils.createCurriableOptionMethod(fn, option);

  t.true(_.isFunction(result));

  result(value);

  t.true(fn.calledOnce);
});

test('if every matches the output of the native function', (t) => {
  const everyFoo = ['foo', 'foo'];
  const someFoo = ['foo', 'bar'];
  const noneFoo = ['bar', 'bar'];

  const isFoo = (item) => {
    return item === 'foo';
  };

  const everyResult = utils.every(everyFoo, isFoo);
  const someResult = utils.every(someFoo, isFoo);
  const noneResult = utils.every(noneFoo, isFoo);

  t.true(everyResult);
  t.false(someResult);
  t.false(noneResult);

  t.is(everyResult, everyFoo.every(isFoo));
  t.is(someResult, someFoo.every(isFoo));
  t.is(noneResult, noneFoo.every(isFoo));
});

test('if every returns true when the array is empty', (t) => {
  t.true(utils.every([]));
});

test('if decycle will return an object that has circular references removed', (t) => {
  const object = {
    foo: {
      bar: 'baz'
    }
  };

  object.foo.baz = object.foo;
  object.foo.blah = [object.foo];

  const result = utils.decycle(object);

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

  utils.deleteItemFromCache(cache, key);

  t.false(cache.has(key));
});

test('if deleteItemFromCache will only delete something when the key is actually found', (t) => {
  const key = 'foo';
  const cache = new Cache();

  cache.set(key, 'bar');

  utils.deleteItemFromCache(cache, 'bar');

  t.true(cache.has(key));
});

test('if createGetCacheKey returns a function that returns the first item in the array if the only item', (t) => {
  const getCacheKey = utils.createGetCacheKey();

  const item = {
    foo: 'bar'
  };
  const args = [item];

  const result = getCacheKey(args);

  t.is(result, item);
});

test('if createGetCacheKey returns a function that returns a stringified value of the args passed if more than one item', (t) => {
  const cache = new Cache();
  const getCacheKey = utils.createGetCacheKey(cache);

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
  const getCacheKey = utils.createGetCacheKey(cache, false, null, false, maxArgs);

  const item = {
    foo: 'bar'
  };
  const item2 = 'baz';
  const args = [item, item2];

  const result = getCacheKey(args);

  t.is(result, item);
});

test('if createGetCacheKey will return undefined as a key when no arguments are passed', (t) => {
  const cache = new Cache();
  const getCacheKey = utils.createGetCacheKey(cache);

  const args = [];

  const result = getCacheKey(args);

  t.is(result, undefined);
});

test('if createPluckFromInstanceList will create a method to pluck the key passed from the instance', (t) => {
  const cache = new Cache();

  cache.set('foo', 'bar');
  cache.set('bar', 'baz');

  const fn = utils.createPluckFromInstanceList(cache, 'value');

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

  const fn = utils.createPluckFromInstanceList(cache, 'value');

  t.true(_.isFunction(fn));

  t.is(fn(), undefined);
});

test('if createPromiseRejecter will create a function that will delete the item from cache and return a rejected promise', (t) => {
  const key = 'foo';
  const exception = new Error();
  const cache = {
    delete(keyToDelete) {
      t.is(keyToDelete, key);
    }
  };
  const promiseLibrary = {
    reject(error) {
      t.is(error, exception);
    }
  };

  const result = utils.createPromiseRejecter(cache, key, promiseLibrary);

  t.true(_.isFunction(result));

  result(exception);
});

test('if createPromiseResolver will create a function that will update the item in cache and return the resolvedValue', (t) => {
  const key = 'foo';
  const resolvedValue = 'bar';
  const cache = {
    updateItem(keyToUpdate) {
      t.is(keyToUpdate, key);
    }
  };
  const hasMaxAge = false;
  const setExpirationOfCache = () => {};
  const promiseLibrary = {
    resolve(value) {
      t.is(value, resolvedValue);
    }
  };

  const result = utils.createPromiseResolver(cache, key, hasMaxAge, setExpirationOfCache, promiseLibrary);

  t.true(_.isFunction(result));

  result(resolvedValue);
});

test('if createPromiseResolver will create a function that will set the cache to expire if hasMaxAge is true', (t) => {
  const key = 'foo';
  const resolvedValue = 'bar';
  const cache = {
    updateItem() {}
  };
  const hasMaxAge = true;
  const setExpirationOfCache = (cacheToExpire, keyToExpire) => {
    t.is(cacheToExpire, cache);
    t.is(keyToExpire, key);
  };
  const promiseLibrary = {
    resolve() {}
  };

  const result = utils.createPromiseResolver(cache, key, hasMaxAge, setExpirationOfCache, promiseLibrary);

  t.true(_.isFunction(result));

  result(resolvedValue);
});

test('if getFunctionName returns the name if it exists, else returns function', (t) => {
  function foo() {}

  const namedResult = utils.getFunctionName(foo);

  t.is(namedResult, 'foo');

  foo.displayName = 'bar';

  const displayNameResult = utils.getFunctionName(foo);

  t.is(displayNameResult, 'bar');

  const arrow = () => {};
  const arrowResult = utils.getFunctionName(arrow);

  t.is(arrowResult, 'arrow');

  const lamdaResult = utils.getFunctionName(() => {});

  t.is(lamdaResult, 'function');
});

test('if getFunctionNameViaRegexp will match the function name if it exists', (t) => {
  function foo() {}

  const namedResult = utils.getFunctionNameViaRegexp(foo);

  t.is(namedResult, 'foo');

  const anonymousResult = utils.getFunctionNameViaRegexp(function() {}); //eslint-disable-line prefer-arrow-callback

  t.is(anonymousResult, '');
});

test('if getFunctionWithAdditionalProperties will add the cache passed to the function', (t) => {
  let fn = () => {};
  let cache = {
    foo: 'bar'
  };

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  t.is(result, fn);
  t.is(result.cache, cache);
  t.is(typeof result.add, 'function');
  t.is(typeof result.clear, 'function');
  t.is(typeof result.delete, 'function');
  t.is(typeof result.hasCacheFor, 'function');
  t.is(typeof result.keys, 'function');
  t.is(typeof result.values, 'function');
});

test('if getFunctionWithAdditionalProperties clear method will clear cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Cache();

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

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

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, originalFn);

  const fn = () => {};

  const result = getFunctionWithAdditionalProperties(fn);

  t.is(result.displayName, `Memoized(${originalFn.name})`);
});

test('if getFunctionWithAdditionalProperties add method will add a key => value pair to cache if it doesnt exist', (t) => {
  const fn = () => {};
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.add(key, value);

  t.true(result.cache.has(key));
  t.is(result.cache.get(key), value);
});

test('if getFunctionWithAdditionalProperties add method will not add a key => value pair to cache if it already exists', (t) => {
  const fn = () => {};
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  cache.set(key, value);

  const spy = sinon.spy(cache, 'set');

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

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
  const key = utils.getKeyForCache(cache, ['foo']);

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.cache.set(key, 'bar');

  t.true(result.cache.has(key));

  result.delete(key);

  t.false(result.cache.has(key));
});

test('if getFunctionWithAdditionalProperties hasCacheFor method will determine if the cache for the given keys exists', (t) => {
  const fn = () => {};
  const cache = new Cache();
  const key = utils.getKeyForCache(cache, ['foo', 'bar']);

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

  const result = getFunctionWithAdditionalProperties(fn);

  result.cache.set(key, 'baz');

  t.true(result.cache.has(key));

  t.true(result.hasCacheFor('foo', 'bar'));
  t.false(result.hasCacheFor('foo'));
});

test('if getFunctionWithAdditionalProperties keys method will return the list of keys in cache', (t) => {
  const fn = () => {};
  const key = 'foo';
  const cache = new Cache();

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

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

  const getFunctionWithAdditionalProperties = utils.createAddPropertiesToFunction(cache, fn);

  const cachedFn = getFunctionWithAdditionalProperties(fn);

  cachedFn.cache.set(key, 'bar');

  t.true(cachedFn.cache.has(key));

  const result = cachedFn.values();

  t.deepEqual(result, [cachedFn.cache.get(key)]);
});

test('if getIndexOfKey returns the index of the item in the map, else -1', (t) => {
  const cache = new Cache();

  cache.set('foo', 'foo');
  cache.set('bar', 'bar');
  cache.set('baz', 'baz');

  const foo = 'foo';
  const notFoo = 'notFoo';

  t.is(utils.getIndexOfKey(cache, foo), 2);
  t.is(utils.getIndexOfKey(cache, notFoo), -1);
});

test('if getKeyForCache will return the only argument itself if the length is one', (t) => {
  const cache = new Cache();
  const key = 'foo';

  const result = utils.getKeyForCache(cache, [key]);

  t.is(result, key);
});

test('if getKeyForCache will return the multi-parameter key if the length more than one', (t) => {
  const cache = new Cache();
  const key = 'foo';
  const key2 = 'bar';

  const result = utils.getKeyForCache(cache, [key, key2]);

  t.deepEqual(result, [key, key2]);
  t.true(result.isMultiParamKey);
});

test('if getMultiParamKey augments the arguments passed when no match is found', (t) => {
  const cache = new Cache();
  const args = ['foo', 'bar'];

  const result = utils.getMultiParamKey(cache, args);

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

  const result = utils.getMultiParamKey(cache, args);

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

  t.is(utils.getStringifiedArgument(string), string);
  t.is(utils.getStringifiedArgument(number), number);
  t.is(utils.getStringifiedArgument(boolean), boolean);
  t.is(utils.getStringifiedArgument(object), JSON.stringify(object));
});

test('if isCache correctly tests if object passed is an instance of Cache', (t) => {
  const string = 'foo';
  const number = 123;
  const boolean = true;
  const object = {
    foo: 'bar'
  };
  const cache = new Cache();

  t.false(utils.isCache(string));
  t.false(utils.isCache(number));
  t.false(utils.isCache(boolean));
  t.false(utils.isCache(object));

  t.true(utils.isCache(cache));
});

test('if isComplexObject correctly identifies a complex object', (t) => {
  const fail = ['foo', 123, true, undefined, null, () => {}];
  const pass = [{foo: 'bar'}, ['foo']];

  fail.forEach((item) => {
    t.false(utils.isComplexObject(item));
  });

  pass.forEach((item) => {
    t.true(utils.isComplexObject(item));
  });
});

test('if isArrayFallback will return true if array, false otherwise', (t) => {
  const bool = true;
  const string = 'foo';
  const number = 123;
  const regexp = /foo/;
  const undef = undefined;
  const nil = null;
  const object = {};
  const array = [];
  const fn = () => {};

  t.false(utils.isArrayFallback(bool));
  t.false(utils.isArrayFallback(string));
  t.false(utils.isArrayFallback(number));
  t.false(utils.isArrayFallback(regexp));
  t.false(utils.isArrayFallback(undef));
  t.false(utils.isArrayFallback(nil));
  t.false(utils.isArrayFallback(object));
  t.false(utils.isArrayFallback(fn));

  t.true(utils.isArrayFallback(array));
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

  t.false(utils.isFunction(bool));
  t.false(utils.isFunction(string));
  t.false(utils.isFunction(number));
  t.false(utils.isFunction(regexp));
  t.false(utils.isFunction(undef));
  t.false(utils.isFunction(nil));
  t.false(utils.isFunction(object));
  t.false(utils.isFunction(array));

  t.true(utils.isFunction(fn));
});

test('if isFiniteAndPositive tests for finiteness and positivity', (t) => {
  t.true(utils.isFiniteAndPositive(123));

  t.false(utils.isFiniteAndPositive(Infinity));
  t.false(utils.isFiniteAndPositive(0));
  t.false(utils.isFiniteAndPositive(-0));
  t.false(utils.isFiniteAndPositive(-123));
  t.false(utils.isFiniteAndPositive(-Infinity));
});

test('if isKeyShallowEqualWithArgs returns false when value is not a multi-parameter key', (t) => {
  const value = {
    isMultiParamKey: false
  };
  const args = ['foo', 'bar'];

  const result = utils.isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns false when value is an array whose length is different than that of args', (t) => {
  const value = {
    isMultiParamKey: true,
    key: ['foo']
  };
  const args = ['foo', 'bar'];

  const result = utils.isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns false when value is an array whose values are different than args', (t) => {
  const object = {
    bar: 'baz'
  };
  const value = {
    isMultiParamKey: true,
    key: ['foo', object]
  };
  const args = ['foo', {
    ...object
  }];

  const result = utils.isKeyShallowEqualWithArgs(value, args);

  t.false(result);
});

test('if isKeyShallowEqualWithArgs returns true when value is an array whose values are shallowly equal to args', (t) => {
  const object = {
    bar: 'baz'
  };
  const value = {
    isMultiParamKey: true,
    key: ['foo', object]
  };
  const args = ['foo', object];

  const result = utils.isKeyShallowEqualWithArgs(value, args);

  t.true(result);
});

test('if isKeyShallowEqualWithArgs returns true when value and args both are empty arrays', (t) => {
  const value = {
    isMultiParamKey: true,
    key: []
  };
  const args = [];

  const result = utils.isKeyShallowEqualWithArgs(value, args);

  t.true(result);
});

test('if isPlainObject tests if the item is a function or not', (t) => {
  const bool = true;
  const string = 'foo';
  const number = 123;
  const regexp = /foo/;
  const undef = undefined;
  const nil = null;
  const object = {};
  const array = [];
  const fn = () => {};

  t.false(utils.isPlainObject(bool));
  t.false(utils.isPlainObject(string));
  t.false(utils.isPlainObject(number));
  t.false(utils.isPlainObject(regexp));
  t.false(utils.isPlainObject(undef));
  t.false(utils.isPlainObject(nil));
  t.false(utils.isPlainObject(fn));
  t.false(utils.isPlainObject(array));

  t.true(utils.isPlainObject(object));
});
test('if isValueObjectOrArray correctly determines if an item is an object / array or not', (t) => {
  const bool = new Boolean(true);
  const string = new String('foo');
  const date = new Date();
  const number = new Number(1);
  const regexp = /foo/;
  const object = {};
  const array = [];

  t.false(utils.isValueObjectOrArray(bool));
  t.false(utils.isValueObjectOrArray(string));
  t.false(utils.isValueObjectOrArray(date));
  t.false(utils.isValueObjectOrArray(number));
  t.false(utils.isValueObjectOrArray(regexp));
  t.true(utils.isValueObjectOrArray(object));
  t.true(utils.isValueObjectOrArray(array));
});

test('if getSerializerFunction returns a function that produces a stringified version of the arguments with a separator', (t) => {
  const serializeArguments = utils.getSerializerFunction();

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
  const serializeArguments = utils.getSerializerFunction(null, false, 2);

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
  const serializeArguments = utils.getSerializerFunction(null, true);

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
  const keyToSet = 'foo';
  const valueToSet = 'bar';

  const cache = {
    set(key, value) {
      t.is(key, keyToSet);
      t.is(value, valueToSet);
    }
  };
  const setNewCachedValue = utils.createSetNewCachedValue(cache, false);

  const result = await setNewCachedValue(keyToSet, valueToSet);

  t.is(result, valueToSet);
});

test('if setNewCachedValue will run the set method upon resolution of a promise', async (t) => {
  const cache = new Cache();

  const key = 'foo';
  const value = 'bar';

  const setNewCachedValue = utils.createSetNewCachedValue(cache, true, Infinity, Infinity, Promise);

  const result = await setNewCachedValue(key, Promise.resolve(value));

  t.is(result, value);
});

test('if setNewCachedValue will maintain its promise nature for future cached calls', async (t) => {
  const cache = new Cache();
  const key = 'foo';
  const value = 'bar';

  const setNewCachedValue = utils.createSetNewCachedValue(cache, true, Infinity, Infinity, Promise);

  await setNewCachedValue(key, Promise.resolve(value));

  await cache.get(key).then((resolvedValue) => {
    t.is(resolvedValue, value);
  });
  await cache.get(key).then((resolvedValue) => {
    t.is(resolvedValue, value);
  });
  await cache.get(key).then((resolvedValue) => {
    t.is(resolvedValue, value);
  });
});

test('if setNewCachedValue will delete itself from cache if a rejected promise is returned', async (t) => {
  const cache = new Cache();

  const setNewCachedValue = utils.createSetNewCachedValue(cache, true, Infinity, Infinity, Promise);

  const key = 'foo';
  const value = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject();
    }, 100);
  });

  const result = setNewCachedValue(key, value).catch(() => {});

  t.true(cache.has(key));

  await result;

  t.false(cache.has(key));
});

test('if setNewCachedValue will retrigger the promise rejection to ensure that the application can catch it', async (t) => {
  const cache = new Cache();

  const setNewCachedValue = utils.createSetNewCachedValue(cache, true, Infinity, Infinity, Promise);

  const key = 'foo';
  const error = new Error('foo');
  const value = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(error);
    }, 100);
  });

  await setNewCachedValue(key, value).catch((exception) => {
    t.is(exception, error);
  });
});

test('if setNewCachedValue will wait to trigger the expiration timeout until the resolution of the promise', async (t) => {
  const cache = new Cache();

  const setNewCachedValue = utils.createSetNewCachedValue(cache, true, 100, Infinity, Promise);

  const key = 'foo';
  const value = new Promise((resolve) => {
    setTimeout(() => {
      resolve('bar');
    }, 100);
  });

  const result = setNewCachedValue(key, value);

  t.true(cache.has(key));

  await result;
  await sleep(99);

  t.true(cache.has(key));

  await sleep(2);

  t.false(cache.has(key));
});

test('if setNewCachedValue will immediately remove the oldest item from cache if the max is reached', async (t) => {
  const cache = new Cache();

  const keyToDelete = 'bar';

  cache.set(keyToDelete, 'baz');

  const setNewCachedValue = utils.createSetNewCachedValue(cache, true, Infinity, 1, Promise);

  const key = 'foo';
  const value = new Promise((resolve) => {
    setTimeout(() => {
      resolve('bar');
    }, 100);
  });

  setNewCachedValue(key, value);

  t.true(cache.has(key));
  t.false(cache.has(keyToDelete));
});

test('if setNewCachedValue will set the cache to expire if maxAge is finite', async (t) => {
  const cache = new Cache();
  const keyToSet = 'foo';
  const valueToSet = 'bar';
  const maxAge = 100;

  const setNewCachedValue = utils.createSetNewCachedValue(cache, false, maxAge);

  await setNewCachedValue(keyToSet, valueToSet);

  t.is(cache.get(keyToSet), valueToSet);

  await sleep(maxAge);

  t.is(cache.get(keyToSet), undefined);
});

test('if setNewCacheValue will delete the item if the maxSize is set', (t) => {
  const cache = new Cache();
  const keyToSet = 'foo';
  const valueToSet = 'bar';

  cache.set('bar', 'baz');

  const setNewCacheValue = utils.createSetNewCachedValue(cache, false, Infinity, 1);

  setNewCacheValue(keyToSet, valueToSet);

  t.deepEqual(cache.list, [
    {
      key: keyToSet,
      isMultiParamKey: false,
      value: valueToSet
    }
  ]);
});

test('if splice performs the same operation as the native splice', (t) => {
  const indexToSpice = 1;

  let nativeArray = ['foo', 'bar'],
      customArray = [...nativeArray];

  nativeArray.splice(indexToSpice, 1);
  utils.splice(customArray, indexToSpice);

  t.deepEqual(nativeArray, customArray);
});

test('if splice returns immediately when an empty array is passed', (t) => {
  let array = [];

  const originalArrayLength = array.length;

  utils.splice(array, 0);

  t.is(array.length, originalArrayLength);
});

test('if unshift performs the same operation as the native unshift', (t) => {
  const valueToUnshift = 'baz';

  let nativeArray = ['foo', 'bar'],
      customArray = [...nativeArray];

  nativeArray.unshift(valueToUnshift);
  utils.unshift(customArray, valueToUnshift);

  t.deepEqual(nativeArray, customArray);
});

test('if setExpirationOfCache will expire the cache after the age passed', async (t) => {
  const setExpirationOfCache = utils.createSetExpirationOfCache(100);
  const cache = new Cache();

  cache.set('foo', 'bar');

  setExpirationOfCache(cache, 'foo');

  const expectedCache = new Cache();

  expectedCache.set('foo', 'bar');

  t.deepEqual(cache, expectedCache);

  await sleep(100);

  t.deepEqual(cache, new Cache());
});

test('if setExpirationOfCache will expire the cache immediately if less than 0', async (t) => {
  const setExpirationOfCache = utils.createSetExpirationOfCache(-1);
  const cache = new Cache();

  cache.set('foo', 'bar');

  setExpirationOfCache(cache, 'foo');

  await sleep(0);

  t.deepEqual(cache, new Cache());
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

  const standardResult = utils.stringify(standard);

  t.is(standardResult, '{"foo":"bar"}');

  const circularResult = utils.stringify(circular);

  t.is(circularResult, '{"foo":{"bar":"baz","baz":{"$ref":"$[\\\"foo\\\"]"}}}');
});
