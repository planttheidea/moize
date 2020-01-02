import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import moize, { Options } from '../src/index';

const { useRef } = React;
const { render } = ReactDOM;

function useMoize(fn: (...args: any[]) => void, nextArgs: any[], options?: Options) {
  const moizedFn = useRef(moize(fn, options));

  return moizedFn.current(...nextArgs);
}

moize.collectStats();

const method = function(one: string, two: string) {
  console.log('standard method fired', one, two);

  return [one, two].join(' ');
};

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

console.group('react');

type FooProps = {
  bar?: string;
  fn?: (...args: any[]) => any;
  key: string;
  object?: object;
  value?: any;
};

const Foo = ({ bar, fn, object, value }: FooProps) => {
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
  value: PropTypes.string.isRequired,
};

Foo.defaultProps = {
  bar: 'default',
};

const MemoizedFoo = moize.react(Foo, { isDeepEqual: true });
const SimpleMemoizedFoo = moize.reactSimple(Foo, {
  profileName: 'SimpleMemoizedFoo',
});
const LimitedMemoizedFoo = moize.compose()(Foo);

console.log('MemoizedFoo', MemoizedFoo.options, MemoizedFoo._microMemoizeOptions);
console.log('SimpleMemoizedFoo', SimpleMemoizedFoo.options, SimpleMemoizedFoo._microMemoizeOptions);
console.log(
  'LimitedMemoizedFoo',
  LimitedMemoizedFoo.options,
  LimitedMemoizedFoo._microMemoizeOptions
);

console.log('MemoizedFoo cache', MemoizedFoo.cache);

const array = [
  {
    fn() {},
    object: {},
    value: foo,
  },
  {
    fn() {},
    object: {},
    value: bar,
  },
  {
    fn() {},
    object: {},
    value: baz,
  },
];

console.groupEnd();

console.group('expiration');

const expiringMemoized = moize.maxAge(1000)(method, {
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

const HEADER_STYLE = {
  margin: 0,
};

function App({ first, second }) {
  console.log('rendered');

  const sum = useMoize(
    (a, b) => {
      console.log('memoized called');

      return a + b;
    },
    [first, second]
  );
  const deepSum = useMoize(
    (object) => {
      console.log('deep memoized called');

      return object.a + object.b;
    },
    [
      {
        a: first,
        b: second,
      },
    ],
    { isDeepEqual: true }
  );

  console.log('sum', sum);
  console.log('deepSum', deepSum);

  return (
    <div>
      <h1 style={HEADER_STYLE}>App</h1>

      <div>
        <h3>Uncached values (first time running)</h3>

        {array.map((values) => (
          // prettier
          <MemoizedFoo key={`called-${values.value}`} {...values} />
        ))}

        <h3>Cached values</h3>

        {array.map((values) => (
          // prettier
          <MemoizedFoo key={`memoized-${values.value}`} {...values} />
        ))}
      </div>
    </div>
  );
}

render(<App first={1} second={2} />, div);

let count = 0;

setInterval(() => {
  render(<App first={1} second={count > 2 ? 3 : 2} />, div);

  count++;
}, 5000);
