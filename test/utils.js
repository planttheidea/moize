// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as utils from 'src/utils';

test('if combine fires all functions passed', (t) => {
  const a = sinon.spy();
  const b = sinon.spy();
  const c = sinon.spy();

  const result = utils.combine(a, b, c);

  const args = ['foo', 'bar'];

  result(...args);

  t.true(a.calledOnce);
  t.true(a.calledWith(...args));

  t.true(b.calledOnce);
  t.true(b.calledWith(...args));

  t.true(c.calledOnce);
  t.true(c.calledWith(...args));
});

test('if combine handles when some items are not functions functions passed', (t) => {
  const a = sinon.spy();
  const b = null;
  const c = sinon.spy();

  const result = utils.combine(a, b, c);

  const args = ['foo', 'bar'];

  result(...args);

  t.true(a.calledOnce);
  t.true(a.calledWith(...args));

  t.true(c.calledOnce);
  t.true(c.calledWith(...args));
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
  const a = sinon.stub().callsFake((args) => {
    return [...args].reverse();
  });
  const b = null;
  const c = sinon.stub().callsFake((args) => {
    return args.slice(0, 2);
  });

  const result = utils.compose(a, b, c);

  const args = ['foo', 'bar', 'baz'];

  const value = result(args);

  t.true(a.calledOnce);
  t.true(a.calledWith(args.slice(0, 2)));

  t.true(c.calledOnce);
  t.true(c.calledWith(args));

  t.deepEqual(value, args.slice(0, 2).reverse());
});

test('if compose will handle no functions passed', (t) => {
  const a = null;
  const b = null;
  const c = null;

  const result = utils.compose(a, b, c);

  const args = ['foo', 'bar', 'baz'];

  const value = result(args);

  t.is(value, args);
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
  const key = ['key'];
  const keys = [['not key'], ['key'], ['also not key']];

  const result = utils.findKeyIndex(isEqual, keys, key);

  t.is(result, 1);
});

test('if findKeyIndex will return the default when not able to match key in keys based on value', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const key = ['key'];
  const keys = [['not key'], ['also not key']];

  const result = utils.findKeyIndex(isEqual, keys, key);

  t.is(result, -1);
});

test('if findKeyIndex will return the default when not able to match key in keys based on length', (t) => {
  const isEqual = (a, b) => {
    return a === b;
  };
  const key = ['key'];
  const keys = [['not key'], ['key', 'negated'], ['also not key']];

  const result = utils.findKeyIndex(isEqual, keys, key);

  t.is(result, -1);
});
