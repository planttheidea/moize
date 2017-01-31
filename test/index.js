import test from 'ava';
import React from 'react';
import ReactDOM from 'react-dom';
import sinon from 'sinon';

import moize from 'src/index';

test('if moize returns a function', (t) => {
  const result = moize(() => {});

  t.is(typeof result, 'function');
});

test('if moize throws a TypeError when something other than a function is passed.', (t) => {
  t.throws(() => {
    moize('foo');
  }, TypeError);
});

test('if moize will return the function passed if it is already memoized', (t) => {
  const fn = () => {};
  const moized = moize(fn);

  t.not(moized, fn);

  const moizedAgain = moize(moized);

  t.is(moizedAgain, moized);
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

  t.is(result.cache, cache);
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
    serialize: true,
    serializer
  });

  result('foo', 'bar');

  t.true(serializer.calledOnce);
  t.true(result.cache.has(key));
});

test('if moize.react will call moize with the correct arguments', (t) => {
  const jsdom = require('jsdom-global')();

  const Foo = () => {
    return React.createElement('div', {});
  };
  const options = {
    foo: 'bar'
  };

  Foo.defaultProps = {
    foo: 'foo'
  };

  const Result = moize.react(Foo, options);

  const props = {
    bar: 'bar',
    passedFn: () => {}
  };

  const foo = React.createElement(Result, props);

  const div = document.createElement('div');

  ReactDOM.render(foo, div);

  t.is(Result.keys()[0], '|{"bar":"bar","passedFn":"() => {}","foo":"foo"}|{}|'); // params serialized, including fn

  jsdom();
});
