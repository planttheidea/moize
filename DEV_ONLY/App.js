import 'babel-polyfill';

import React, {
  Component
} from 'react';
import {
  render
} from 'react-dom';

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

const memoizedPromise = moize(promiseMethod);

// get result
memoizedPromise(2, 2)
  .then((value) => {
    console.log(`computed value: ${value}`)
  });

// pull from cache
memoizedPromise(2, 2)
  .then((value) => {
    console.log(`cached value: ${value}`)
  });

console.log(memoizedPromise.keys());

const Foo = (props) => {
  console.log('Foo React element fired', props);

  return (
    <div>
      {props.value}
    </div>
  );
};

const MemoizedFoo = moize.react(Foo);

const array = ['foo', 'bar', 'baz'];

class App extends Component {
  render() {
    return (
      <div>
        <h1>
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

render((
  <App/>
), div);

document.body.appendChild(div);
