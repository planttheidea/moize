// test
import memoize from 'micro-memoize';
import sinon from 'sinon';

// src
import * as instance from 'src/instance';
import * as options from 'src/options';
import * as stats from 'src/stats';

test('if addInstanceMethods will add functions to the moized object', () => {
  const moized = () => {};

  moized.options = {
    isEqual() {},
    onCacheAdd() {},
    onCacheChange() {},
    transformKey() {},
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  expect(typeof moized.add).toBe('function');
  expect(typeof moized.clear).toBe('function');
  expect(typeof moized.get).toBe('function');
  expect(typeof moized.getStats).toBe('function');
  expect(typeof moized.has).toBe('function');
  expect(typeof moized.keys).toBe('function');
  expect(typeof moized.remove).toBe('function');
  expect(typeof moized.values).toBe('function');
});

test('if moized.add will add the item to the cache if it does not already exist', () => {
  const moized = () => {};

  moized.cache = {
    keys: [],
    size: 0,
    values: [],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd: sinon.spy(),
    onCacheChange: sinon.spy(),
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const key = ['key'];
  const value = 'value';

  moized.add(key, value);

  expect(moized.cache.keys).toEqual([key]);
  expect(moized.cache.values).toEqual([value]);

  expect(moized.options.onCacheAdd.calledOnce).toBe(true);
  expect(moized.options.onCacheAdd.calledWith(moized.cache)).toBe(true);

  expect(moized.options.onCacheChange.calledOnce).toBe(true);
  expect(moized.options.onCacheChange.calledWith(moized.cache)).toBe(true);
});

test('if moized.add will add the item to the cache if it does not already exist with a transformed key', () => {
  const moized = () => {};

  moized.cache = {
    keys: [],
    size: 0,
    values: [],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd: sinon.spy(),
    onCacheChange: sinon.spy(),
    transformKey: options.getTransformKey({
      transformArgs: (args) =>
        args[0]
          .split('')
          .reverse()
          .join(''),
    }),
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const key = ['key'];
  const value = 'value';

  moized.add(key, value);

  expect(moized.cache.keys).toEqual([
    [
      key[0]
        .split('')
        .reverse()
        .join(''),
    ],
  ]);
  expect(moized.cache.values).toEqual([value]);

  expect(moized.options.onCacheAdd.calledOnce).toBe(true);
  expect(moized.options.onCacheAdd.calledWith(moized.cache)).toBe(true);

  expect(moized.options.onCacheChange.calledOnce).toBe(true);
  expect(moized.options.onCacheChange.calledWith(moized.cache)).toBe(true);
});

test('if moized.add will add the item to the cache if it does not already exist with a transformed key that is an array', () => {
  const moized = () => {};

  moized.cache = {
    keys: [],
    size: 0,
    values: [],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd: sinon.spy(),
    onCacheChange: sinon.spy(),
    transformKey: sinon.stub().callsFake((args) => ['foo', args[0]]),
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const key = ['key'];
  const value = 'value';

  moized.add(key, value);

  expect(moized.cache.keys).toEqual([['foo', key[0]]]);
  expect(moized.cache.values).toEqual([value]);

  expect(moized.options.onCacheAdd.calledOnce).toBe(true);
  expect(moized.options.onCacheAdd.calledWith(moized.cache)).toBe(true);

  expect(moized.options.onCacheChange.calledOnce).toBe(true);
  expect(moized.options.onCacheChange.calledWith(moized.cache)).toBe(true);
});

test('if moized.add will remove the oldest item from cache if the maxSize is exceeded', () => {
  const moized = () => {};

  moized.cache = {
    keys: [['existingKey']],
    size: 1,
    values: ['existingValue'],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    maxSize: 1,
    onCacheAdd: sinon.spy(),
    onCacheChange: sinon.spy(),
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const key = ['key'];
  const value = 'value';

  moized.add(key, value);

  expect(moized.cache.keys).toEqual([key]);
  expect(moized.cache.values).toEqual([value]);

  expect(moized.options.onCacheAdd.calledOnce).toBe(true);
  expect(moized.options.onCacheAdd.calledWith(moized.cache)).toBe(true);

  expect(moized.options.onCacheChange.calledOnce).toBe(true);
  expect(moized.options.onCacheChange.calledWith(moized.cache)).toBe(true);
});

test('if moized.add will do nothing if the item already exists in cache', () => {
  const moized = () => {};

  const key = ['key'];
  const value = 'value';

  moized.cache = {
    keys: [key],
    size: 1,
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd: sinon.spy(),
    onCacheChange: sinon.spy(),
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  moized.add(key, value);

  expect(moized.cache.keys).toEqual([key]);
  expect(moized.cache.values).toEqual([value]);

  expect(moized.options.onCacheAdd.notCalled).toBe(true);

  expect(moized.options.onCacheChange.notCalled).toBe(true);
});

test('if moized.clear will clear the items in cache', () => {
  const moized = () => {};

  const key = ['key'];
  const value = 'value';

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual() {},
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  moized.clear();

  expect(moized.cache.keys).toEqual([]);
  expect(moized.cache.values).toEqual([]);
});

test('if moized.get will get the item from cache if the key exists', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const result = moized.get(key);

  expect(moized.calledOnce).toBe(true);
  expect(moized.calledWith(...key)).toBe(true);

  expect(result).toBe(value);
});

test('if moized.get will not get the item from cache if the key does not exist', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [],
    values: [],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const result = moized.get(key);

  expect(moized.notCalled).toBe(true);

  expect(result).toBe(undefined);
});

test('if moized.get will get the item from cache if the transformed key exists', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey(key) {
      return key;
    },
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const result = moized.get(key);

  expect(moized.calledOnce).toBe(true);
  expect(moized.calledWith(...key)).toBe(true);

  expect(result).toBe(value);
});

test('if moize.getStats will call getStats with the profileName in options', () => {
  const moized = () => {};

  moized.options = {
    profileName: 'profileName',
  };

  const stub = sinon.stub(stats, 'getStats').returnsArg(0);

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const result = moized.getStats();

  expect(stub.calledOnce).toBe(true);
  expect(stub.calledWith(moized.options.profileName)).toBe(true);

  expect(result).toBe(moized.options.profileName);
});

test('if moized.has will return true if the key exists', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  expect(moized.has(key)).toBe(true);
});

test('if moized.has will return false if the key does not exist', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [],
    values: [],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  expect(moized.has(key)).toBe(false);
});

test('if moized.has will return true if the transformed key exists in cache', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey(key) {
      return key;
    },
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  expect(moized.has(key)).toBe(true);
});

test('if moized.keys will return a shallow clone of the keys', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  Object.defineProperties(moized, {
    cacheSnapshot: {
      get() {
        return {
          keys: [...moized.cache.keys],
          values: [...moized.cache.values],
        };
      },
    },
  });

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const keys = moized.keys();

  expect(keys).toEqual(moized.cache.keys);
  expect(keys).not.toBe(moized.cache.keys);
});

test('if moized.remove will remove the existing key from cache', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  moized.remove(key);

  expect(moized.cache.keys).toEqual([]);
  expect(moized.cache.values).toEqual([]);
});

test('if moized.remove will do nothing if the key is not found in cache', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [['foo']],
    values: ['bar'],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  moized.remove(key);

  expect(moized.cache.keys).toEqual([['foo']]);
  expect(moized.cache.values).toEqual(['bar']);
});

test('if moized.remove will remove the existing key from cache with a custom transformKey', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey(key) {
      return key;
    },
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  moized.remove(key);

  expect(moized.cache.keys).toEqual([]);
  expect(moized.cache.values).toEqual([]);
});

test('if moized.update will set the new value in cache for the moized item', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  const keys = [['foo'], [{bar: 'baz'}], key];
  const values = ['bar', ['quz'], value];

  moized.cache = {
    keys: [...keys],
    values: [...values],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const newValue = 'new value';

  moized.update(key, newValue);

  expect(moized.cache.keys).toEqual([key, ...keys.slice(0, keys.length - 1)]);
  expect(moized.cache.values).toEqual([newValue, ...values.slice(0, values.length - 1)]);
});

test('if moized.update will do nothing if the key does not exist in keys', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const newValue = 'new value';

  moized.update('other key', newValue);

  expect(moized.cache.keys).toEqual([key]);
  expect(moized.cache.values).toEqual([value]);
});

test('if moize will not call onExpire for removed cache items', async () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    maxAge: 1000,
    onCacheAdd() {},
    onCacheChange() {},
    transformKey(key) {
      return key;
    },
  };

  const expirationMethod = sinon.spy();

  const configuration = {
    expirations: [
      {
        expirationMethod,
        key,
        timeoutId: setTimeout(expirationMethod, moized.options.maxAge),
      },
    ],
  };

  instance.addInstanceMethods(moized, configuration);

  await new Promise((resolve) => {
    setTimeout(resolve, 200);
  });

  moized.remove(key);

  await new Promise((resolve) => {
    setTimeout(resolve, moized.options.maxAge);
  });

  expect(expirationMethod.notCalled).toBe(true);
});

test('if moized.values will return a shallow clone of the values', () => {
  const key = ['key'];
  const value = 'value';

  const moized = sinon.stub().callsFake(() => value);

  moized.cache = {
    keys: [key],
    values: [value],
  };

  Object.defineProperties(moized, {
    cacheSnapshot: {
      get() {
        return {
          keys: [...moized.cache.keys],
          values: [...moized.cache.values],
        };
      },
    },
  });

  moized.options = {
    isEqual(a, b) {
      return a === b;
    },
    onCacheAdd() {},
    onCacheChange() {},
    transformKey: undefined,
  };

  const configuration = {
    expirations: [],
  };

  instance.addInstanceMethods(moized, configuration);

  const values = moized.values();

  expect(values).toEqual(moized.cache.values);
  expect(values).not.toBe(moized.cache.values);
});

test('if addInstanceProperties will add the correct properties to the moized method', () => {
  const moized = () => {};
  const options = {
    expirations: [],
    options: {
      key: 'value',
    },
    originalFunction() {},
  };

  const _microMemoizeOptions = {
    micro: 'memoize',
  };
  const cache = {
    keys: [],
    size: 0,
    values: [],
  };

  moized.cache = cache;
  moized.options = _microMemoizeOptions;

  instance.addInstanceProperties(moized, options);

  expect(moized._microMemoizeOptions).toBe(_microMemoizeOptions);
  expect(moized.cache).toEqual(cache);
  expect(moized.expirations).toBe(options.expirations);
  expect(moized.expirationsSnapshot).not.toBe(options.expirations);
  expect(moized.expirationsSnapshot).toEqual(options.expirations);
  expect(moized.isCollectingStats).toBe(stats.statsCache.isCollectingStats);
  expect(moized.isMoized).toBe(true);
  expect(moized.options).toBe(options.options);
  expect(moized.originalFunction).toBe(options.originalFunction);

  expect(moized.hasOwnProperty('displayName')).toBe(false);
  expect(moized.hasOwnProperty('contextTypes')).toBe(false);
  expect(moized.hasOwnProperty('defaultProps')).toBe(false);
  expect(moized.hasOwnProperty('propTypes')).toBe(false);
});

test('if addInstanceProperties will add the correct properties to the moized React method', () => {
  const moized = () => {};
  const options = {
    expirations: [],
    options: {
      isReact: true,
      key: 'value',
    },
    originalFunction() {},
  };

  options.originalFunction.contextTypes = 'contextTypes';
  options.originalFunction.defaultProps = 'defaultProps';
  options.originalFunction.displayName = 'displayName';
  options.originalFunction.propTypes = 'propTypes';

  const _microMemoizeOptions = {
    micro: 'memoize',
  };
  const cache = {
    keys: [],
    values: [],
  };

  moized.cache = cache;
  moized.cacheSnapshot = {...cache};
  moized.options = _microMemoizeOptions;

  instance.addInstanceProperties(moized, options);

  expect(moized._microMemoizeOptions).toBe(_microMemoizeOptions);
  expect(moized.cache).toEqual(cache);
  expect(moized.expirations).toBe(options.expirations);
  expect(moized.expirationsSnapshot).not.toBe(options.expirations);
  expect(moized.expirationsSnapshot).toEqual(options.expirations);
  expect(moized.isCollectingStats).toBe(stats.statsCache.isCollectingStats);
  expect(moized.isMoized).toBe(true);
  expect(moized.options).toBe(options.options);
  expect(moized.originalFunction).toBe(options.originalFunction);

  expect(moized.hasOwnProperty('contextTypes')).toBe(true);
  expect(moized.contextTypes).toBe(options.originalFunction.contextTypes);

  expect(moized.hasOwnProperty('defaultProps')).toBe(true);
  expect(moized.defaultProps).toBe(options.originalFunction.defaultProps);

  expect(moized.hasOwnProperty('displayName')).toBe(true);
  expect(moized.displayName).toBe(`Moized(${options.originalFunction.displayName})`);

  expect(moized.hasOwnProperty('propTypes')).toBe(true);
  expect(moized.propTypes).toBe(options.originalFunction.propTypes);
});

test('if addInstanceProperties will add the correct displayName when none is provided', () => {
  const moized = () => {};
  const options = {
    expirations: [],
    options: {
      isReact: true,
      key: 'value',
    },
    originalFunction() {},
  };

  const _microMemoizeOptions = {
    micro: 'memoize',
  };
  const cache = {
    keys: [],
    values: [],
  };

  moized.cache = cache;
  moized.options = _microMemoizeOptions;

  instance.addInstanceProperties(moized, options);

  expect(moized.hasOwnProperty('displayName')).toBe(true);
  expect(moized.displayName).toBe(`Moized(${options.originalFunction.name})`);
});

test('if addInstanceProperties will add the correct displayName when the function is anonymous', () => {
  const moized = () => {};
  const options = {
    expirations: [],
    options: {
      isReact: true,
      key: 'value',
    },
  };

  options.originalFunction = () => {};

  const _microMemoizeOptions = {
    micro: 'memoize',
  };
  const cache = {
    keys: [],
    values: [],
  };

  moized.cache = cache;
  moized.options = _microMemoizeOptions;

  instance.addInstanceProperties(moized, options);

  expect(moized.hasOwnProperty('displayName')).toBe(true);
  expect(moized.displayName).toBe('Moized(Component)');
});

test('if augmentMoizeInstance will add the methods and properties to the moized method', () => {
  const moized = memoize(() => {});
  const configuration = {
    expirations: [],
    options: {
      isEqual(a, b) {
        return a === b;
      },
      onCacheAdd() {},
      onCacheChange() {},
      transformKey: undefined,
    },
    originalFunction() {},
  };

  const result = instance.augmentMoizeInstance(moized, configuration);

  expect(result).toBe(moized);

  expect(moized.hasOwnProperty('add')).toBe(true);
  expect(moized.hasOwnProperty('clear')).toBe(true);
  expect(moized.hasOwnProperty('get')).toBe(true);
  expect(moized.hasOwnProperty('getStats')).toBe(true);
  expect(moized.hasOwnProperty('has')).toBe(true);
  expect(moized.hasOwnProperty('keys')).toBe(true);
  expect(moized.hasOwnProperty('remove')).toBe(true);
  expect(moized.hasOwnProperty('values')).toBe(true);

  expect(moized.hasOwnProperty('_microMemoizeOptions')).toBe(true);
  expect(moized.hasOwnProperty('cache')).toBe(true);
  expect(moized.hasOwnProperty('cacheSnapshot')).toBe(true);
  expect(moized.hasOwnProperty('expirations')).toBe(true);
  expect(moized.hasOwnProperty('expirationsSnapshot')).toBe(true);
  expect(moized.hasOwnProperty('isCollectingStats')).toBe(true);
  expect(moized.hasOwnProperty('isMoized')).toBe(true);
  expect(moized.hasOwnProperty('options')).toBe(true);
  expect(moized.hasOwnProperty('originalFunction')).toBe(true);
});
