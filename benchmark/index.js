const _ = require('lodash');
// const fs = require("fs");
const React = require('react');

const { createSuite } = require('benchee');
const Table = require('cli-table2');

const resolveArguments = function resolveArguments() {
  if (arguments.length > 1) {
    return JSON.stringify(arguments);
  }

  return typeof arguments[0] === 'object' ? JSON.stringify(arguments[0]) : arguments[0];
};

const getResults = (results) => {
  const table = new Table({
    head: ['Name', 'Ops / sec'],
  });

  results.forEach(({ name, stats }) => {
    table.push([name, stats.ops.toLocaleString()]);
  });

  return table.toString();
};

const fastMemoize = require('fast-memoize');

const lodash = _.memoize;
const lruMemoize = require('lru-memoize').default;
const mem = require('mem');
const memoizee = require('memoizee');
const memoizerific = require('memoizerific');
const ramda = require('ramda').memoizeWith(resolveArguments);
const underscore = require('underscore').memoize;

const moize = require('../dist/moize.cjs');
const addyOsmani = require('./addy-osmani');

const deepEqualFastEquals = require('fast-equals').deepEqual;

const deepEqualLodash = _.isEqual;

/** *********** tests ************ */

const fibonacciSinglePrimitive = number => (number < 2 ? number : fibonacciSinglePrimitive(number - 1) + fibonacciSinglePrimitive(number - 2));

const fibonacciSingleArray = array => (array[0] < 2
  ? array[0]
  : fibonacciSingleArray([array[0] - 1]) + fibonacciSingleArray([array[0] - 2]));

const fibonacciSingleObject = object => (object.number < 2
  ? object.number
  : fibonacciSingleObject({ number: object.number - 1 })
      + fibonacciSingleObject({ number: object.number - 2 }));

const fibonacciMultiplePrimitive = (number, isComplete) => {
  if (isComplete) {
    return number;
  }

  const firstValue = number - 1;
  const secondValue = number - 2;

  return (
    fibonacciMultiplePrimitive(firstValue, firstValue < 2)
    + fibonacciMultiplePrimitive(secondValue, secondValue < 2)
  );
};

const fibonacciMultipleArray = (array, check) => {
  if (check[0]) {
    return array[0];
  }

  const firstValue = array[0] - 1;
  const secondValue = array[0] - 2;

  return (
    fibonacciMultipleArray([firstValue], [firstValue < 2])
    + fibonacciMultipleArray([secondValue], [secondValue < 2])
  );
};

const fibonacciMultipleObject = (object, check) => {
  if (check.isComplete) {
    return object.number;
  }

  const firstValue = object.number - 1;
  const secondValue = object.number - 2;

  return (
    fibonacciMultipleObject({ number: firstValue }, { isComplete: firstValue < 2 })
    + fibonacciMultipleObject({ number: secondValue }, { isComplete: secondValue < 2 })
  );
};

/** *********** benchmarks ************ */

const singularPrimitive = {
  'addy osmani': addyOsmani(fibonacciSinglePrimitive),
  'fast-memoize': fastMemoize(fibonacciSinglePrimitive),
  lodash: lodash(fibonacciSinglePrimitive),
  'lru-memoize': lruMemoize(1)(fibonacciSinglePrimitive),
  mem: mem(fibonacciSinglePrimitive),
  memoizee: memoizee(fibonacciSinglePrimitive),
  memoizerific: memoizerific(1)(fibonacciSinglePrimitive),
  moize: moize(fibonacciSinglePrimitive),
  ramda: ramda(fibonacciSinglePrimitive),
  underscore: underscore(fibonacciSinglePrimitive),
};

const singularArray = {
  'addy osmani': addyOsmani(fibonacciSingleArray),
  'fast-memoize': fastMemoize(fibonacciSingleArray),
  lodash: lodash(fibonacciSingleArray),
  'lru-memoize': lruMemoize(1)(fibonacciSingleArray),
  mem: mem(fibonacciSingleArray),
  memoizee: memoizee(fibonacciSingleArray),
  memoizerific: memoizerific(1)(fibonacciSingleArray),
  moize: moize(fibonacciSingleArray),
  ramda: ramda(fibonacciSingleArray),
  underscore: underscore(fibonacciSingleArray, resolveArguments),
};

const singularObject = {
  'addy osmani': addyOsmani(fibonacciSingleObject),
  'fast-memoize': fastMemoize(fibonacciSingleObject),
  lodash: lodash(fibonacciSingleObject),
  'lru-memoize': lruMemoize(1)(fibonacciSingleObject),
  mem: mem(fibonacciSingleObject),
  memoizee: memoizee(fibonacciSingleObject),
  memoizerific: memoizerific(1)(fibonacciSingleObject),
  moize: moize(fibonacciSingleObject),
  ramda: ramda(fibonacciSingleObject),
  underscore: underscore(fibonacciSingleObject, resolveArguments),
};

const multiplePrimitive = {
  'addy osmani': addyOsmani(fibonacciMultiplePrimitive),
  'fast-memoize': fastMemoize(fibonacciMultiplePrimitive),
  lodash: lodash(fibonacciMultiplePrimitive, resolveArguments),
  'lru-memoize': lruMemoize(1)(fibonacciMultiplePrimitive),
  mem: mem(fibonacciMultiplePrimitive),
  memoizee: memoizee(fibonacciMultiplePrimitive),
  memoizerific: memoizerific(1)(fibonacciMultiplePrimitive),
  moize: moize(fibonacciMultiplePrimitive),
  ramda: ramda(fibonacciMultiplePrimitive),
  underscore: underscore(fibonacciMultiplePrimitive, resolveArguments),
};

const multipleArray = {
  'addy osmani': addyOsmani(fibonacciMultipleArray),
  'fast-memoize': fastMemoize(fibonacciMultipleArray),
  lodash: lodash(fibonacciMultipleArray, resolveArguments),
  'lru-memoize': lruMemoize(1)(fibonacciMultipleArray),
  mem: mem(fibonacciMultipleArray),
  memoizee: memoizee(fibonacciMultipleArray),
  memoizerific: memoizerific(1)(fibonacciMultipleArray),
  moize: moize(fibonacciMultipleArray),
  ramda: ramda(fibonacciMultipleArray),
  underscore: underscore(fibonacciMultipleArray, resolveArguments),
};

const multipleObject = {
  'addy osmani': addyOsmani(fibonacciMultipleObject),
  'fast-memoize': fastMemoize(fibonacciMultipleObject),
  lodash: lodash(fibonacciMultipleObject, resolveArguments),
  'lru-memoize': lruMemoize(1)(fibonacciMultipleObject),
  mem: mem(fibonacciMultipleObject),
  memoizee: memoizee(fibonacciMultipleObject),
  memoizerific: memoizerific(1)(fibonacciMultipleObject),
  moize: moize(fibonacciMultipleObject),
  ramda: ramda(fibonacciMultipleObject),
  underscore: underscore(fibonacciMultipleObject, resolveArguments),
};

const number = 25;
const arrayNumber = [number];
const objectNumber = { number };

const isComplete = false;
const arrayIsComplete = [isComplete];
const objectIsComplete = { isComplete };

const suite = createSuite({
  minTime: 1000,
  onComplete(results) {
    const combinedResults = Object.keys(results)
      .reduce((combined, group) => {
        const groupResults = results[group];

        return groupResults.map(({ name, stats }) => {
          const existingRowIndex = combined.findIndex(({ name: rowName }) => name === rowName);

          if (~existingRowIndex) {
            // eslint-disable-next-line no-return-assign
            return {
              ...combined[existingRowIndex],
              stats: {
                // eslint-disable-next-line no-param-reassign
                elapsed: (combined[existingRowIndex].stats.elapsed += stats.elapsed),
                // eslint-disable-next-line no-param-reassign
                iterations: (combined[existingRowIndex].stats.iterations += stats.iterations),
              },
            };
          }

          return {
            name,
            stats: {
              elapsed: stats.elapsed,
              iterations: stats.iterations,
            },
          };
        });
      }, [])
      .map(({ name, stats }) => ({
        name,
        stats: {
          ...stats,
          ops: stats.iterations / stats.elapsed,
        },
      }))
      .sort((a, b) => {
        if (a.stats.ops > b.stats.ops) {
          return -1;
        }

        if (a.stats.ops < b.stats.ops) {
          return 1;
        }

        return 0;
      });

    console.log('');
    console.log('Benchmark results complete, overall averages:');
    console.log('');
    console.log(getResults(combinedResults));
    console.log('');
  },
  onGroupComplete({ group, results }) {
    console.log('');
    console.log(`...finished group ${group}.`);
    console.log('');
    console.log(getResults(results));
    console.log('');
  },
  onGroupStart(group) {
    console.log('');
    console.log(`Starting benchmarks for group ${group}...`);
    console.log('');
  },
  onResult({ name, stats }) {
    console.log(`Benchmark completed for ${name}: ${stats.ops.toLocaleString()} ops/sec`);
  },
});

Object.keys(singularPrimitive).forEach((name) => {
  const fn = singularPrimitive[name];

  suite.add(name, 'singular primitive', () => {
    fn(number);
  });
});

Object.keys(singularArray).forEach((name) => {
  const fn = singularArray[name];

  suite.add(name, 'singular array', () => {
    fn(arrayNumber);
  });
});

Object.keys(singularObject).forEach((name) => {
  const fn = singularObject[name];

  suite.add(name, 'singular object', () => {
    fn(objectNumber);
  });
});

Object.keys(multiplePrimitive).forEach((name) => {
  const fn = multiplePrimitive[name];

  suite.add(name, 'multiple primitive', () => {
    fn(number, isComplete);
  });
});

Object.keys(multipleArray).forEach((name) => {
  const fn = multipleArray[name];

  suite.add(name, 'multiple array', () => {
    fn(arrayNumber, arrayIsComplete);
  });
});

Object.keys(multipleObject).forEach((name) => {
  const fn = multipleObject[name];

  suite.add(name, 'multiple object', () => {
    fn(objectNumber, objectIsComplete);
  });
});

suite.run();
