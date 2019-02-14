/* globals document */

/* eslint-disable no-param-reassign,no-shadow,import/no-extraneous-dependencies */

import Bluebird from 'bluebird';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { render } from 'react-dom';
// @ts-ignore
import memoizee from 'memoizee';
// import memoize from 'micro-memoize';

import moize from '../src';

document.body.style.margin = '0px';
document.body.style.padding = '0px';

const div = document.createElement('div');

div.id = 'app-container';
div.style.backgroundColor = '#1d1d1d';
div.style.boxSizing = 'border-box';
div.style.color = '#d5d5d5';
div.style.height = '100vh';
div.style.padding = '15px';
div.style.width = '100vw';

document.body.appendChild(div);

moize.collectStats();

console.group('standard');

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

function method(one: string, two: string) {
  console.log('standard method fired', one, two);

  return [one, two].join(' ');
}

const memoized = moize(method);

memoized(foo, bar);
memoized(bar, foo);
memoized(foo, bar);
memoized(foo, bar);

console.log(memoized.cache);
console.log('has true', memoized.has([foo, bar]));
console.log('has false', memoized.has([foo, 'baz']));

memoized.update([foo, bar], 'something totally different');

console.log(memoized(foo, bar));

console.log(memoized.getStats());

console.groupEnd();

console.group('maxArgs');

const memoizedMax = moize.maxArgs(1)(method);

memoizedMax(foo, bar);
memoizedMax(foo, 'baz');

console.groupEnd();

console.group('deep equals');

const deepEqualMethod = ({ one, two }: {one: string, two: string}) => {
  console.log('deep equalfired', one, two);

  return [one, two];
};

const deepEqualMemoized = moize.deep(deepEqualMethod);

deepEqualMemoized({ one: 1, two: 2 });
deepEqualMemoized({ one: 2, two: 1 });
deepEqualMemoized({ one: 1, two: 2 });
deepEqualMemoized({ one: 1, two: 2 });

console.log(deepEqualMemoized.cache);
console.log('has deep true', deepEqualMemoized.has([{ one: 1, two: 2 }]));
console.log('has deep false', deepEqualMemoized.has([{ one: 1, two: 3 }]));

console.groupEnd();

console.group('serialize');

const serializeMethod = ({ one, two }: {one: any, two: any}) => {
  console.log('serialize fired', one, two);

  return [one, two];
};

const serializeMemoized = moize.serialize(serializeMethod);

serializeMemoized({ one: 1, two: 2 });
serializeMemoized({ one: 2, two: 1 });
serializeMemoized({ one: 1, two: 2 });
serializeMemoized({ one: 1, two: 2 });

console.log(serializeMemoized.cache);
console.log(serializeMemoized.options);
console.log(serializeMemoized._microMemoizeOptions);
console.log('has serialized true', serializeMemoized.has([{ one: 1, two: 2 }]));
console.log('has serialized false', serializeMemoized.has([{ one: 1, two: 3 }]));

console.groupEnd();

console.group('with default parameters');

const withDefault = (foo: string, bar = 'default') => {
  console.log('withDefault fired');

  return `${foo} ${bar}`;
};
const moizedWithDefault = moize(withDefault);

console.log(moizedWithDefault(foo));
console.log(moizedWithDefault(foo, bar));
console.log(moizedWithDefault(foo));

console.groupEnd();

console.group('transform args');

const onlyLastTwo = (one: string, two: string, three: string) => {
  console.log('only last two called', [one, two, three]);

  return [two, three];
};

const moizedLastTwo = moize(onlyLastTwo, {
  transformArgs(args) {
    const newKey = [];

    let index = args.length;

    while (--index) {
      newKey[index - 1] = args[index];
    }

    return newKey;
  },
});

console.log(moizedLastTwo(foo, bar, baz));
console.log(moizedLastTwo(null, bar, baz));

console.log(moizedLastTwo.cache);

console.groupEnd();

console.group('expiration');

const expiringMemoized = moize(method, {
  maxAge: 1000,
  onExpire: (() => {
    let count = 0;

    return () => {
      if (count !== 0) {
        console.log(
          'Expired! This is the last time I will fire, and this should be empty:',
          expiringMemoized.expirationsSnapshot,
        );

        console.log(moize.getStats());

        return true;
      }

      console.log(
        'Expired! I will now reset the expiration, but this should be empty:',
        expiringMemoized.expirationsSnapshot,
      );

      count++;

      return false;
    };
  })(),
  updateExpire: true,
});

expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);
expiringMemoized(foo, bar);

console.log('existing expirations', expiringMemoized.expirationsSnapshot);

console.groupEnd();

console.log(moize.getStats());

console.group('react');

const Foo = ({
  bar, fn, object, value,
}: {bar: string, fn: Function, object: any, value: any}) => {
  console.count('react');
  console.log('Foo React element fired', bar, value, fn, object);

  return (
    <div>
      {value}
      {' '}
      {bar}
    </div>
  );
};

Foo.propTypes = {
  bar: PropTypes.string.isRequired,
  fn: PropTypes.func.isRequired,
  object: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
};

Foo.defaultProps = {
  bar: 'default',
};

const MemoizedFoo = moize.react(Foo, { isDeepEqual: true, profileName: 'MemoizedFoo' });
const SimpleMemoizedFoo = moize.reactSimple(Foo);
const LimitedMemoizedFoo = moize.compose()(Foo);

console.log('MemoizedFoo', MemoizedFoo.options, MemoizedFoo._microMemoizeOptions);
console.log('SimpleMemoizedFoo', SimpleMemoizedFoo.options, SimpleMemoizedFoo._microMemoizeOptions);
console.log('LimitedMemoizedFoo', LimitedMemoizedFoo.options, LimitedMemoizedFoo._microMemoizeOptions);

console.log('MemoizedFoo cache', MemoizedFoo.cache);

const array = [
  { fn() {}, object: {}, value: foo },
  { fn() {}, object: {}, value: bar },
  { fn() {}, object: {}, value: baz },
];

console.groupEnd();

console.group('promise');

const promiseMethod = (number: number, otherNumber: number) => {
  console.log('promise method fired', number);

  // @ts-ignore
  return new Bluebird((resolve: Function) => {
    resolve(number * otherNumber);
  });
};

const promiseMethodRejected = (number: number) => {
  console.log('promise rejection method fired', number);

  // @ts-ignore
  return new Bluebird((resolve: Function, reject: Function) => {
    setTimeout(() => {
      reject(new Error(foo));
    }, 100);
  });
};

const memoizedPromise = moize(promiseMethod, {
  isPromise: true,
});
const memoizedPromiseRejected = moize({ isPromise: true, profileName: 'rejected promise' })(promiseMethodRejected);

console.log('curried options', memoizedPromiseRejected.options);
console.log('curried options under the hood', memoizedPromiseRejected._microMemoizeOptions);

memoizedPromiseRejected(3)
  .then((foo: any) => {
    console.log(foo);
  })
  .catch((bar: any) => {
    console.error(bar);
  })
  .finally(() => {
    console.log(memoizedPromiseRejected.keys());
  });

memoizedPromiseRejected(3)
  .then((foo: any) => {
    console.log(foo);
  })
  .catch((bar: any) => {
    console.error(bar);
  })
  .finally(() => {
    console.log(memoizedPromiseRejected.keys());
  });

memoizedPromiseRejected(3)
  .then((foo: any) => {
    console.log(foo);
  })
  .catch((bar: any) => {
    console.error(bar);
  })
  .finally(() => {
    console.log(memoizedPromiseRejected.keys());
  });

// get result
memoizedPromise(2, 2).then((value: any) => {
  console.log(`computed value: ${value}`);
});

// pull from cache
memoizedPromise(2, 2).then((value: any) => {
  console.log(`cached value: ${value}`);
});

console.log(memoizedPromise.keys());

const otherPromiseMethod = (number: number) => new Promise((resolve: Function) => {
  setTimeout(() => {
    resolve(number * 2);
  }, 1000);
});

const memoizedOtherPromise = moize.promise(otherPromiseMethod, {
  maxAge: 1500,
  onCacheHit(cache: Moize.Cache) {
    console.log('must have resolved!', cache);
  },
  onExpire() {
    console.log('updated promise expired');
  },
});

memoizedOtherPromise(4).then((number: any) => {
  console.log('i should be 8', number);
});

console.groupEnd();

const HEADER_STYLE = {
  margin: 0,
};

function App() {
  return (
    <div>
      <h1 style={HEADER_STYLE}>App</h1>

      <div>
        <h3>Uncached values (first time running)</h3>

        {array.map(values => (
          <MemoizedFoo
            key={`called-${values.value}`}
            {...values}
          />
        ))}

        <h3>Cached values</h3>

        {array.map(values => (
          <MemoizedFoo
            key={`memoized-${values.value}`}
            {...values}
          />
        ))}
      </div>
    </div>
  );
}

render(<App />, div);
