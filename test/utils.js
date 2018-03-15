// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as utils from 'src/utils';
import {DEFAULT_OPTIONS} from 'src/constants';

test('if combine fires all functions passed', (t) => {
  const a = null;
  const b = sinon.spy();
  const c = null;
  const d = sinon.spy();

  const result = utils.combine(a, b, c, d);

  const args = ['foo', 'bar'];

  result(...args);

  t.true(b.calledOnce);
  t.true(b.calledWith(...args));

  t.true(d.calledOnce);
  t.true(d.calledWith(...args));
});

test('if combine handles when no valid functions are passed', (t) => {
  const a = undefined;
  const b = null;
  const c = false;

  const result = utils.combine(a, b, c);

  t.is(result, undefined);
});

test('if combine handles when no functions are passed', (t) => {
  const result = utils.combine();

  t.is(result, undefined);
});

test('if compose will fire the methods passed composed in the correct order', (t) => {
  const a = sinon.stub().callsFake(({args}) => {
    return [...args].reverse();
  });
  const b = sinon.stub().callsFake((args) => {
    return {
      args
    };
  });
  const c = sinon.stub().callsFake((args) => {
    return args.slice(0, 2);
  });

  const result = utils.compose(a, b, c);

  const args = ['foo', 'bar', 'baz'];

  const value = result(args);

  t.true(a.calledOnce);
  t.true(
    a.calledWith({
      args: args.slice(0, 2)
    })
  );

  t.true(b.calledOnce);
  t.true(b.calledWith(args.slice(0, 2)));

  t.true(c.calledOnce);
  t.true(c.calledWith(args));

  t.deepEqual(value, args.slice(0, 2).reverse());
});

test('if compose will handle only functions passed', (t) => {
  const a = null;
  const b = sinon.stub().callsFake((args) => {
    return [...args].reverse();
  });
  const c = null;
  const d = sinon.stub().callsFake((args) => {
    return args.slice(0, 2);
  });

  const result = utils.compose(a, b, c, d);

  const args = ['foo', 'bar', 'baz'];

  const value = result(args);

  t.true(b.calledOnce);
  t.true(b.calledWith(args.slice(0, 2)));

  t.true(d.calledOnce);
  t.true(d.calledWith(args));

  t.deepEqual(value, args.slice(0, 2).reverse());
});

test('if compose will handle no valid functions are passed', (t) => {
  const a = undefined;
  const b = null;
  const c = false;

  const result = utils.compose(a, b, c);

  t.is(result, undefined);
});

test('if compose will handle no functions are passed', (t) => {
  const result = utils.compose();

  t.is(result, undefined);
});

test('if findExpirationIndex will find the expiration based on the key', (t) => {
  const key = ['key'];
  const expirations = [{key: 'not key'}, {key}];

  const result = utils.findExpirationIndex(expirations, key);

  t.is(result, 1);
});

test('if findExpirationIndex will return the default if it cannot find the expiration based on the key', (t) => {
  const key = ['key'];
  const expirations = [{key: 'not key'}];

  const result = utils.findExpirationIndex(expirations, key);

  t.is(result, -1);
});

test('if findKeyIndex will return the matching key in keys', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  t.is(result, 1);
});

test('if findKeyIndex will return the matching key in keys', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  t.is(result, 1);
});

test('if findKeyIndex will return the default when not able to match key in keys based on value', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  t.is(result, -1);
});

test('if findKeyIndex will return the default when not able to match key in keys based on length', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['key', 'negated'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  t.is(result, -1);
});

test('if findKeyIndex will return the matching key in keys based on isMatchingKey', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const isMatchingKey = (a, b) => {
    return a[0] === b[0];
  };

  const key = ['key'];
  const keys = [['not key'], ['key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  t.is(result, 1);
});

test('if getArrayKey returns the key if an array', (t) => {
  const key = ['key'];

  const result = utils.getArrayKey(key);

  t.is(result, key);
});

test('if getArrayKey returns the key if an array', (t) => {
  const key = 'key';

  const result = utils.getArrayKey(key);

  t.not(result, key);
  t.deepEqual(result, [key]);
});

test('if mergeOptions will return the original options if newOptions are the default', (t) => {
  const originalOptions = {
    original: 'options'
  };
  const newOptions = DEFAULT_OPTIONS;

  const result = utils.mergeOptions(originalOptions, newOptions);

  t.is(result, originalOptions);
});

test('if mergeOptions will return the merged options when newOptions is not the default', (t) => {
  const originalOptions = {
    original: 'options'
  };
  const newOptions = {
    better: 'options'
  };

  const result = utils.mergeOptions(originalOptions, newOptions);

  t.deepEqual(result, {
    ...originalOptions,
    ...newOptions,
    onCacheAdd: undefined,
    onCacheHit: undefined,
    onCacheChange: undefined,
    transformArgs: undefined
  });
});
