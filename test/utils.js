import test from 'ava';
import sinon from 'sinon';

import {
  createCustomReplacer,
  getCacheKey,
  getFunctionWithCacheAdded,
  getStringifiedArgument,
  serializeArguments,
  setNewCachedValue,
  splice,
  unshift,
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

test('if createCustomReplacer creates a function', (t) => {
  const result = createCustomReplacer();

  t.is(typeof result, 'function');
});

test('if createCustomReplacer returns the object when passed the first time', (t) => {
  const replacer = createCustomReplacer();
  const object = {
    foo: 'bar'
  };

  const result = replacer('object', object);

  t.is(result, object);
});

test('if createCustomReplacer returns [Circular] when passed the object twice', (t) => {
  const replacer = createCustomReplacer();
  const object = {
    foo: 'bar'
  };

  replacer('object', object);

  const result = replacer('object', object);

  t.is(result, '[Circular]');
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

test('if serializeArguments produces a stringified version of the arguments with a separator', (t) => {
  const args = ['foo', 123, true, {
    bar: 'baz'
  }];

  const expectedResult = '|foo|123|true|{"bar":"baz"}|';
  const result = serializeArguments(args);

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

test('if stringify is called with the correct arguments depending on isCircular', (t) => {
  const standardStub = sinon.stub(JSON, 'stringify', (object, replacer) => {
    t.is(typeof replacer, 'undefined');

    return object;
  });

  stringify({foo: 'bar'}, false);

  standardStub.restore();

  const customStub = sinon.stub(JSON, 'stringify', (object, replacer) => {
    t.is(typeof replacer, 'function');

    return object;
  });

  stringify({foo: 'bar'}, true);

  customStub.restore();
});