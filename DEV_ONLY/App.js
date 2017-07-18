import 'babel-polyfill';

import isEqual from 'lodash/isEqual';
import Bluebird from 'bluebird';
import PropTypes from 'prop-types';
import React, {
  Component
} from 'react';
import {
  render
} from 'react-dom';
import memoizee from 'memoizee';

import moize from '../src';

const foo = 'foo';
const bar = 'bar';

const method = function(one, two) {
  console.log('standard method fired', one, two);

  return [one, two].join(' ');
};

const memoized = moize(method);

memoized(foo, bar);
memoized(bar, foo);
memoized(foo, bar);
memoized(foo, bar);

console.log(memoized.cache);
console.log('has true', memoized.has([foo, bar]));
console.log('has false', memoized.has([foo, 'baz']));

const deepEqualMethod = ({one, two}) => {
  console.log('custom equal method fired', one, two);

  return [one, two];
};

const deepEqualMemoized = moize(deepEqualMethod, {
  equals: isEqual
});

deepEqualMemoized({one: 1, two: 2});
deepEqualMemoized({one: 2, two: 1});
deepEqualMemoized({one: 1, two: 2});
deepEqualMemoized({one: 1, two: 2});

console.log(deepEqualMemoized.cache);
console.log('has deep true', deepEqualMemoized.has([{one: 1, two: 2}]));
console.log('has deep false', deepEqualMemoized.has([{one: 1, two: 3}]));

const promiseMethod = (number, otherNumber) => {
  console.log('promise method fired', number);

  return new Promise((resolve) => {
    resolve(number * otherNumber);
  });
};

const promiseMethodRejected = (number) => {
  console.log('promise rejection method fired', number);

  return new Bluebird((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('foo'));
    }, 100);
  });
};

const memoizedPromise = moize(promiseMethod, {
  isPromise: true
});
const memoizedPromiseRejected = moize({isPromise: true})({promiseLibrary: Bluebird})(promiseMethodRejected);

console.log('curried options', memoizedPromiseRejected.options);

memoizedPromiseRejected(3)
  .then((foo) => {
    console.log(foo);
  })
  .catch((bar) => {
    console.error(bar);
  });

memoizedPromiseRejected(3)
  .then((foo) => {
    console.log(foo);
  })
  .catch((bar) => {
    console.error(bar);
  });

memoizedPromiseRejected(3)
  .then((foo) => {
    console.log(foo);
  })
  .catch((bar) => {
    console.error(bar);
  });

// get result
memoizedPromise(2, 2)
  .then((value) => {
    console.log(`computed value: ${value}`);
  });

// pull from cache
memoizedPromise(2, 2)
  .then((value) => {
    console.log(`cached value: ${value}`);
  });

console.log(memoizedPromise.keys());

const withDefault = (foo, bar = 'default') => {
  console.log('withDefault fired');

  return `${foo} ${bar}`;
};
const moizedWithDefault = moize(withDefault);
const memoizeedWithDefault = memoizee(withDefault);

console.log(moizedWithDefault('foo'));
console.log(moizedWithDefault('foo', 'bar'));
console.log(moizedWithDefault('foo'));

console.log(memoizeedWithDefault('bar'));
console.log(memoizeedWithDefault('bar', 'baz'));
console.log(memoizeedWithDefault('bar'));

const Foo = ({bar, fn, object, value}) => {
  console.log('Foo React element fired', bar, value);
  console.log('fn', fn);
  console.log('object', object);

  return (
    <div>
      {value} {bar}
    </div>
  );
};

Foo.propTypes = {
  bar: PropTypes.string.isRequired,
  fn: PropTypes.func.isRequired,
  object: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired
};

Foo.defaultProps = {
  bar: 'default'
};

const MemoizedFoo = moize.react(Foo);
const SimpleMemoizedFoo = moize.reactSimple(Foo);

console.log('MemoizedFoo', MemoizedFoo.options);
console.log('SimpleMemoizedFoo', SimpleMemoizedFoo.options);

console.log('MemoizedFoo cache', MemoizedFoo.cache);

const array = [
  {fn() {}, object: {}, value: 'foo'},
  {fn() {}, object: {}, value: 'bar'},
  {fn() {}, object: {}, value: 'baz'}
];

const HEADER_STYLE = {
  margin: 0
};

class App extends Component {
  render() {
    return (
      <div>
        <h1 style={HEADER_STYLE}>
          App
        </h1>

        <div>
          <h3>
            Uncached values (first time running)
          </h3>

          {array.map((values) => {
            return (
              <MemoizedFoo
                key={`called-${values.value}`}
                {...values}
              />
            );
          })}

          <h3>
            Cached values
          </h3>

          {array.map((values) => {
            return (
              <MemoizedFoo
                key={`memoized-${values.value}`}
                {...values}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

const div = document.createElement('div');

div.id = 'app-container';
div.style.backgroundColor = '#1d1d1d';
div.style.boxSizing = 'border-box';
div.style.color = '#d5d5d5';
div.style.height = '100vh';
div.style.padding = '15px';
div.style.width = '100vw';

document.body.style.margin = 0;
document.body.style.padding = 0;

render((
  <App/>
), div);

document.body.appendChild(div);
