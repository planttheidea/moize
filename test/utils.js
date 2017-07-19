// test
import test from 'ava';
import _ from 'lodash';
import React from 'react';
import sinon from 'sinon';

// src
import * as utils from 'src/utils';
import * as constants from 'src/constants';
import * as serialize from 'src/serialize';
import Cache from 'src/Cache';
import MultipleParameterCacheKey from 'src/MultipleParameterCacheKey';
import ReactCacheKey from 'src/ReactCacheKey';
import SerializedCacheKey from 'src/SerializedCacheKey';
import SingleParameterCacheKey from 'src/SingleParameterCacheKey';

const serializerFunction = serialize.createArgumentSerializer({
  maxArgs: Number.POSITIVE_INFINITY,
  serializeFunctions: false
});

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

test('if createAddPropertiesToFunction will create a method that adds the appropriate properties to the function passed', (t) => {
  const cache = new Cache();
  const originalFunction = () => {};
  const options = {};

  originalFunction.contextTypes = {};
  originalFunction.defaultProps = {};
  originalFunction.propTypes = {};

  const addPropertiesToFunction = utils.createAddPropertiesToFunction(cache, originalFunction, options);

  t.is(typeof addPropertiesToFunction, 'function');

  const moizedFunction = () => {};

  const result = addPropertiesToFunction(moizedFunction);

  t.is(result, moizedFunction);

  t.is(result.cache, cache);
  t.is(result.displayName, `moize(${originalFunction.name})`);
  t.is(result.isMoized, true);
  t.is(result.options, options);
  t.is(result.originalFunction, originalFunction);

  t.is(typeof result.add, 'function');
  t.is(typeof result.clear, 'function');
  t.is(typeof result.has, 'function');
  t.is(typeof result.keys, 'function');
  t.is(typeof result.remove, 'function');
  t.is(typeof result.values, 'function');

  t.is(result.contextTypes, originalFunction.contextTypes);
  t.is(result.defaultProps, originalFunction.defaultProps);
  t.is(result.propTypes, originalFunction.propTypes);
});

test('if the methods added via createAddPropertiesToFunction will perform as expected', (t) => {
  const cache = {
    add: sinon.stub(),
    clear: sinon.stub(),
    has: sinon.stub()
      .onFirstCall().returns(false)
      .onSecondCall().returns(true),
    remove: sinon.stub()
  };
  const originalFunction = () => {};
  const options = {};

  const addPropertiesToFunction = utils.createAddPropertiesToFunction(cache, originalFunction, options);

  const moizedFunction = () => {};

  const result = addPropertiesToFunction(moizedFunction);

  const key = ['foo'];
  const value = 'bar';

  const cacheKey = utils.createGetCacheKey(cache, options)(key);

  result.add(key, value);

  t.true(cache.has.calledOnce);
  t.true(cache.has.calledWith(cacheKey));

  t.true(cache.add.calledOnce);
  t.true(cache.add.calledWith(cacheKey, value));

  result.add(key, value);

  t.true(cache.has.calledTwice);
  t.true(cache.add.calledOnce);

  result.add(key, value);

  result.clear();

  t.true(cache.clear.calledOnce);

  cache.has.reset();

  result.has(key);

  t.true(cache.has.calledOnce);
  t.true(cache.has.calledWith(cacheKey));

  result.remove(key);

  t.true(cache.remove.calledOnce);
  t.true(cache.remove.calledWith(cacheKey));
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

test('if createCurriableOptionMethod will create a method that curries the options passed', (t) => {
  const fn = sinon.stub();
  const option = 'foo';

  const curriableOptionMethod = utils.createCurriableOptionMethod(fn, option);

  t.is(typeof curriableOptionMethod, 'function');

  const value = 'bar';

  curriableOptionMethod(value);

  t.true(fn.calledOnce);

  t.deepEqual(fn.args[0], [
    {
      [option]: value
    }
  ]);
});

test('if createGetCacheKey will get the correct getCacheKeyMethod and fire it with both the key and options if serialize is true', (t) => {
  const cache = new Cache();
  const options = {
    serialize: true,
    serializer: serializerFunction
  };

  const getCacheKey = utils.createGetCacheKey(cache, options);

  t.is(typeof getCacheKey, 'function');

  const key = ['foo', 'bar'];

  const result = getCacheKey(key);

  t.true(result instanceof SerializedCacheKey);
  t.deepEqual({...result}, {
    key: options.serializer(key)
  });
});

test('if createGetCacheKey will get the correct getCacheKeyMethod and fire it with both the key limited by maxArgs and options if serialize is true', (t) => {
  const cache = new Cache();
  const options = {
    maxArgs: 1,
    serialize: true,
    serializer: serializerFunction
  };

  const getCacheKey = utils.createGetCacheKey(cache, options);

  t.is(typeof getCacheKey, 'function');

  const key = ['foo', 'bar'];

  const result = getCacheKey(key);

  t.true(result instanceof SerializedCacheKey);
  t.deepEqual({...result}, {
    key: options.serializer(key.slice(0, options.maxArgs))
  });
});

test('if createGetCacheKey will get the correct getCacheKeyMethod and fire it with only the key if standard', (t) => {
  const cache = new Cache();
  const options = {};

  const getCacheKey = utils.createGetCacheKey(cache, options);

  t.is(typeof getCacheKey, 'function');

  const key = ['foo', 'bar'];

  const result = getCacheKey(key);

  t.true(result instanceof MultipleParameterCacheKey);
  t.deepEqual({...result}, {
    isMultiParamKey: true,
    key,
    size: Object.keys(key).length
  });
});

test('if createGetCacheKey will get the correct getCacheKeyMethod and fire it with only the key limited by maxArgs if standard', (t) => {
  const cache = new Cache();
  const options = {
    maxArgs: 1
  };

  const getCacheKey = utils.createGetCacheKey(cache, options);

  t.is(typeof getCacheKey, 'function');

  const key = ['foo', 'bar'];

  const result = getCacheKey(key);

  t.true(result instanceof SingleParameterCacheKey);
  t.deepEqual({...result}, {
    isMultiParamKey: false,
    key: key[0]
  });
});

test('if createFindIndex will create a method that finds the index starting at the startingIndex passed', (t) => {
  const startingIndex = 1;

  const findIndex = utils.createFindIndex(startingIndex);

  t.is(typeof findIndex, 'function');

  const list = [
    {key: 'foo'},
    {key: 'bar'},
    {key: 'baz'}
  ];
  const keyWithMatch = 'baz';
  const keyWithoutMatch = 'foo';

  t.is(findIndex(list, keyWithMatch), 2);
  t.is(findIndex(list, keyWithoutMatch), -1);
});

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

test('if createSetNewCachedValue will set the cache value correctly when isPromise option is true', async (t) => {
  const cache = {
    add: sinon.stub(),
    expireAfter: sinon.stub(),
    remove: sinon.stub(),
    update: sinon.stub()
  };
  const options = {
    isPromise: true,
    promiseLibrary: Promise
  };

  const setNewCacheValue = utils.createSetNewCachedValue(cache, options);

  t.is(typeof setNewCacheValue, 'function');

  const key = ['foo'];
  const value = 'bar';
  const promise = Promise.resolve(value);

  const result = setNewCacheValue(key, promise);

  t.true(cache.add.calledOnce);

  const addArgs = cache.add.args[0];

  t.is(addArgs[0], key);

  t.true(addArgs[1] instanceof Promise);

  t.true(cache.remove.notCalled);

  const resolvedValue = await result;

  t.true(cache.update.calledOnce);

  const updateArgs = cache.update.args[0];

  t.is(updateArgs[0], key);
  t.true(updateArgs[1] instanceof Promise);

  const updateArgResolvedValue = await updateArgs[1];

  t.is(updateArgResolvedValue, resolvedValue);
});

test('if createSetNewCachedValue will set the cache value correctly when isPromise option is true and the maxSize has been exceeded', async (t) => {
  const existingKey = 'foo';
  const cache = {
    add: sinon.stub(),
    expireAfter: sinon.stub(),
    list: [
      {key: existingKey}
    ],
    remove: sinon.stub(),
    size: 2,
    update: sinon.stub()
  };
  const options = {
    maxSize: 1,
    isPromise: true,
    promiseLibrary: Promise
  };

  const setNewCacheValue = utils.createSetNewCachedValue(cache, options);

  t.is(typeof setNewCacheValue, 'function');

  const key = ['foo'];
  const value = 'bar';
  const promise = Promise.resolve(value);

  const result = setNewCacheValue(key, promise);

  t.true(cache.add.calledOnce);

  const addArgs = cache.add.args[0];

  t.is(addArgs[0], key);

  t.true(addArgs[1] instanceof Promise);

  t.true(cache.remove.calledOnce);
  t.true(cache.remove.calledWith(existingKey));

  const resolvedValue = await result;

  t.true(cache.update.calledOnce);

  const updateArgs = cache.update.args[0];

  t.is(updateArgs[0], key);
  t.true(updateArgs[1] instanceof Promise);

  const updateArgResolvedValue = await updateArgs[1];

  t.is(updateArgResolvedValue, resolvedValue);
});

test('if createSetNewCachedValue will set the cache value correctly when isPromise option is false', (t) => {
  const cache = {
    add: sinon.stub(),
    expireAfter: sinon.stub(),
    remove: sinon.stub()
  };
  const options = {};

  const setNewCacheValue = utils.createSetNewCachedValue(cache, options);

  t.is(typeof setNewCacheValue, 'function');

  const key = ['foo'];
  const value = 'bar';

  setNewCacheValue(key, value);

  t.true(cache.add.calledOnce);
  t.true(cache.add.calledWith(key, value));

  t.true(cache.expireAfter.notCalled);

  t.true(cache.remove.notCalled);
});

test('if createSetNewCachedValue will set the cache value correctly when isPromise option is false and there is a maxAge', (t) => {
  const cache = {
    add: sinon.stub(),
    expireAfter: sinon.stub(),
    remove: sinon.stub()
  };
  const options = {
    maxAge: 100
  };

  const setNewCacheValue = utils.createSetNewCachedValue(cache, options);

  t.is(typeof setNewCacheValue, 'function');

  const key = ['foo'];
  const value = 'bar';

  setNewCacheValue(key, value);

  t.true(cache.add.calledOnce);
  t.true(cache.add.calledWith(key, value));

  t.true(cache.expireAfter.calledOnce);
  t.true(cache.expireAfter.calledWith(key, options.maxAge));

  t.true(cache.remove.notCalled);
});

test('if createSetNewCachedValue will set the cache value correctly when isPromise option is false and the maxSize has been reached', (t) => {
  const existingKey = 'foo';
  const cache = {
    add: sinon.stub(),
    expireAfter: sinon.stub(),
    list: [
      {key: existingKey}
    ],
    remove: sinon.stub(),
    size: 2
  };
  const options = {
    maxSize: 1
  };

  const setNewCacheValue = utils.createSetNewCachedValue(cache, options);

  t.is(typeof setNewCacheValue, 'function');

  const key = ['foo'];
  const value = 'bar';

  setNewCacheValue(key, value);

  t.true(cache.add.calledOnce);
  t.true(cache.add.calledWith(key, value));

  t.true(cache.expireAfter.notCalled);

  t.true(cache.remove.calledOnce);
  t.true(cache.remove.calledWith(existingKey));
});

test('if getDefaultedOptions will return the options passed merged with the default options, and serializer of null when serialize is not true', (t) => {
  const options = {
    isPromise: true,
    promiseLibrary() {}
  };

  const result = utils.getDefaultedOptions(options);

  t.deepEqual(result, {
    ...constants.DEFAULT_OPTIONS,
    ...options,
    serializer: null
  });
});

test('if getDefaultedOptions will return the options passed merged with the default options, and serializer populated when serialize is true', (t) => {
  const options = {
    serialize: true,
    serializer() {}
  };

  const result = utils.getDefaultedOptions(options);

  t.deepEqual(result, {
    ...constants.DEFAULT_OPTIONS,
    ...options
  });
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

test('if getFunctionNameViaRegexp will coalesce the value if match is not found', (t) => {
  const invalidResult = utils.getFunctionNameViaRegexp(123);

  t.is(invalidResult, '');
});

test('if getGetCacheKeyMethod will return getReactCacheKey if the isReact option is true and the equals option is falsy', (t) => {
  const options = {
    isReact: true
  };

  const result = utils.getGetCacheKeyMethod(options);

  t.is(result, utils.getReactCacheKey);
});

test('if getGetCacheKeyMethod will return getReactCacheKeyCustomEquals if the isReact option is true and the equals option is truthy', (t) => {
  const options = {
    isReact: true,
    equals() {}
  };

  const result = utils.getGetCacheKeyMethod(options);

  t.is(result, utils.getReactCacheKeyCustomEquals);
});

test('if getGetCacheKeyMethod will return getSerializedCacheKey if isReact and equals is falsy, and serialize is true', (t) => {
  const options = {
    serialize: true
  };

  const result = utils.getGetCacheKeyMethod(options);

  t.is(result, utils.getSerializedCacheKey);
});

test('if getGetCacheKeyMethod will return getSerializedCacheKeyCustomEquals if isReact is falsy, equals is truthy, and serialize is true', (t) => {
  const options = {
    equals() {},
    serialize: true
  };

  const result = utils.getGetCacheKeyMethod(options);

  t.is(result, utils.getSerializedCacheKeyCustomEquals);
});

test('if getGetCacheKeyMethod will return getStandardCacheKey if the isReact, equals, and serialize are falsy', (t) => {
  const options = {};

  const result = utils.getGetCacheKeyMethod(options);

  t.is(result, utils.getStandardCacheKey);
});

test('if getGetCacheKeyMethod will return getStandardCacheKeyCustomEquals if the isReact  and serialize are falsy and equals is truthy', (t) => {
  const options = {
    equals() {}
  };

  const result = utils.getGetCacheKeyMethod(options);

  t.is(result, utils.getStandardCacheKeyCustomEquals);
});

test('if getReactCacheKey will get the matching cache key if it is the most recent entry', (t) => {
  const cache = new Cache();

  const key = [
    {foo: 'bar'},
    {bar: 'baz'}
  ];
  const cacheKey = new ReactCacheKey(key, serializerFunction);

  cache.add(cacheKey, <div/>);

  const newKey = key.map((object) => {
    return {...object};
  });

  const result = utils.getReactCacheKey(cache, newKey);

  t.is(result, cache.lastItem.key);
});

test('if getReactCacheKey will get the matching cache key if it exists in the list', (t) => {
  const cache = new Cache();

  const key = [
    {foo: 'bar'},
    {bar: 'baz'}
  ];
  const cacheKey = new ReactCacheKey(key);

  const otherKey = [
    {bar: 'baz'},
    {baz: 'foo'}
  ];
  const otherCacheKey = new ReactCacheKey(otherKey);

  cache.add(cacheKey, <div/>);
  cache.add(otherCacheKey, <span/>);

  const newKey = key.map((object) => {
    return {...object};
  });

  const result = utils.getReactCacheKey(cache, newKey);

  t.not(result, cache.lastItem.key);
  t.is(result, cache.list[1].key);
});

test('if getReactCacheKey will create a new ReactCacheKey if it does not exist in cache', (t) => {
  const cache = new Cache();

  const key = [
    {foo: 'bar'},
    {bar: 'baz'}
  ];
  const cacheKey = new ReactCacheKey(key);

  const otherKey = [
    {bar: 'baz'},
    {baz: 'foo'}
  ];
  const otherCacheKey = new ReactCacheKey(otherKey);

  cache.add(cacheKey, <div/>);
  cache.add(otherCacheKey, <span/>);

  const newKey = [
    {foo: 'foo'},
    {bar: 'bar'}
  ];

  const result = utils.getReactCacheKey(cache, newKey);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof ReactCacheKey);
});

test('if getReactCacheKeyCustomEquals will get the matching cache key if it is the most recent entry', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual,
    isReact: true
  };

  const key = [
    {foo: {
      foo: 'foo'
    }},
    {bar: {
      bar: 'bar'
    }}
  ];
  const cacheKey = new ReactCacheKey(key, serializerFunction);

  cache.add(cacheKey, <div/>);

  const newKey = _.cloneDeep(key);

  const result = utils.getReactCacheKeyCustomEquals(cache, newKey, options);

  t.is(result, cache.lastItem.key);
});

test('if getReactCacheKeyCustomEquals will get the matching cache key if it exists in the list', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual,
    isReact: true
  };

  const key = [
    {foo: {
      foo: 'foo'
    }},
    {bar: {
      bar: 'bar'
    }}
  ];
  const cacheKey = new ReactCacheKey(key);

  const otherKey = [
    {bar: {
      bar: 'bar'
    }},
    {baz: {
      baz: 'baz'
    }}
  ];
  const otherCacheKey = new ReactCacheKey(otherKey);

  cache.add(cacheKey, <div/>);
  cache.add(otherCacheKey, <span/>);

  const newKey = _.cloneDeep(key);

  const result = utils.getReactCacheKeyCustomEquals(cache, newKey, options);

  t.not(result, cache.lastItem.key);
  t.is(result, cache.list[1].key);
});

test('if getReactCacheKeyCustomEquals will create a new ReactCacheKey if it does not exist in cache', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual,
    isReact: true
  };

  const key = [
    {foo: {
      foo: 'foo'
    }},
    {bar: {
      bar: 'bar'
    }}
  ];
  const cacheKey = new ReactCacheKey(key);

  const otherKey = [
    {bar: {
      bar: 'bar'
    }},
    {baz: {
      baz: 'baz'
    }}
  ];
  const otherCacheKey = new ReactCacheKey(otherKey);

  cache.add(cacheKey, <div/>);
  cache.add(otherCacheKey, <span/>);

  const newKey = [
    _.cloneDeep(key[0]),
    _.cloneDeep(otherKey[1])
  ];

  const result = utils.getReactCacheKeyCustomEquals(cache, newKey, options);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof ReactCacheKey);
});

test('if getSerializedCacheKey will get the matching cache key if it is the most recent entry', (t) => {
  const cache = new Cache();

  const key = ['foo', 'bar'];
  const serializedKey = serializerFunction(key);
  const cacheKey = new SerializedCacheKey(serializedKey);

  cache.add(cacheKey, 'baz');

  const newKey = [...key];
  const options = {
    serialize: true,
    serializer: serializerFunction
  };

  const result = utils.getSerializedCacheKey(cache, newKey, options);

  t.is(result, cache.lastItem.key);
});

test('if getSerializedCacheKey will get the matching cache key if it exists in the list', (t) => {
  const cache = new Cache();

  const key = ['foo', 'bar'];
  const serializedKey = serializerFunction(key);
  const cacheKey = new SerializedCacheKey(serializedKey);

  const otherKey = ['bar', 'baz'];
  const otherSerializedKey = serializerFunction(otherKey);
  const otherCacheKey = new SerializedCacheKey(otherSerializedKey, serializerFunction);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = [...key];
  const options = {
    serialize: true,
    serializer: serializerFunction
  };

  const result = utils.getSerializedCacheKey(cache, newKey, options);

  t.not(result, cache.lastItem.key);
  t.is(result, cache.list[1].key);
});

test('if getSerializedCacheKey will create a new SerializedCacheKey if it does not exist in cache', (t) => {
  const cache = new Cache();

  const key = ['foo', 'bar'];
  const serializedKey = serializerFunction(key);
  const cacheKey = new SerializedCacheKey(serializedKey);

  const otherKey = ['bar', 'baz'];
  const otherSerializedKey = serializerFunction(otherKey);
  const otherCacheKey = new SerializedCacheKey(otherSerializedKey, serializerFunction);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = ['foo', 'baz'];
  const options = {
    serialize: true,
    serializer: serializerFunction
  };

  const result = utils.getSerializedCacheKey(cache, newKey, options);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof SerializedCacheKey);
});

test('if getSerializedCacheKeyCustomEquals will get the matching cache key if it is the most recent entry', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual,
    serialize: true,
    serializer: serializerFunction
  };

  const key = [{foo: 'foo'}, {bar: 'bar'}];
  const serializedKey = serializerFunction(key);
  const cacheKey = new SerializedCacheKey(serializedKey, serializerFunction);

  cache.add(cacheKey, 'baz');

  const newKey = _.cloneDeep(key);

  const result = utils.getSerializedCacheKeyCustomEquals(cache, newKey, options);

  t.is(result, cache.lastItem.key);
});

test('if getSerializedCacheKeyCustomEquals will get the matching cache key if it exists in the list', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual,
    serialize: true,
    serializer: serializerFunction
  };

  const key = [{foo: 'foo'}, {bar: 'bar'}];
  const serializedKey = serializerFunction(key);
  const cacheKey = new SerializedCacheKey(serializedKey, serializerFunction);

  const otherKey = [{bar: 'bar'}, {baz: 'baz'}];
  const otherSerializedKey = serializerFunction(otherKey);
  const otherCacheKey = new SerializedCacheKey(otherSerializedKey, serializerFunction);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = _.cloneDeep(key);

  const result = utils.getSerializedCacheKeyCustomEquals(cache, newKey, options);

  t.not(result, cache.lastItem.key);
  t.is(result, cache.list[1].key);
});

test('if getSerializedCacheKeyCustomEquals will create a new SerializedCacheKey if it does not exist in cache', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual,
    serialize: true,
    serializer: serializerFunction
  };

  const key = [{foo: 'foo'}, {bar: 'bar'}];
  const serializedKey = serializerFunction(key);
  const cacheKey = new SerializedCacheKey(serializedKey, serializerFunction);

  const otherKey = [{bar: 'bar'}, {baz: 'baz'}];
  const otherSerializedKey = serializerFunction(otherKey);
  const otherCacheKey = new SerializedCacheKey(otherSerializedKey, serializerFunction);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = [{foo: 'foo'}, {baz: 'baz'}];

  const result = utils.getSerializedCacheKeyCustomEquals(cache, newKey, options);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof SerializedCacheKey);
});

test('if getStandardCacheKey will get the matching cache key if it is the most recent entry', (t) => {
  const cache = new Cache();

  const key = ['foo', 'bar'];
  const cacheKey = new MultipleParameterCacheKey(key);

  cache.add(cacheKey, 'baz');

  const newKey = [...key];

  const result = utils.getStandardCacheKey(cache, newKey);

  t.is(result, cache.lastItem.key);
});

test('if getStandardCacheKey will get the matching cache key if it exists in the list', (t) => {
  const cache = new Cache();

  const key = ['foo', 'bar'];
  const cacheKey = new MultipleParameterCacheKey(key);

  const otherKey = ['bar', 'baz'];
  const otherCacheKey = new MultipleParameterCacheKey(otherKey);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = [...key];

  const result = utils.getStandardCacheKey(cache, newKey);

  t.not(result, cache.lastItem.key);
  t.is(result, cache.list[1].key);
});

test('if getStandardCacheKey will create a new MultipleParameterCacheKey if it does not exist in cache and has more than one argument', (t) => {
  const cache = new Cache();

  const key = ['foo', 'bar'];
  const cacheKey = new MultipleParameterCacheKey(key);

  const otherKey = ['bar', 'baz'];
  const otherCacheKey = new MultipleParameterCacheKey(otherKey);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = ['foo', 'baz'];

  const result = utils.getStandardCacheKey(cache, newKey);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof MultipleParameterCacheKey);
});

test('if getStandardCacheKey will create a new SingleParameterCacheKey if it does not exist in cache and has only one argument', (t) => {
  const cache = new Cache();

  const key = ['foo'];
  const cacheKey = new SingleParameterCacheKey(key);

  const otherKey = ['bar'];
  const otherCacheKey = new SingleParameterCacheKey(otherKey);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = ['baz'];

  const result = utils.getStandardCacheKey(cache, newKey);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof SingleParameterCacheKey);
});

test('if getStandardCacheKeyCustomEquals will get the matching cache key if it is the most recent entry', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual
  };

  const key = [{foo: 'foo'}, {bar: 'bar'}];
  const cacheKey = new MultipleParameterCacheKey(key);

  cache.add(cacheKey, 'baz');

  const newKey = _.cloneDeep(key);

  const result = utils.getStandardCacheKeyCustomEquals(cache, newKey, options);

  t.is(result, cache.lastItem.key);
});

test('if getStandardCacheKeyCustomEquals will get the matching cache key if it exists in the list', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual
  };

  const key = [{foo: 'foo'}, {bar: 'bar'}];
  const cacheKey = new MultipleParameterCacheKey(key);

  const otherKey = [{bar: 'bar'}, {baz: 'baz'}];
  const otherCacheKey = new MultipleParameterCacheKey(otherKey);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = _.cloneDeep(key);

  const result = utils.getStandardCacheKeyCustomEquals(cache, newKey, options);

  t.not(result, cache.lastItem.key);
  t.is(result, cache.list[1].key);
});

test('if getStandardCacheKeyCustomEquals will create a new MultipleParameterCacheKey if it does not exist in cache and has more than one argument', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual
  };

  const key = [{foo: 'foo'}, {bar: 'bar'}];
  const cacheKey = new MultipleParameterCacheKey(key);

  const otherKey = [{bar: 'bar'}, {baz: 'baz'}];
  const otherCacheKey = new MultipleParameterCacheKey(otherKey);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = [{foo: 'foo'}, {baz: 'baz'}];

  const result = utils.getStandardCacheKeyCustomEquals(cache, newKey, options);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof MultipleParameterCacheKey);
});

test('if getStandardCacheKey will create a new SingleParameterCacheKey if it does not exist in cache and has only one argument', (t) => {
  const cache = new Cache();
  const options = {
    equals: _.isEqual
  };

  const key = [{foo: 'foo'}];
  const cacheKey = new SingleParameterCacheKey(key);

  const otherKey = [{bar: 'bar'}];
  const otherCacheKey = new SingleParameterCacheKey(otherKey);

  cache.add(cacheKey, 'baz');
  cache.add(otherCacheKey, 'foo');

  t.not(cache.lastItem.key, cacheKey);

  const newKey = [{baz: 'baz'}];

  const result = utils.getStandardCacheKeyCustomEquals(cache, newKey, options);

  const matchingKey = cache.list.find(({key}) => {
    return key === result;
  });

  t.is(matchingKey, undefined);
  t.true(result instanceof SingleParameterCacheKey);
});

test('if isComplexObject returns false if the object is falsy', (t) => {
  t.false(utils.isComplexObject(false));
  t.false(utils.isComplexObject(null));
  t.false(utils.isComplexObject(''));
  t.false(utils.isComplexObject(0));
});

test('if isComplexObject returns false if the object is not the typeof object', (t) => {
  t.false(utils.isComplexObject(123));
  t.false(utils.isComplexObject('foo'));
  t.false(utils.isComplexObject(() => {}));
  t.false(utils.isComplexObject(true));
  t.false(utils.isComplexObject(Symbol('foo')));
});

test('if isComplexObject returns true if the object is truthy and the typeof object', (t) => {
  t.true(utils.isComplexObject({}));
  t.true(utils.isComplexObject([]));
  t.true(utils.isComplexObject(/foo/));
});

test('if isFiniteAndPositiveInteger returns false when the number is not finite', (t) => {
  t.false(utils.isFiniteAndPositiveInteger(Number.POSITIVE_INFINITY));
  t.false(utils.isFiniteAndPositiveInteger(Number.NEGATIVE_INFINITY));
});

test('if isFiniteAndPositiveInteger returns false when the number is not positive', (t) => {
  t.false(utils.isFiniteAndPositiveInteger(-123));
  t.false(utils.isFiniteAndPositiveInteger(0));
});

test('if isFiniteAndPositiveInteger returns false when the number is a decimal', (t) => {
  t.false(utils.isFiniteAndPositiveInteger(123.45));
});

test('if isFiniteAndPositiveInteger returns true when the number is an integer and both finite and positive', (t) => {
  t.true(utils.isFiniteAndPositiveInteger(123));
});

test('if isFunction returns false if the object passed is not a function', (t) => {
  t.false(utils.isFunction(false));
  t.false(utils.isFunction(true));
  t.false(utils.isFunction(''));
  t.false(utils.isFunction('foo'));
  t.false(utils.isFunction(-123));
  t.false(utils.isFunction(0));
  t.false(utils.isFunction(123));
  t.false(utils.isFunction({}));
  t.false(utils.isFunction([]));
  t.false(utils.isFunction(/foo/));
  t.false(utils.isFunction(null));
  t.false(utils.isFunction(undefined));
});

test('if isFunction returns true if the object passed is a function', (t) => {
  t.true(utils.isFunction(function foo() {}));
  t.true(utils.isFunction(() => {}));
});

test('if isPlainObject returns false if the object is not a complex object', (t) => {
  t.false(utils.isPlainObject(false));
  t.false(utils.isPlainObject(true));
  t.false(utils.isPlainObject(''));
  t.false(utils.isPlainObject('foo'));
  t.false(utils.isPlainObject(-123));
  t.false(utils.isPlainObject(0));
  t.false(utils.isPlainObject(123));
  t.false(utils.isPlainObject(function foo() {}));
  t.false(utils.isPlainObject(() => {}));
  t.false(utils.isPlainObject([]));
  t.false(utils.isPlainObject(/foo/));
  t.false(utils.isPlainObject(null));
  t.false(utils.isPlainObject(undefined));
});

test('if isPlainObject returns false if the direct constructor of the object is not Object', (t) => {
  function Foo(value) {
    this.value = value;

    return this;
  }

  const foo = new Foo('bar');

  t.false(utils.isPlainObject(foo));
});

test('if isPlainObject returns true if the object is a complex object and whose direct constructor is Object', (t) => {
  t.true(utils.isPlainObject({}));
  t.true(utils.isPlainObject(new Object())); // eslint-disable-line no-new-object
});

test('if isValueObjectOrArray returns false if the object is not a complex object', (t) => {
  t.false(utils.isValueObjectOrArray(false));
  t.false(utils.isValueObjectOrArray(null));
  t.false(utils.isValueObjectOrArray(undefined));
  t.false(utils.isValueObjectOrArray(0));
  t.false(utils.isValueObjectOrArray(123));
  t.false(utils.isValueObjectOrArray('foo'));
  t.false(utils.isValueObjectOrArray(() => {}));
  t.false(utils.isValueObjectOrArray(true));
});

test('if isValueObjectOrArray returns false if the object is an instance of a gotcha class', (t) => {
  t.false(utils.isValueObjectOrArray(new Boolean('true')));
  t.false(utils.isValueObjectOrArray(new Date()));
  t.false(utils.isValueObjectOrArray(new Number('123')));
  t.false(utils.isValueObjectOrArray(new RegExp('foo')));
  t.false(utils.isValueObjectOrArray(/foo/));
  t.false(utils.isValueObjectOrArray(new String('true')));
});

test('if isValueObjectOrArray returns true if the object is a complex object that is not an instance of a gotcha class', (t) => {
  t.true(utils.isValueObjectOrArray({}));
  t.true(utils.isValueObjectOrArray([]));
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

test('if take will return the original array if the length is smaller than the size requested', (t) => {
  const array = [1, 2, 3];
  const size = 5;

  const result = utils.take(size)(array);

  t.is(result, array);
});

test('if take will return a new array with the first N number of items from the original array', (t) => {
  const array = [1, 2, 3, 4, 5, 6, 7];

  t.deepEqual(utils.take(1)(array), array.slice(0, 1));
  t.deepEqual(utils.take(2)(array), array.slice(0, 2));
  t.deepEqual(utils.take(3)(array), array.slice(0, 3));
  t.deepEqual(utils.take(4)(array), array.slice(0, 4));
  t.deepEqual(utils.take(5)(array), array.slice(0, 5));
});

test('if take will return a new array with the first N number of items without calling slice if 5 or less, calling it if 6 or more', (t) => {
  const array = [1, 2, 3, 4, 5, 6, 7];

  const spy = sinon.spy(Object.getPrototypeOf(array), 'slice');

  utils.take(1)(array);
  utils.take(2)(array);
  utils.take(3)(array);
  utils.take(4)(array);
  utils.take(5)(array);

  t.true(spy.notCalled);

  spy.reset();

  utils.take(6)(array);

  t.true(spy.calledOnce);

  spy.restore();
});

test('if unshift performs the same operation as the native unshift', (t) => {
  const valueToUnshift = 'baz';

  let nativeArray = ['foo', 'bar'],
      customArray = [...nativeArray];

  nativeArray.unshift(valueToUnshift);
  utils.unshift(customArray, valueToUnshift);

  t.deepEqual(nativeArray, customArray);
});
