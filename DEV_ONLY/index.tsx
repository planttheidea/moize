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
const quz = 'quz';

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

memoized.set([foo, bar], 'something totally different');

console.log(memoized(foo, bar));

console.log(memoized.getStats());

console.groupEnd();

console.group('maxArgs');

console.log(moize.maxArgs(1));

const memoizedMax = moize.maxArgs(1)(method);

memoizedMax(foo, bar);
memoizedMax(foo, baz);
memoizedMax(foo, quz);

console.groupEnd();

console.group('deep equals');

const deepEqualMethod = ({ one, two }: { one: number; two: number }) => {
  console.log('deep equalfired', one, two);

  return [one, two];
};

const deepEqualMemoized = moize(deepEqualMethod, { isDeepEqual: true });

deepEqualMemoized({ one: 1, two: 2 });
deepEqualMemoized({ one: 2, two: 1 });
deepEqualMemoized({ one: 1, two: 2 });
deepEqualMemoized({ one: 1, two: 2 });

console.log(deepEqualMemoized.cache);
console.log('has deep true', deepEqualMemoized.has([{ one: 1, two: 2 }]));
console.log('has deep false', deepEqualMemoized.has([{ one: 1, two: 3 }]));

console.groupEnd();

console.group('serialize');

const serializeMethod = ({ one, two }: { one: any; two: any }) => {
  console.log('serialize fired', one, two);

  return [one, two];
};

const serializeMemoized = moize(serializeMethod, { isSerialized: true });

serializeMemoized({ one: 1, two: 2 });
serializeMemoized({ one: 2, two: 1 });
serializeMemoized({ one: 1, two: 2 });
serializeMemoized({ one: 1, two: 2 });

console.log(serializeMemoized.cache);
console.log(serializeMemoized.options);

console.log('has serialized true', serializeMemoized.has([{ one: 1, two: 2 }]));
console.log('has serialized false', serializeMemoized.has([{ one: 1, two: 3 }]));

console.groupEnd();

console.group('with default parameters');

const withDefault = (foo: string, bar = 'default') => {
  console.log('withDefault fired');

  return `${foo} ${bar}`;
};
const moizedWithDefault = moize(withDefault, { maxSize: 2 });

console.log(moizedWithDefault(foo));
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
          expiringMemoized.cache.expirations.snapshot,
        );

        console.log(moize.getStats());

        return true;
      }

      console.log(
        'Expired! I will now reset the expiration, but this should be empty:',
        expiringMemoized.cache.expirations.snapshot,
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

console.log(expiringMemoized.cache);

console.log('existing expirations', expiringMemoized.cache.expirations.snapshot);

console.groupEnd();

console.log(moize.getStats());

console.group('react');

const Foo = ({
  bar,
  fn,
  object,
  value,
}: {
bar: string;
fn: Function;
object: any;
value: any;
}) => {
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

const GloballyMemoizedFoo = moize.reactGlobal(Foo, {
  isDeepEqual: true,
  maxSize: 3,
  profileName: 'GloballyMemoizedFoo',
});
const InstanceMemoizedFoo = moize.react(Foo, {
  isDeepEqual: true,
  profileName: 'InstanceMemoizedFoo',
});

console.log('GloballyMemoizedFoo', GloballyMemoizedFoo);
console.log('InstanceMemoizedFoo', InstanceMemoizedFoo);

const array = [
  { fn() {}, object: {}, value: foo },
  { fn() {}, object: {}, value: bar },
  { fn() {}, object: {}, value: baz },
];

const HEADER_STYLE = {
  margin: 0,
};

function App({ counter }: { counter: number }) {
  console.log('GloballyMemoizedFoo stats', moize.getStats('GloballyMemoizedFoo'));
  console.log('InstanceMemoizedFoo stats', moize.getStats('InstanceMemoizedFoo'));

  return (
    <div data-counter={counter}>
      <h1 style={HEADER_STYLE}>App</h1>

      <h3>Globally memoized</h3>

      <div>
        {array.map(values => (
          <GloballyMemoizedFoo key={`called-${values.value}`} {...values} />
        ))}
      </div>

      <h3>Memoized per-instance</h3>

      <div>
        {array.map(values => (
          <InstanceMemoizedFoo key={`called-${values.value}`} {...values} />
        ))}
      </div>
    </div>
  );
}

const RE_RENDER_FREQUENCY = 1000;

let counter = 0;

function renderApp() {
    render(<App counter={counter++} />, div);

    if (counter < 5) {
      setTimeout(renderApp, RE_RENDER_FREQUENCY);
    }
}

setTimeout(renderApp, RE_RENDER_FREQUENCY);

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
const memoizedPromiseRejected = moize(promiseMethodRejected, {
  isPromise: true,
  profileName: 'rejected promise',
  useProfileNameLocation: true,
});

console.log('curried options', memoizedPromiseRejected.options);

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

const memoizedOtherPromise = moize(otherPromiseMethod, {
  isPromise: true,
  maxAge: 1500,
  onCacheHit(cache: any) {
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
