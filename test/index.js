// test
import test from 'ava';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import sinon from 'sinon';

// src
import moize from 'src/index';
import * as utils from 'src/utils';

test('if moize returns a function', (t) => {
  const result = moize(() => {});

  t.true(_.isFunction(result));
});

test('if moize throws a TypeError when something other than a function is passed.', (t) => {
  t.throws(() => {
    moize('foo');
  }, TypeError);
});

test('if moize will return a new moized function with a mixture of the options if it is already memoized', (t) => {
  const fn = () => {};
  const moized = moize(fn, {
    maxArgs: 1
  });

  t.not(moized, fn);

  const moizedAgain = moize(moized, {
    maxAge: 10
  });

  t.not(moizedAgain, moized);

  t.is(moizedAgain.originalFunction, moized.originalFunction);
  t.deepEqual(moizedAgain.options, {
    maxArgs: 1,
    maxAge: 10
  });
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

test('if moize will throw an error when isPromise is true and promiseLibrary does not exist', (t) => {
  const fn = () => {};

  t.throws(() => {
    moize(fn, {
      isPromise: true,
      promiseLibrary: null
    });
  }, ReferenceError);
});

test('if moize.compose is the same as the compose util', (t) => {
  t.is(moize.compose, utils.compose);
});

test('if moize.maxAge will create a curryable method that accepts the age and then the method to memoize', (t) => {
  const maxAge = 5000;

  const moizer = moize.maxAge(maxAge);

  t.true(_.isFunction(moizer));

  const fn = () => {};

  const result = moizer(fn);

  t.true(_.isFunction(result));
  t.deepEqual(result.options, {
    maxAge
  });
});

test('if moize.maxSize will create a curryable method that accepts the size and then the method to memoize', (t) => {
  const maxSize = 5;

  const moizer = moize.maxSize(maxSize);

  t.true(_.isFunction(moizer));

  const fn = () => {};

  const result = moizer(fn);

  t.true(_.isFunction(result));
  t.deepEqual(result.options, {
    maxSize
  });
});

test('if moize.promise will create a memoized method with isPromise set to true', (t) => {
  const fn = async () => {};

  const result = moize.promise(fn);

  t.true(_.isFunction(result));

  t.deepEqual(result.options, {
    isPromise: true
  });
});

test('if moize.react will call moize with the correct arguments', (t) => {
  const jsdom = require('jsdom-global')();

  const Foo = () => {
    return (
      <div/>
    );
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

  const foo = (
    <Result {...props}/>
  );

  const div = document.createElement('div');

  ReactDOM.render(foo, div);

  const keys = Result.keys();
  const key = keys[0];
  const expectedKey = '|{"bar":"bar","passedFn":"function passedFn() {}","foo":"foo"}|{}|';

  t.is(key, expectedKey); // params serialized, including fn

  jsdom();
});

test('if moize.serialize will create a memoized method with serialize set to true', (t) => {
  const fn = () => {};

  const result = moize.serialize(fn);

  t.true(_.isFunction(result));

  t.deepEqual(result.options, {
    serialize: true
  });
});

test('if moize.simple will create a memoized method with maxAge set to 1', (t) => {
  const fn = () => {};

  const result = moize.simple(fn);

  t.true(_.isFunction(result));

  t.deepEqual(result.options, {
    maxSize: 1
  });
});
