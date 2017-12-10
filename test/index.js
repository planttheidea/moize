// test
import test from 'ava';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import sinon from 'sinon';
import {sleep} from 'test/helpers/utils';

// src
import moize from 'src/index';
import * as constants from 'src/constants';
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
    ...constants.DEFAULT_OPTIONS,
    maxArgs: 1,
    maxAge: 10,
    serializer: null
  });
});

test('if moize will call onExpire callback with args when a cache item expires', async (t) => {
  const fn = () => {};
  const maxAge = 100;
  const args = ['foo'];
  const onExpire = sinon.spy();

  const moized = moize(fn, {maxAge, onExpire});

  moized(...args);

  t.true(moized.has(args));

  await sleep(maxAge + 50);

  t.false(moized.has(args));
  t.true(onExpire.calledOnce);
});

test('if onExpire callback will be called with a correct key', async (t) => {
  const fn = () => {};
  const maxAge = 50;

  moize(fn, {
    maxAge,
    onExpire(key) {
      t.is(key, undefined);
    }
  })();

  const arg = 'foo';

  moize(fn, {
    maxAge,
    onExpire(key) {
      t.is(key, arg);
    }
  })(arg);

  const args = ['foo', 'bar'];

  moize(fn, {
    maxAge,
    onExpire(key) {
      t.deepEqual(key, args);
    }
  })(...args);

  await sleep(maxAge + 200);
});

test('if moize will current the options into a future call', (t) => {
  const firstOptions = {
    equals() {}
  };

  const firstMoizer = moize(firstOptions);

  t.is(typeof firstMoizer, 'function');

  const secondOptions = {
    isReact: true
  };

  const secondMoizer = firstMoizer(secondOptions);

  t.is(typeof secondMoizer, 'function');

  const moized = secondMoizer(() => {});

  t.is(typeof moized, 'function');

  t.deepEqual(moized.options, {
    ...constants.DEFAULT_OPTIONS,
    ...firstOptions,
    ...secondOptions
  });
});

test('if moize will curry as long as options objects are passed as the first parameter', (t) => {
  const length = 1000;

  let index = 0,
      moizer;

  while (index < length) {
    moizer = moize({index});

    if (typeof moizer !== 'function') {
      t.fail();
    }

    index++;
  }

  const moized = moizer(() => {});

  t.is(moized.options.index, length - 1);

  t.pass();
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

test('if moize will accept a custom serializer as argument', (t) => {
  const key = 'baz';

  let serializer = sinon.stub().returns(key);

  const fn = (foo, bar) => {
    return `${foo} ${bar}`;
  };

  const result = moize(fn, {
    serialize: true,
    serializer
  });

  result('foo', 'bar');

  t.true(serializer.calledOnce);

  const keys = result.keys();

  t.is(keys.length, 1);
  t.is(keys[0].key, 'baz');
});

test('if moize will throw an error when isPromise is true and promiseLibrary does not exist', (t) => {
  const fn = () => {};

  t.throws(() => {
    moize(fn, {
      isPromise: true,
      promiseLibrary: null
    });
  }, TypeError);
});

test('if moize.compose is the same as the compose util', (t) => {
  t.is(moize.compose, utils.compose);
});

test('if moize.isMoized will return false if the fn passed is not a function', (t) => {
  const fn = null;

  const result = moize.isMoized(fn);

  t.false(result);
});

test('if moize.isMoized will return false if the fn passed is a function that does not have an isMoized property', (t) => {
  const fn = () => {};

  const result = moize.isMoized(fn);

  t.false(result);
});

test('if moize.isMoized will return true if the fn passed is a function that has been moized', (t) => {
  const fn = moize(() => {});

  const result = moize.isMoized(fn);

  t.true(result);
});

test('if moize.maxAge will create a curryable method that accepts the age and then the method to memoize', (t) => {
  const maxAge = 5000;

  const moizer = moize.maxAge(maxAge);

  t.true(_.isFunction(moizer));

  const fn = () => {};

  const result = moizer(fn);

  t.true(_.isFunction(result));
  t.deepEqual(result.options, {
    ...constants.DEFAULT_OPTIONS,
    maxAge,
    serializer: null
  });
});

test('if moize.maxArgs will create a curryable method that accepts the age and then the method to memoize', (t) => {
  const maxArgs = 3;

  const moizer = moize.maxArgs(maxArgs);

  t.true(_.isFunction(moizer));

  const fn = () => {};

  const result = moizer(fn);

  t.true(_.isFunction(result));
  t.deepEqual(result.options, {
    ...constants.DEFAULT_OPTIONS,
    maxArgs,
    serializer: null
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
    ...constants.DEFAULT_OPTIONS,
    maxSize,
    serializer: null
  });
});

test('if moize.promise will create a memoized method with isPromise set to true', (t) => {
  const fn = async () => {};

  const result = moize.promise(fn);

  t.true(_.isFunction(result));

  t.deepEqual(result.options, {
    ...constants.DEFAULT_OPTIONS,
    isPromise: true,
    serializer: null
  });
});

test('if moize.react will call moize with the correct arguments', (t) => {
  const jsdom = require('jsdom-global')();

  const Foo = () => {
    return <div />;
  };

  Foo.defaultProps = {
    foo: 'foo'
  };

  const Result = moize.react(Foo);

  const props = {
    bar: 'bar',
    passedFn: () => {}
  };

  const foo = <Result {...props} />;

  const div = document.createElement('div');

  ReactDOM.render(foo, div);

  const keys = Result.keys();

  t.is(keys.length, 1);

  const key = keys[0].key;

  const expectedProps = Object.keys(Foo.defaultProps).reduce(
    (cleanProps, key) => {
      if (cleanProps[key] === void 0) {
        cleanProps[key] = Foo.defaultProps[key];
      }

      return cleanProps;
    },
    {...props}
  );

  t.deepEqual(key, {
    context: {
      keys: [],
      size: 0,
      value: {}
    },
    props: {
      keys: Object.keys(expectedProps),
      size: Object.keys(expectedProps).length,
      value: expectedProps
    }
  });

  jsdom();
});

test('if moize.reactSimple has the same options as moize.react, but also has a maxSize of 1', (t) => {
  const Foo = () => {
    return <div />;
  };

  Foo.defaultProps = {
    foo: 'foo'
  };

  const StandardResult = moize.react(Foo);
  const SimpleResult = moize.reactSimple(Foo);

  t.notDeepEqual(SimpleResult.options, StandardResult.options);
  t.deepEqual(SimpleResult.options, {
    ...StandardResult.options,
    maxSize: 1
  });
});

test('if moize.serialize will create a memoized method with serialize set to true', (t) => {
  const fn = () => {};
  const serializer = () => {};

  const result = moize.serialize(fn, {
    serializer
  });

  t.true(_.isFunction(result));

  t.deepEqual(result.options, {
    ...constants.DEFAULT_OPTIONS,
    serialize: true,
    serializer
  });
});

test('if moize.simple will create a memoized method with maxAge set to 1', (t) => {
  const fn = () => {};

  const result = moize.simple(fn);

  t.true(_.isFunction(result));

  t.deepEqual(result.options, {
    ...constants.DEFAULT_OPTIONS,
    maxSize: 1,
    serializer: null
  });
});

test('if moize.default is a reference to moize itself (for typescript import purposes)', (t) => {
  t.is(moize, moize.default);
});
