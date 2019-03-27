import '@babel/polyfill';

import Bluebird from 'bluebird';
import {
  cloneDeep,
  get,
  set,
  union,
  omitBy,
  isEqual,
  isNil,
  isEmpty,
} from 'lodash';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {render} from 'react-dom';
import memoizee from 'memoizee';
import memoize from 'micro-memoize';

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

const AGG_TYPE = {
  AVG: 'AVG',
  COUNT: 'COUNT',
  INCLUSIVE: 'INCLUSIVE',
  SUM: 'SUM',
};

const {INCLUSIVE, SUM, AVG, COUNT} = AGG_TYPE;

export const getFieldValue = (item, field) => {
  let value = typeof field === 'string' ? item[field] : get(item, field);

  if (typeof value === 'object' && value !== null) {
    value = value.value;
  }

  return value;
};

export const setFieldValue = (item, field, value) => {
  if (typeof field === 'string') {
    item[field] = value;
  } else {
    set(item, field, value);
  }
};

export const getFieldAggValue = (item, field) => {
  const value = typeof field === 'string' ? item[field] : get(item, field);

  if (typeof value === 'object' && value !== null) {
    return value.agg;
  }

  return undefined;
};

export const unionInclusiveObject = (objA, objB) => {
  if (isNil(objA) && isNil(objB)) {
    return undefined;
  } else if (isNil(objA) && !isNil(objB)) {
    return typeof objB === 'object' ? {...objB} : undefined;
  } else if (!isNil(objA) && isNil(objB)) {
    return typeof objA === 'object' ? {...objA} : undefined;
  } else if (typeof objA !== 'object' || typeof objB !== 'object') {
    return undefined;
  }

  const sum = {};
  const objAKeys = Object.keys(objA);
  const objBKeys = Object.keys(objB);
  const keys = union(objAKeys, objBKeys);

  keys.forEach((key) => {
    sum[key] = (objA[key] || 0) + (objB[key] || 0);
  });

  return sum;
};

export const sumWithNil = (a, b) => {
  if (isNil(a) && isNil(b)) {
    return undefined;
  } else if (isNil(a) && !isNil(b)) {
    return b;
  } else if (!isNil(a) && isNil(b)) {
    return a;
  }

  return a + b;
};

// export const aggregateData = memoize(
// export const aggregateData = memoizee(
export const aggregateData = moize(
  (data, aggMetadata) => {
    const AGG_NAMES = Object.keys(aggMetadata);
    const {children} = data;

    if (isEmpty(children)) {
      return data;
    }

    // Recursion
    const newChildren = children.map((row) => (row.children ? aggregateData(row, aggMetadata) : row));

    const aggData = {};

    AGG_NAMES.forEach((aggName) => {
      const {ref: field = aggName, type, rounding} = aggMetadata[aggName];

      let inclusiveAgg;

      let sumAgg;

      let avgAgg;

      let countAgg;

      newChildren.forEach((row) => {
        const rowAggValue = getFieldAggValue(row, field);
        const rowValue = getFieldValue(row, field);

        // Determine if it aggregates on aggregated value or on primitive value
        // Aggregate on aggregated: group row aggregated from group rows
        // Aggregate on primitive: group row aggregated from element rows

        const isAggOnAgg = !isNil(rowAggValue);
        const canAggOnPri = !isNil(rowValue);

        if (isAggOnAgg) {
          countAgg = sumWithNil(countAgg, rowAggValue[COUNT]);
        } else if (canAggOnPri) {
          countAgg = sumWithNil(countAgg, 1);
        }

        if (type === INCLUSIVE) {
          if (isAggOnAgg) {
            inclusiveAgg = unionInclusiveObject(inclusiveAgg, rowAggValue[INCLUSIVE]);
          } else if (canAggOnPri) {
            inclusiveAgg = unionInclusiveObject(inclusiveAgg, {[rowValue]: 1});
          }
        } else if (type === SUM || type === AVG) {
          if (isAggOnAgg) {
            sumAgg = sumWithNil(sumAgg, rowAggValue[SUM]);
          } else if (canAggOnPri) {
            sumAgg = sumWithNil;

            // document.body.style.margin(sumAgg, rowValue);
          }
        }
      });

      if (type === AVG && countAgg && !isNil(sumAgg)) {
        avgAgg = sumAgg / countAgg;
        if (rounding) {
          const {strategy} = rounding;

          if (strategy === 'truncate') {
            avgAgg = Math.trunc(avgAgg);
          }
        }
      }

      setFieldValue(aggData, field, {
        agg: omitBy(
          {
            [AVG]: avgAgg,
            [COUNT]: countAgg,
            [INCLUSIVE]: inclusiveAgg,
            [SUM]: sumAgg,
          },
          isNil
        ),
      });
    });

    return {
      ...data,
      ...aggData,
      children: newChildren,
    };
  },
  {
    length: false,
    max: 10,
  }
);

const aggMetadata = {
  a: {type: COUNT},
  b: {type: SUM},
  c: {type: AVG},
  d: {type: INCLUSIVE},
};
const el1 = {
  a: 'sku_1',
  b: 1,
  c: 2,
  d: 'cat_1',
};
const el2 = {
  a: 'sku_2',
  b: 3,
  c: 4,
  d: 'cat_1',
};
const el3 = {
  a: 'sku_3',
  b: 5,
  c: undefined,
  d: 'cat_2',
};
const el4 = {
  a: 'sku_4',
  b: null,
  c: 0,
  d: 'cat_2',
};
const el5 = {
  a: 'sku_5',
  b: undefined,
  c: null,
  d: 'cat_2',
};

// const data = {
//   children: [{children: [el1, el2]}, {children: [el3, el4, el5]}]
// };

// const cloneData = cloneDeep(data);
// const cloneMetadata = cloneDeep(aggMetadata);

// const aggData1 = aggregateData(data, aggMetadata);
// const aggData2 = aggregateData(data, aggMetadata);

// console.log(aggData1, aggData2);
// console.log({...aggregateData});

// console.log(isEqual(aggData1, aggData2));

const calc = moize((object, metadata) =>
  Object.keys(object).reduce((totals, key) => {
    if (Array.isArray(object[key])) {
      totals[key] = object[key].map((subObject) => calc(subObject, metadata));
    } else {
      totals[key] = object[key].a + object[key].b + metadata.c;
    }

    return totals;
  }, {})
);

const data = {
  fifth: {
    a: 4,
    b: 5,
  },
  first: [
    {
      second: {
        a: 1,
        b: 2,
      },
    },
    {
      third: [
        {
          fourth: {
            a: 2,
            b: 3,
          },
        },
      ],
    },
  ],
};
const metadata = {
  c: 6,
};

const result1 = calc(data, metadata);
const result2 = calc(data, metadata);

console.log(isEqual(result1, result2));

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

memoized.update([foo, bar], 'something totally different');

console.log(memoized(foo, bar));

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

const serializeMemoized = moize.serialize(serializeMethod);

serializeMemoized({one: 1, two: 2});
serializeMemoized({one: 2, two: 1});
serializeMemoized({one: 1, two: 2});
serializeMemoized({one: 1, two: 2});

console.log(serializeMemoized.cache);
console.log(serializeMemoized.options);
console.log(serializeMemoized._microMemoizeOptions);
console.log('has serialized true', serializeMemoized.has([{one: 1, two: 2}]));
console.log('has serialized false', serializeMemoized.has([{one: 1, two: 3}]));

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
            return (
              // prettier
              <MemoizedFoo
                key={`called-${values.value}`}
                {...values}
              />
            );
          })}

          <h3>Cached values</h3>

          {array.map((values) => {
            return (
              // prettier
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

render(<App />, div);
