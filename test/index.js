import test from 'ava';
import sinon from 'sinon';

import moize from 'src/index';

test('if moize returns a function', (t) => {
  const result = moize(() => {});

  t.is(typeof result, 'function');
});

test('if moize will memoize the result of the function based on the same arguments', (t) => {
  const fn = sinon.spy((foo, bar) => {
    return `${foo} ${bar}`;
  });

  const result = moize(fn);

  const args = ['foo', 'bar'];

  result(...args);

  t.true(fn.calledOnce);

  result(...args);

  t.true(fn.calledOnce);
});

test('if moize will call setUsageOrder when maxSize is hit', (t) => {
  const fn = (foo, bar) => {
    return `${foo} ${bar}`;
  };

  const result = moize(fn, {
    maxSize: 1
  });

  result('foo', 'bar');

  const currentUsage = [...result.usage];

  result('bar', 'foo');

  t.not(result.usage[0], currentUsage[0]);
});

test('if moize will accept a custom cache as argument', (t) => {
  let cache = {
    delete: sinon.stub(),
    get: sinon.stub(),
    has: sinon.spy(() => {
      return false;
    }),
    set: sinon.stub()
  };

  const fn = (foo, bar) => {
    return `${foo} ${bar}`;
  };

  const result = moize(fn, {
    cache
  });

  result('foo', 'bar');

  t.true(cache.has.calledOnce);
  t.true(cache.set.calledOnce);
});

test('if moize will accept a custom serializer as argument', (t) => {
  const key = 'baz';

  let serializer = sinon.spy(() => {
    return key;
  });

  const fn = (foo, bar) => {
    return `${foo} ${bar}`;
  };

  const result = moize(fn, {
    serializer
  });

  result('foo', 'bar');

  t.true(serializer.calledOnce);
  t.true(result.cache.has(key));
});