import 'babel-polyfill';

import isEqual from 'lodash/isEqual';
import Bluebird from 'bluebird';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {render} from 'react-dom';
import memoizee from 'memoizee';

import moize, {collectStats} from '../src';

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

document.body.appendChild(div);

collectStats();

console.group('standard');

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

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

console.log(memoized.getStats());

console.groupEnd('standard');

console.group('maxArgs');

const memoizedMax = moize.maxArgs(1)(method);

memoizedMax(foo, bar);
memoizedMax(foo, 'baz');

console.groupEnd('maxArgs');

console.group('deep equals');

const deepEqualMethod = ({one, two}) => {
  console.log('deep equalfired', one, two);

  return [one, two];
};

const deepEqualMemoized = moize.deep(deepEqualMethod);

deepEqualMemoized({one: 1, two: 2});
deepEqualMemoized({one: 2, two: 1});
deepEqualMemoized({one: 1, two: 2});
deepEqualMemoized({one: 1, two: 2});

console.log(deepEqualMemoized.cache);
console.log('has deep true', deepEqualMemoized.has([{one: 1, two: 2}]));
console.log('has deep false', deepEqualMemoized.has([{one: 1, two: 3}]));

console.groupEnd('deep equals');

console.group('serialize');

const serializeMethod = ({one, two}) => {
  console.log('serialize fired', one, two);

  return [one, two];
};

const serializeMemized = moize.serialize(serializeMethod);

serializeMemized({one: 1, two: 2});
serializeMemized({one: 2, two: 1});
serializeMemized({one: 1, two: 2});
serializeMemized({one: 1, two: 2});

console.log(serializeMemized.cache);
console.log('has serialized true', serializeMemized.has([{one: 1, two: 2}]));
console.log('has serialized false', serializeMemized.has([{one: 1, two: 3}]));

console.groupEnd('serialize');

console.group('promise');

const promiseMethod = (number, otherNumber) => {
  console.log('promise method fired', number);

  return new Bluebird((resolve) => {
    resolve(number * otherNumber);
  });
};

const promiseMethodRejected = (number) => {
  console.log('promise rejection method fired', number);

  return new Bluebird((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(foo));
    }, 100);
  });
};

const memoizedPromise = moize(promiseMethod, {
  isPromise: true
});
const memoizedPromiseRejected = moize({isPromise: true, profileName: 'rejected promise'})(promiseMethodRejected);

console.log('curried options', memoizedPromiseRejected.options);
console.log('curried options under the hood', memoizedPromiseRejected._microMemoizeOptions);

memoizedPromiseRejected(3)
  .then((foo) => {
    console.log(foo);
  })
  .catch((bar) => {
    console.error(bar);
  })
  .finally(() => {
    console.log(memoizedPromiseRejected.keys());
  });

memoizedPromiseRejected(3)
  .then((foo) => {
    console.log(foo);
  })
  .catch((bar) => {
    console.error(bar);
  })
  .finally(() => {
    console.log(memoizedPromiseRejected.keys());
  });

memoizedPromiseRejected(3)
  .then((foo) => {
    console.log(foo);
  })
  .catch((bar) => {
    console.error(bar);
  })
  .finally(() => {
    console.log(memoizedPromiseRejected.keys());
  });

// get result
memoizedPromise(2, 2).then((value) => {
  console.log(`computed value: ${value}`);
});

// pull from cache
memoizedPromise(2, 2).then((value) => {
  console.log(`cached value: ${value}`);
});

console.log(memoizedPromise.keys());

const otherPromiseMethod = (number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(number * 2);
    }, 1000);
  });
};

const memoizedOtherPromise = moize.promise(otherPromiseMethod, {
  maxAge: 1500,
  onCacheHit(cache) {
    console.log('must have resolved!', cache);
  },
  onExpire() {
    console.log('updated promise expired');
  }
});

memoizedOtherPromise(4).then((number) => {
  console.log('i should be 8', number);
});

console.groupEnd('promise');

console.group('with default parameters');

const withDefault = (foo, bar = 'default') => {
  console.log('withDefault fired');

  return `${foo} ${bar}`;
};
const moizedWithDefault = moize(withDefault);
const memoizeedWithDefault = memoizee(withDefault);

console.log(moizedWithDefault(foo));
console.log(moizedWithDefault(foo, bar));
console.log(moizedWithDefault(foo));

console.log(memoizeedWithDefault(bar));
console.log(memoizeedWithDefault(bar, baz));
console.log(memoizeedWithDefault(bar));

console.groupEnd('with default parameters');

console.group('transform args');

const onlyLastTwo = (one, two, three) => {
  console.log('only last two called', [one, two, three]);

  return [two, three];
};

const moizedLastTwo = moize(onlyLastTwo, {
  transformArgs(args) {
    let index = args.length,
        newKey = [];

    while (--index) {
      newKey[index - 1] = args[index];
    }

    return newKey;
  }
});

console.log(moizedLastTwo(foo, bar, baz));
console.log(moizedLastTwo(null, bar, baz));

console.log(moizedLastTwo.cache);

console.groupEnd('transform args');

console.group('react');

const Foo = ({bar, fn, object, value}) => {
  console.count('react');
  console.log('Foo React element fired', bar, value, fn, object);

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

const MemoizedFoo = moize.react(Foo, {isDeepEqual: true});
const SimpleMemoizedFoo = moize.reactSimple(Foo, {profileName: 'SimpleMemoizedFoo'});
const LimitedMemoizedFoo = moize.compose()(Foo);

console.log('MemoizedFoo', MemoizedFoo.options, MemoizedFoo._microMemoizeOptions);
console.log('SimpleMemoizedFoo', SimpleMemoizedFoo.options, SimpleMemoizedFoo._microMemoizeOptions);
console.log('LimitedMemoizedFoo', LimitedMemoizedFoo.options, LimitedMemoizedFoo._microMemoizeOptions);

console.log('MemoizedFoo cache', MemoizedFoo.cache);

const array = [{fn() {}, object: {}, value: foo}, {fn() {}, object: {}, value: bar}, {fn() {}, object: {}, value: baz}];

console.groupEnd('react');

console.group('expiration');

const expiringMemoized = moize(method, {
  maxAge: 1000,
  onExpire: (() => {
    let count = 0;

    return () => {
      if (count !== 0) {
        console.log(
          'Expired! This is the last time I will fire, and this should be empty:',
          expiringMemoized.expirationsSnapshot
        );

        console.log(moize.getStats());

        return true;
      }

      console.log(
        'Expired! I will now reset the expiration, but this should be empty:',
        expiringMemoized.expirationsSnapshot
      );

      count++;

      return false;
    };
  })(),
  updateExpire: true
});

expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);

console.log('existing expirations', expiringMemoized.expirationsSnapshot);

console.groupEnd('expiration');

console.log(moize.getStats());

const HEADER_STYLE = {
  margin: 0
};

class App extends Component {
  render() {
    return (
      <div>
        <h1 style={HEADER_STYLE}>App</h1>

        <div>
          <h3>Uncached values (first time running)</h3>

          {array.map((values) => {
            return (<MemoizedFoo
              key={`called-${values.value}`}
              {...values}
            />);
          })}

          <h3>Cached values</h3>

          {array.map((values) => {
            return (<MemoizedFoo
              key={`memoized-${values.value}`}
              {...values}
            />);
          })}
        </div>
      </div>
    );
  }
}

render(<App />, div);
