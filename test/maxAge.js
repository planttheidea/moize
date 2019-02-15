// test
import sinon from 'sinon';

// src
import * as maxAge from 'src/maxAge';

test('if clearExpiration will clear the expiration if it exists', () => {
  const key = ['foo'];
  const expirations = [
    {
      key,
      timeoutId: 123,
    },
  ];

  const stub = sinon.stub(global, 'clearTimeout');

  maxAge.clearExpiration(expirations, key);

  expect(stub.calledOnce).toBe(true);
  expect(expirations.length).toBe(1);

  stub.restore();
});

test('if clearExpiration will clear the expiration if it exists and remove it if requested', () => {
  const key = ['foo'];
  const expirations = [
    {
      key,
      timeoutId: 123,
    },
  ];

  const stub = sinon.stub(global, 'clearTimeout');

  maxAge.clearExpiration(expirations, key, true);

  expect(stub.calledOnce).toBe(true);
  expect(expirations.length).toBe(0);

  stub.restore();
});

test('if clearExpiration will do nothing if the expiration is not found', () => {
  const key = ['foo'];
  const expirations = [
    {
      key: ['bar'],
      timeoutId: 123,
    },
  ];

  const stub = sinon.stub(global, 'clearTimeout');

  maxAge.clearExpiration(expirations, key, true);

  expect(stub.notCalled).toBe(true);
  expect(expirations.length).toBe(1);

  stub.restore();
});

test('if onCacheAddSetExpiration will do nothing if an existing expiration is found', () => {
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

  expect(setTimeoutStub.notCalled).toBe(true);

  expect(expirations).toEqual(originalExpirations);

  setTimeoutStub.restore();
});

test('if onCacheAddSetExpiration will add the new expiration when options are passed', () => {
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

  expect(setTimeoutStub.calledOnce).toBe(true);

  expect(expirations.length).toBe(1);

  const {expirationMethod, key, timeoutId} = expirations[0];

  expect(setTimeoutStub.calledWith(expirationMethod, options.maxAge)).toBe(true);

  setTimeoutStub.restore();

  expect(key).toBe(cache.keys[0]);
  expect(timeoutId).toBe(234);

  expect(cache.keys.length).toBe(1);
  expect(cache.values.length).toBe(1);

  expirationMethod();

  expect(cache.keys.length).toBe(0);
  expect(cache.values.length).toBe(0);
});

test('if onCacheAddSetExpiration will not remove the key / value combo when they no longer exist', () => {
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

  expect(() => {
    expirationMethod();
  }).not.toThrow();
});

test('if onCacheAddSetExpiration will not remove the expiration when it no longer exists', () => {
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

  expect(() => {
    expirationMethod();
  }).not.toThrow();
});

test('if onCacheAddSetExpiration will return the expired key and value and create a new expiration if onExpire returns false', () => {
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

  expect(setTimeoutStub.calledOnce).toBe(true);

  setTimeoutStub.restore();

  expect(expirations.length).toBe(1);

  const {expirationMethod, key, timeoutId} = expirations[0];

  expect(key).toBe(cache.keys[0]);
  expect(timeoutId).toBe(234);

  expect(cache.keys.length).toBe(1);
  expect(cache.values.length).toBe(1);

  const currentKeys = [...cache.keys];
  const currentValues = [...cache.values];

  expirationMethod();

  expect(cache.keys.length).toBe(1);
  expect(cache.keys).toEqual(currentKeys);

  expect(cache.values.length).toBe(1);
  expect(cache.values).toEqual(currentValues);
});

test('if onCacheAddSetExpiration will fire onCacheChange when it exists', () => {
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

  expect(setTimeoutStub.calledOnce).toBe(true);

  setTimeoutStub.restore();

  expect(expirations.length).toBe(1);

  const {expirationMethod, key, timeoutId} = expirations[0];

  expect(key).toBe(cache.keys[0]);
  expect(timeoutId).toBe(234);

  expect(cache.keys.length).toBe(1);
  expect(cache.values.length).toBe(1);

  const currentKeys = [...cache.keys];
  const currentValues = [...cache.values];

  expirationMethod();

  expect(options.onCacheChange.calledTwice).toBe(true);
  expect(options.onCacheChange.args).toEqual([[cache, options, moized], [cache, options, moized]]);

  expect(cache.keys.length).toBe(1);
  expect(cache.keys).toEqual(currentKeys);

  expect(cache.values.length).toBe(1);
  expect(cache.values).toEqual(currentValues);
});

test('if onCacheHitResetExpiration will do nothing when the expiration does not exist', () => {
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

  expect(expirations).toEqual([]);
});

test('if onCacheHitResetExpiration will update the expiration when found', () => {
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

  expect(clearTimeoutStub.calledOnce).toBe(true);
  expect(clearTimeoutStub.calledWith(originalExpirations[0].timeoutId)).toBe(true);

  clearTimeoutStub.restore();

  expect(setTimeoutStub.calledOnce).toBe(true);
  expect(
    setTimeoutStub.calledWith(originalExpirations[0].expirationMethod, options.maxAge)
  ).toBe(true);

  setTimeoutStub.restore();

  expect(expirations).toEqual([
    {
      ...originalExpirations[0],
      timeoutId: 234,
    },
  ]);
});

test('if getMaxAgeOptions will return the combined onCacheAdd and onCacheHit methods', () => {
  const expirations = [];
  const options = {
    maxAge: 100,
    onCacheAdd() {},
    onCacheHit() {},
    updateExpire: true,
  };

  const result = maxAge.getMaxAgeOptions(expirations, options);

  expect(Object.keys(result)).toEqual(['onCacheAdd', 'onCacheHit']);
  expect(typeof result.onCacheAdd).toBe('function');
  expect(typeof result.onCacheHit).toBe('function');
});

test('if getMaxAgeOptions will return undefined for onCacheHit if updateExpire is false', () => {
  const expirations = [];
  const options = {
    maxAge: 100,
    onCacheAdd() {},
    onCacheHit() {},
    updateExpire: false,
  };

  const result = maxAge.getMaxAgeOptions(expirations, options);

  expect(Object.keys(result)).toEqual(['onCacheAdd', 'onCacheHit']);
  expect(typeof result.onCacheAdd).toBe('function');
  expect(result.onCacheHit).toBe(undefined);
});

test('if getMaxAgeOptions will return undefined for onCacheHit if onCacheAdd is not a function', () => {
  const expirations = [];
  const options = {
    maxAge: undefined,
    onCacheAdd() {},
    onCacheHit() {},
    updateExpire: false,
  };

  const result = maxAge.getMaxAgeOptions(expirations, options);

  expect(Object.keys(result)).toEqual(['onCacheAdd', 'onCacheHit']);
  expect(result.onCacheAdd).toBe(undefined);
  expect(result.onCacheHit).toBe(undefined);
});
