// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as maxAge from 'src/maxAge';

test('if clearExpiration will clear the expiration if it exists', (t) => {
  const key = ['foo'];
  const expirations = [
    {
      key,
      timeoutId: 123,
    },
  ];

  const stub = sinon.stub(global, 'clearTimeout');

  maxAge.clearExpiration(expirations, key);

  t.true(stub.calledOnce);
  t.is(expirations.length, 1);

  stub.restore();
});

test('if clearExpiration will clear the expiration if it exists and remove it if requested', (t) => {
  const key = ['foo'];
  const expirations = [
    {
      key,
      timeoutId: 123,
    },
  ];

  const stub = sinon.stub(global, 'clearTimeout');

  maxAge.clearExpiration(expirations, key, true);

  t.true(stub.calledOnce);
  t.is(expirations.length, 0);

  stub.restore();
});

test('if clearExpiration will do nothing if the expiration is not found', (t) => {
  const key = ['foo'];
  const expirations = [
    {
      key: ['bar'],
      timeoutId: 123,
    },
  ];

  const stub = sinon.stub(global, 'clearTimeout');

  maxAge.clearExpiration(expirations, key, true);

  t.true(stub.notCalled);
  t.is(expirations.length, 1);

  stub.restore();
});

test('if onCacheAddSetExpiration will do nothing if an existing expiration is found', (t) => {
  const originalExpirations = [
    {
      expirationMethod() {},
      key: 'key',
      timeoutId: 123,
    },
  ];

  const expirations = originalExpirations.map((expiration) => ({...expiration}));
  const options = {
    maxAge: 100,
    updateExpire: true,
  };
  const isEqual = () => {};

  const result = maxAge.createOnCacheAddSetExpiration(expirations, options, isEqual);

  const cache = {
    keys: ['key'],
  };

  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache);

  t.true(setTimeoutStub.notCalled);

  t.deepEqual(expirations, originalExpirations);

  setTimeoutStub.restore();
});

test('if onCacheAddSetExpiration will add the new expiration when options are passed', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
  };
  const isEqual = (object1, object2) => object1 === object2;

  const result = maxAge.createOnCacheAddSetExpiration(expirations, options, isEqual);

  const cache = {
    keys: ['key'],
    values: ['value'],
  };

  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache);

  t.true(setTimeoutStub.calledOnce);

  t.is(expirations.length, 1);

  const {expirationMethod, key, timeoutId} = expirations[0];

  t.true(setTimeoutStub.calledWith(expirationMethod, options.maxAge));

  setTimeoutStub.restore();

  t.is(key, cache.keys[0]);
  t.is(timeoutId, 234);

  t.is(cache.keys.length, 1);
  t.is(cache.values.length, 1);

  expirationMethod();

  t.is(cache.keys.length, 0);
  t.is(cache.values.length, 0);
});

test('if onCacheAddSetExpiration will not remove the key / value combo when they no longer exist', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
  };
  const isEqual = (object1, object2) => object1 === object2;

  const result = maxAge.createOnCacheAddSetExpiration(expirations, options, isEqual);

  const cache = {
    keys: ['key'],
    values: ['value'],
  };

  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache);

  const {expirationMethod} = expirations[0];

  setTimeoutStub.restore();

  cache.keys.length = 0;
  cache.values.length = 0;

  t.notThrows(() => {
    expirationMethod();
  });
});

test('if onCacheAddSetExpiration will not remove the expiration when it no longer exists', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
  };
  const isEqual = (object1, object2) => object1 === object2;

  const result = maxAge.createOnCacheAddSetExpiration(expirations, options, isEqual);

  const cache = {
    keys: ['key'],
    values: ['value'],
  };

  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache);

  const {expirationMethod} = expirations[0];

  setTimeoutStub.restore();

  expirations.length = 0;

  t.notThrows(() => {
    expirationMethod();
  });
});

test('if onCacheAddSetExpiration will return the expired key and value and create a new expiration if onExpire returns false', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
    onExpire: sinon.stub().returns(false),
  };
  const isEqual = (object1, object2) => object1 === object2;

  const result = maxAge.createOnCacheAddSetExpiration(expirations, options, isEqual);

  const cache = {
    keys: ['key'],
    values: ['value'],
  };

  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache);

  t.true(setTimeoutStub.calledOnce);

  setTimeoutStub.restore();

  t.is(expirations.length, 1);

  const {expirationMethod, key, timeoutId} = expirations[0];

  t.is(key, cache.keys[0]);
  t.is(timeoutId, 234);

  t.is(cache.keys.length, 1);
  t.is(cache.values.length, 1);

  const currentKeys = [...cache.keys];
  const currentValues = [...cache.values];

  expirationMethod();

  t.is(cache.keys.length, 1);
  t.deepEqual(cache.keys, currentKeys);

  t.is(cache.values.length, 1);
  t.deepEqual(cache.values, currentValues);
});

test('if onCacheAddSetExpiration will fire onCacheChange when it exists', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
    onCacheChange: sinon.spy(),
    onExpire: sinon.stub().returns(false),
  };
  const moized = () => {};

  const isEqual = (object1, object2) => object1 === object2;

  const result = maxAge.createOnCacheAddSetExpiration(expirations, options, isEqual);

  const cache = {
    keys: ['key'],
    values: ['value'],
  };

  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache, options, moized);

  t.true(setTimeoutStub.calledOnce);

  setTimeoutStub.restore();

  t.is(expirations.length, 1);

  const {expirationMethod, key, timeoutId} = expirations[0];

  t.is(key, cache.keys[0]);
  t.is(timeoutId, 234);

  t.is(cache.keys.length, 1);
  t.is(cache.values.length, 1);

  const currentKeys = [...cache.keys];
  const currentValues = [...cache.values];

  expirationMethod();

  t.true(options.onCacheChange.calledTwice);
  t.deepEqual(options.onCacheChange.args, [[cache, options, moized], [cache, options, moized]]);

  t.is(cache.keys.length, 1);
  t.deepEqual(cache.keys, currentKeys);

  t.is(cache.values.length, 1);
  t.deepEqual(cache.values, currentValues);
});

test('if onCacheHitResetExpiration will do nothing when the expiration does not exist', (t) => {
  const originalExpirations = [];

  const expirations = originalExpirations.map((expiration) => ({...expiration}));
  const options = {
    updateExpire: true,
  };

  const result = maxAge.createOnCacheHitResetExpiration(expirations, options);

  const cache = {
    keys: ['key'],
  };

  result(cache);

  t.deepEqual(expirations, []);
});

test('if onCacheHitResetExpiration will update the expiration when found', (t) => {
  const originalExpirations = [
    {
      expirationMethod() {},
      key: 'key',
      timeoutId: 123,
    },
  ];

  const expirations = originalExpirations.map((expiration) => ({...expiration}));
  const options = {
    maxAge: 100,
    updateExpire: true,
  };

  const result = maxAge.createOnCacheHitResetExpiration(expirations, options);

  const cache = {
    keys: ['key'],
  };

  const clearTimeoutStub = sinon.stub(global, 'clearTimeout');
  const setTimeoutStub = sinon.stub(global, 'setTimeout').returns(234);

  result(cache);

  t.true(clearTimeoutStub.calledOnce);
  t.true(clearTimeoutStub.calledWith(originalExpirations[0].timeoutId));

  clearTimeoutStub.restore();

  t.true(setTimeoutStub.calledOnce);
  t.true(setTimeoutStub.calledWith(originalExpirations[0].expirationMethod, options.maxAge));

  setTimeoutStub.restore();

  t.deepEqual(expirations, [
    {
      ...originalExpirations[0],
      timeoutId: 234,
    },
  ]);
});

test('if getMaxAgeOptions will return the combined onCacheAdd and onCacheHit methods', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
    onCacheAdd() {},
    onCacheHit() {},
    updateExpire: true,
  };

  const result = maxAge.getMaxAgeOptions(expirations, options);

  t.deepEqual(Object.keys(result), ['onCacheAdd', 'onCacheHit']);
  t.is(typeof result.onCacheAdd, 'function');
  t.is(typeof result.onCacheHit, 'function');
});

test('if getMaxAgeOptions will return undefined for onCacheHit if updateExpire is false', (t) => {
  const expirations = [];
  const options = {
    maxAge: 100,
    onCacheAdd() {},
    onCacheHit() {},
    updateExpire: false,
  };

  const result = maxAge.getMaxAgeOptions(expirations, options);

  t.deepEqual(Object.keys(result), ['onCacheAdd', 'onCacheHit']);
  t.is(typeof result.onCacheAdd, 'function');
  t.is(result.onCacheHit, undefined);
});

test('if getMaxAgeOptions will return undefined for onCacheHit if onCacheAdd is not a function', (t) => {
  const expirations = [];
  const options = {
    maxAge: undefined,
    onCacheAdd() {},
    onCacheHit() {},
    updateExpire: false,
  };

  const result = maxAge.getMaxAgeOptions(expirations, options);

  t.deepEqual(Object.keys(result), ['onCacheAdd', 'onCacheHit']);
  t.is(result.onCacheAdd, undefined);
  t.is(result.onCacheHit, undefined);
});
