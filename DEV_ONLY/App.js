import 'babel-polyfill';

import Bluebird from 'bluebird';
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
const memoizedPromiseRejected = moize.promise({
  promiseLibrary: Bluebird
})(promiseMethodRejected);

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

const Foo = ({bar, value}) => {
  console.log('Foo React element fired', bar, value);

  return (
    <div>
      {value} {bar}
    </div>
  );
};

Foo.defaultProps = {
  bar: 'default'
};

const MemoizedFoo = moize.react(Foo);
const SimpleMemoizedFoo = moize.compose(moize.simple, moize.react)(Foo);

console.log(SimpleMemoizedFoo.options);

const array = ['foo', 'bar', 'baz'];

const HEADER_STYLE = {
  margin: 0
};

const memoizeMultiStuffs = (a, b, c) => {
  console.log('lru called');

  return JSON.stringify({a, b, c});
};

const a = 'foo';
const b = 'bar';
const c = 'baz';

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

          {array.map((value, index) => {
            return (
              <MemoizedFoo
                key={index}
                value={value}
              />
            );
          })}

          <h3>
            Cached values
          </h3>

          {array.map((value, index) => {
            return (
              <MemoizedFoo
                key={index}
                value={value}
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
