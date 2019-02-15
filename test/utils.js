// test
import sinon from 'sinon';

// src
import * as utils from 'src/utils';
import {DEFAULT_OPTIONS} from 'src/constants';

test('if combine fires all functions passed', () => {
  const a = null;
  const b = sinon.spy();
  const c = null;
  const d = sinon.spy();

  const result = utils.combine(a, b, c, d);

  const args = ['foo', 'bar'];

  result(...args);

  expect(b.calledOnce).toBe(true);
  expect(b.calledWith(...args)).toBe(true);

  expect(d.calledOnce).toBe(true);
  expect(d.calledWith(...args)).toBe(true);
});

test('if combine handles when no valid functions are passed', () => {
  const a = undefined;
  const b = null;
  const c = false;

  const result = utils.combine(a, b, c);

  expect(result).toBe(undefined);
});

test('if combine handles when no functions are passed', () => {
  const result = utils.combine();

  expect(result).toBe(undefined);
});

test('if compose will fire the methods passed composed in the correct order', () => {
  const a = sinon.stub().callsFake(({args}) => [...args].reverse());
  const b = sinon.stub().callsFake((args) => ({
    args,
  }));
  const c = sinon.stub().callsFake((args) => args.slice(0, 2));

  const result = utils.compose(
    a,
    b,
    c
  );

  const args = ['foo', 'bar', 'baz'];

  const value = result(args);

  expect(a.calledOnce).toBe(true);
  expect(a.calledWith({
    args: args.slice(0, 2),
  })).toBe(true);

  expect(b.calledOnce).toBe(true);
  expect(b.calledWith(args.slice(0, 2))).toBe(true);

  expect(c.calledOnce).toBe(true);
  expect(c.calledWith(args)).toBe(true);

  expect(value).toEqual(args.slice(0, 2).reverse());
});

test('if compose will handle only functions passed', () => {
  const a = null;
  const b = sinon.stub().callsFake((args) => [...args].reverse());
  const c = null;
  const d = sinon.stub().callsFake((args) => args.slice(0, 2));

  const result = utils.compose(
    a,
    b,
    c,
    d
  );

  const args = ['foo', 'bar', 'baz'];

  const value = result(args);

  expect(b.calledOnce).toBe(true);
  expect(b.calledWith(args.slice(0, 2))).toBe(true);

  expect(d.calledOnce).toBe(true);
  expect(d.calledWith(args)).toBe(true);

  expect(value).toEqual(args.slice(0, 2).reverse());
});

test('if compose will handle no valid functions are passed', () => {
  const a = undefined;
  const b = null;
  const c = false;

  const result = utils.compose(
    a,
    b,
    c
  );

  expect(result).toBe(undefined);
});

test('if compose will handle no functions are passed', () => {
  const result = utils.compose();

  expect(result).toBe(undefined);
});

test('if findExpirationIndex will find the expiration based on the key', () => {
  const key = ['key'];
  const expirations = [{key: 'not key'}, {key}];

  const result = utils.findExpirationIndex(expirations, key);

  expect(result).toBe(1);
});

test('if findExpirationIndex will return the default if it cannot find the expiration based on the key', () => {
  const key = ['key'];
  const expirations = [{key: 'not key'}];

  const result = utils.findExpirationIndex(expirations, key);

  expect(result).toBe(-1);
});

test('if findKeyIndex will return the matching key in keys', () => {
  const isEqual = (a, b) => a === b;
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  expect(result).toBe(1);
});

test('if findKeyIndex will return the default when not able to match key in keys based on value', () => {
  const isEqual = (a, b) => a === b;
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  expect(result).toBe(-1);
});

test('if findKeyIndex will return the default when not able to match key in keys based on length', () => {
  const isEqual = (a, b) => a === b;
  const isMatchingKey = undefined;

  const key = ['key'];
  const keys = [['not key'], ['key', 'negated'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  expect(result).toBe(-1);
});

test('if findKeyIndex will return the matching key in keys based on isMatchingKey', () => {
  const isEqual = (a, b) => a === b;
  const isMatchingKey = (a, b) => a[0] === b[0];

  const key = ['key'];
  const keys = [['not key'], ['key'], ['also not key']];

  const result = utils.createFindKeyIndex(isEqual, isMatchingKey)(keys, key);

  expect(result).toBe(1);
});

test('if getArrayKey returns the key if an array', () => {
  const key = ['key'];

  const result = utils.getArrayKey(key);

  expect(result).toBe(key);
});

test('if getArrayKey returns the key if a string', () => {
  const key = 'key';

  const result = utils.getArrayKey(key);

  expect(result).not.toBe(key);
  expect(result).toEqual([key]);
});

test('if mergeOptions will return the original options if newOptions are the default', () => {
  const originalOptions = {
    original: 'options',
  };
  const newOptions = DEFAULT_OPTIONS;

  const result = utils.mergeOptions(originalOptions, newOptions);

  expect(result).toBe(originalOptions);
});

test('if mergeOptions will return the merged options when newOptions is not the default', () => {
  const originalOptions = {
    original: 'options',
  };
  const newOptions = {
    better: 'options',
  };

  const result = utils.mergeOptions(originalOptions, newOptions);

  expect(result).toEqual({
    ...originalOptions,
    ...newOptions,
    onCacheAdd: undefined,
    onCacheChange: undefined,
    onCacheHit: undefined,
    transformArgs: undefined,
  });
});
