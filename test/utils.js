// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as utils from 'src/utils';
import Cache from 'src/Cache';

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

test('if createCurriableOptionMethod will create a method that accepts a value and passes the option with that value to the function passed', (t) => {
  const option = 'foo';
  const value = 'bar';

  const fn = sinon.stub().callsFake((object) => {
    t.deepEqual(object, {
      [option]: value
    });
  });

  const result = utils.createCurriableOptionMethod(fn, option);

  t.is(typeof result, 'function');

  result(value);

  t.true(fn.calledOnce);
});

test('if compose will compose multiple functions to a single function', (t) => {
  const firstStub = sinon.stub().returnsArg(0);
  const secondStub = sinon.stub().returnsArg(0);
  const thirdStub = sinon.stub().returnsArg(0);

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

test.todo('if createCurriableOptionMethod will create a method that curries the options passed');

test.todo('if createGetCacheKey will get the correct getCacheKeyMethod and fire it with both the key and options if serialize is true');

test.todo('if createGetCacheKey will get the correct getCacheKeyMethod and fire it with only the key if standard');

test.todo('if createFindIndex will create a method that finds the index starting at the startingIndex passed');

test('if createPluckFromInstanceList will create a method to pluck the key passed from the instance', (t) => {
  const cache = new Cache();

  cache.add('foo', 'bar');
  cache.add('bar', 'baz');

  const fn = utils.createPluckFromInstanceList(cache, 'value');

  t.is(typeof fn, 'function');

  t.deepEqual(fn().sort(), ['bar', 'baz']);
});

test('if createPromiseRejecter will create a function that will delete the item from cache and return a rejected promise', (t) => {
  const key = 'foo';
  const exception = new Error();
  const cache = {
    remove(keyToDelete) {
      t.is(keyToDelete, key);
    }
  };
  const options = {
    promiseLibrary: {
      reject(error) {
        t.is(error, exception);
      }
    }
  };

  const result = utils.createPromiseRejecter(cache, key, options);

  t.is(typeof result, 'function');

  result(exception);
});

test('if createPromiseResolver will create a function that will update the item in cache and return the resolvedValue', (t) => {
  const key = 'foo';
  const resolvedValue = 'bar';
  const cache = {
    update(keyToUpdate) {
      t.is(keyToUpdate, key);
    }
  };
  const hasMaxAge = false;
  const options = {
    promiseLibrary: {
      resolve(value) {
        t.is(value, resolvedValue);
      }
    }
  };

  const result = utils.createPromiseResolver(cache, key, hasMaxAge, options);

  t.is(typeof result, 'function');

  result(resolvedValue);
});

test('if createPromiseResolver will create a function that will set the cache to expire if hasMaxAge is true', (t) => {
  const key = 'foo';
  const resolvedValue = 'bar';
  const maxAge = 10;
  const cache = {
    expireAfter(keyToExpire, maxAgeOfExpiration) {
      t.is(keyToExpire, key);
      t.is(maxAgeOfExpiration, maxAge);
    },
    update() {}
  };
  const hasMaxAge = true;
  const options = {
    maxAge,
    promiseLibrary: {
      resolve() {}
    }
  };

  const result = utils.createPromiseResolver(cache, key, hasMaxAge, options);

  t.is(typeof result, 'function');

  result(resolvedValue);
});

test.todo('if createSetNewCachedValue will set the cache value correctly when isPromise option is true');

test.todo('if createSetNewCachedValue will set the cache value correctly when isPromise option is false');

test.todo('if getDefaultedOptions will return the options passed merged with the default options, and serializer of null when serializer is not true');

test.todo('if getDefaultedOptions will return the options passed merged with the default options, and serializer populated when serializer is true');

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

test('if getFunctionNameViaRegexp will coalesce the value if match is not found', (t) => {
  const invalidResult = utils.getFunctionNameViaRegexp(123);

  t.is(invalidResult, '');
});

test.todo('if getGetCacheKeyMethod will return getReactCacheKey if the isReact option is true');

test.todo('if getGetCacheKeyMethod will return getSerializedCacheKey if the isReact option is false and the serialize option is true');

test.todo('if getGetCacheKeyMethod will return getStandardCacheKey if the both the isReact and serialize options are false');

test.todo('if getReactCacheKey will get the matching cache key if it is the most recent entry');

test.todo('if getReactCacheKey will get the matching cache key if it exists in the list');

test.todo('if getReactCacheKey will create a new ReactCacheKey if it does not exist in cache');

test.todo('if getSerializedCacheKey will get the matching cache key if it is the most recent entry');

test.todo('if getSerializedCacheKey will get the matching cache key if it exists in the list');

test.todo('if getSerializedCacheKey will create a new SerializedCacheKey if it does not exist in cache');

test.todo('if getStandardCacheKey will get the matching cache key if it is the most recent entry');

test.todo('if getStandardCacheKey will get the matching cache key if it exists in the list');

test.todo('if getStandardCacheKey will create a new MultipleParameterCacheKey if it does not exist in cache and has more than one argument');

test.todo('if getStandardCacheKey will create a new SingleParameterCacheKey if it does not exist in cache and has only one argument');

test.todo('if isComplexObject returns false if the object is falsy');

test.todo('if isComplexObject returns false if the object is not the typeof object');

test.todo('if isComplexObject returns true if the object is truthy and the typeof object');

test.todo('if isFiniteAndPositive returns false when the number is not finite');

test.todo('if isFiniteAndPositive returns false when the number is not positive');

test.todo('if isFiniteAndPositive returns true when the number is both finite and positive');

test.todo('if isFunction returns false if the object passed is not a function');

test.todo('if isFunction returns true if the object passed is a function');

test.todo('if isPlainObject returns false if the object is not a complex object');

test.todo('if isPlainObject returns false if the direct constructor of the object is not Object');

test.todo('if isPlainObject returns true if the object is a complex object and whose direct constructor is Object');

test.todo('if isValueObjectOrArray returns false if the object is not a complex object');

test.todo('if isValueObjectOrArray returns false if the object is an instance of a gotcha class');

test.todo('if isValueObjectOrArray returns true if the object is a complex object that is not an instance of a gotcha class');

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
