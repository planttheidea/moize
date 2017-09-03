'use strict';

const Benchmark = require('benchmark');
const Table = require('cli-table2');
const ora = require('ora');
const React = require('react');

const underscore = require('underscore').memoize;
const lodash = require('lodash').memoize;
const ramda = require('ramda').memoize;
const memoizee = require('memoizee');
const fastMemoize = require('fast-memoize');
const addyOsmani = require('./addy-osmani');
const memoizerific = require('memoizerific');
const lruMemoize = require('lru-memoize').default;
const moize = require('../lib');

const deepEquals = require('lodash').isEqual;

const showResults = (benchmarkResults) => {
  const table = new Table({
    head: ['Name', 'Ops / sec', 'Relative margin of error', 'Sample size']
  });

  benchmarkResults.forEach((result) => {
    const name = result.target.name;
    const opsPerSecond = result.target.hz.toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
    const relativeMarginOferror = `± ${result.target.stats.rme.toFixed(2)}%`;
    const sampleSize = result.target.stats.sample.length;

    table.push([name, opsPerSecond, relativeMarginOferror, sampleSize]);
  });

  console.log(table.toString()); // eslint-disable-line no-console
};

const sortDescResults = (benchmarkResults) => {
  return benchmarkResults.sort((a, b) => {
    return a.target.hz < b.target.hz ? 1 : -1;
  });
};

const spinner = ora('Running benchmark');

let results = [];

const onCycle = (event) => {
  results.push(event);
  ora(event.target.name).succeed();
};

const onComplete = () => {
  spinner.stop();

  const orderedBenchmarkResults = sortDescResults(results);

  showResults(orderedBenchmarkResults);
};

const fibonacci = (number) => {
  return number < 2 ? number : fibonacci(number - 1) + fibonacci(number - 2);
};

const fibonacciMultiplePrimitive = (number, isComplete) => {
  if (isComplete) {
    return number;
  }

  const firstValue = number - 1;
  const secondValue = number - 2;

  return (
    fibonacciMultiplePrimitive(firstValue, firstValue < 2) + fibonacciMultiplePrimitive(secondValue, secondValue < 2)
  );
};

const fibonacciMultipleObject = (number, check) => {
  if (check.isComplete) {
    return number;
  }

  const firstValue = number - 1;
  const secondValue = number - 2;

  return (
    fibonacciMultipleObject(firstValue, {
      isComplete: firstValue < 2
    }) +
    fibonacciMultipleObject(secondValue, {
      isComplete: secondValue < 2
    })
  );
};

const fibonacciMultipleDeepEqual = ({number}) => {
  return number < 2
    ? number
    : fibonacciMultipleDeepEqual({number: number - 1}) + fibonacciMultipleDeepEqual({number: number - 2});
};

const runSingleParameterSuite = () => {
  const fibonacciSuite = new Benchmark.Suite('Single parameter');
  const fibonacciNumber = 35;

  const mUnderscore = underscore(fibonacci);
  const mLodash = lodash(fibonacci);
  const mRamda = ramda(fibonacci);
  const mMemoizee = memoizee(fibonacci);
  const mFastMemoize = fastMemoize(fibonacci);
  const mAddyOsmani = addyOsmani(fibonacci);
  const mMemoizerific = memoizerific(Infinity)(fibonacci);
  const mLruMemoize = lruMemoize(Infinity)(fibonacci);
  const mMoize = moize(fibonacci);
  const mMoizeSerialize = moize.serialize(fibonacci);

  return new Promise((resolve) => {
    fibonacciSuite
      .add('underscore', () => {
        mUnderscore(fibonacciNumber);
      })
      .add('lodash', () => {
        mLodash(fibonacciNumber);
      })
      .add('memoizee', () => {
        mMemoizee(fibonacciNumber);
      })
      .add('ramda', () => {
        mRamda(fibonacciNumber);
      })
      .add('fast-memoize', () => {
        mFastMemoize(fibonacciNumber);
      })
      .add('addy-osmani', () => {
        mAddyOsmani(fibonacciNumber);
      })
      .add('memoizerific', () => {
        mMemoizerific(fibonacciNumber);
      })
      .add('lru-memoize', () => {
        mLruMemoize(fibonacciNumber);
      })
      .add('moize', () => {
        mMoize(fibonacciNumber);
      })
      .add('moize (serialized)', () => {
        mMoizeSerialize(fibonacciNumber);
      })
      .on('start', () => {
        console.log(''); // eslint-disable-line no-console
        console.log('Starting cycles for functions with a single parameter...'); // eslint-disable-line no-console

        results = [];

        spinner.start();
      })
      .on('cycle', onCycle)
      .on('complete', () => {
        onComplete();
        resolve();
      })
      .run({
        async: true
      });
  });
};

const runMultiplePrimitiveSuite = () => {
  const fibonacciSuite = new Benchmark.Suite('Multiple parameters (Primitive)');
  const fibonacciNumber = 35;
  const isComplete = false;

  const mMemoizee = memoizee(fibonacciMultiplePrimitive);
  const mFastMemoize = fastMemoize(fibonacciMultiplePrimitive);
  const mAddyOsmani = addyOsmani(fibonacciMultiplePrimitive);
  const mMemoizerific = memoizerific(Infinity)(fibonacciMultiplePrimitive);
  const mLruMemoize = lruMemoize(Infinity)(fibonacciMultiplePrimitive);
  const mMoize = moize(fibonacciMultiplePrimitive);
  const mMoizeSerialize = moize.serialize(fibonacciMultiplePrimitive);

  return new Promise((resolve) => {
    fibonacciSuite
      .add('memoizee', () => {
        mMemoizee(fibonacciNumber, isComplete);
      })
      .add('fast-memoize', () => {
        mFastMemoize(fibonacciNumber, isComplete);
      })
      .add('addy-osmani', () => {
        mAddyOsmani(fibonacciNumber, isComplete);
      })
      .add('memoizerific', () => {
        mMemoizerific(fibonacciNumber, isComplete);
      })
      .add('lru-memoize', () => {
        mLruMemoize(fibonacciNumber, isComplete);
      })
      .add('moize', () => {
        mMoize(fibonacciNumber, isComplete);
      })
      .add('moize (serialized)', () => {
        mMoizeSerialize(fibonacciNumber, isComplete);
      })
      .on('start', () => {
        console.log(''); // eslint-disable-line no-console
        console.log('Starting cycles for functions with multiple parameters that contain only primitives...'); // eslint-disable-line no-console

        results = [];

        spinner.start();
      })
      .on('cycle', onCycle)
      .on('complete', () => {
        onComplete();
        resolve();
      })
      .run({
        async: true
      });
  });
};

const runMultipleObjectSuite = () => {
  const fibonacciSuite = new Benchmark.Suite('Multiple parameters (Object)');
  const fibonacciNumber = 35;
  const isComplete = {
    isComplete: false
  };

  const mMemoizee = memoizee(fibonacciMultipleObject);
  const mFastMemoize = fastMemoize(fibonacciMultipleObject);
  const mAddyOsmani = addyOsmani(fibonacciMultipleObject);
  const mMemoizerific = memoizerific(Infinity)(fibonacciMultipleObject);
  const mLruMemoize = lruMemoize(Infinity)(fibonacciMultipleObject);
  const mMoize = moize(fibonacciMultipleObject);
  const mMoizeSerialize = moize.serialize(fibonacciMultipleObject);

  return new Promise((resolve) => {
    fibonacciSuite
      .add('memoizee', () => {
        mMemoizee(fibonacciNumber, isComplete);
      })
      .add('fast-memoize', () => {
        mFastMemoize(fibonacciNumber, isComplete);
      })
      .add('addy-osmani', () => {
        mAddyOsmani(fibonacciNumber, isComplete);
      })
      .add('memoizerific', () => {
        mMemoizerific(fibonacciNumber, isComplete);
      })
      .add('lru-memoize', () => {
        mLruMemoize(fibonacciNumber, isComplete);
      })
      .add('moize', () => {
        mMoize(fibonacciNumber, isComplete);
      })
      .add('moize (serialized)', () => {
        mMoizeSerialize(fibonacciNumber, isComplete);
      })
      .on('start', () => {
        console.log(''); // eslint-disable-line no-console
        console.log('Starting cycles for functions with multiple parameters that contain objects...'); // eslint-disable-line no-console

        results = [];

        spinner.start();
      })
      .on('cycle', onCycle)
      .on('complete', () => {
        onComplete();
        resolve();
      })
      .run({
        async: true
      });
  });
};

const runAlternativeOptionsSuite = () => {
  const fibonacciSuite = new Benchmark.Suite('Multiple parameters (Object)');
  const fibonacciNumber = {
    number: 35
  };
  const props = {
    foo: {
      foo: {
        foo: 'foo'
      }
    },
    bar: {
      bar: {
        bar: 'bar'
      }
    }
  };
  const context = {};

  const mMoizeDeep = moize(fibonacciMultipleDeepEqual, {
    equals: deepEquals
  });
  const mMoizeSerialize = moize.serialize(fibonacciMultipleDeepEqual);

  const Foo = (props) => {
    return React.createElement('div', null, JSON.stringify(props));
  };

  const mMoizeReact = moize.react(Foo);
  const mMoizeReactDeep = moize.react(Foo, {
    equals(newKey, existingKey) {
      return deepEquals(newKey[0], existingKey[0]) && deepEquals(newKey[1], existingKey[1]);
    }
  });
  const mMoizeReactOld = moize(Foo, {
    maxArgs: 2,
    serialize: true,
    serializeFunctions: true
  });

  const chooseSpecificArgs = (foo, bar, baz) => {
    return [foo, baz];
  };

  const mMoizeSpecificArgs = moize(chooseSpecificArgs, {
    transformArgs(args) {
      let index = args.length,
          newKey = [];

      while (--index) {
        newKey[index - 1] = args[index];
      }

      return newKey;
    }
  });
  const mMoizeMaxArgs = moize.maxArgs(2)((one, two, three) => {
    return [one, two, three];
  });

  const object1 = {foo: 'bar'};
  const object2 = ['foo'];

  return new Promise((resolve) => {
    fibonacciSuite
      .add('moize deep equals (lodash isEqual)', () => {
        mMoizeDeep(fibonacciNumber);
      })
      .add('moize deep equals (serialized)', () => {
        mMoizeSerialize(fibonacciNumber);
      })
      .add('moize react (v2)', () => {
        mMoizeReactOld(props, context);
      })
      .add('moize react (v3)', () => {
        mMoizeReact(props, context);
      })
      .add('moize react deep equals (lodash isEqual)', () => {
        mMoizeReactDeep(props, context);
      })
      .add('moize (transform args)', () => {
        mMoizeSpecificArgs('foo', object1, object2);
      })
      .add('moize (maximum args)', () => {
        mMoizeMaxArgs('foo', object1, object2);
      })
      .on('start', () => {
        console.log(''); // eslint-disable-line no-console
        console.log('Starting cycles for alternative cache types...'); // eslint-disable-line no-console

        results = [];

        spinner.start();
      })
      .on('cycle', onCycle)
      .on('complete', () => {
        onComplete();
        resolve();
      })
      .run({
        async: true
      });
  });
};

runAlternativeOptionsSuite();

// runSingleParameterSuite()
//   .then(runMultiplePrimitiveSuite)
//   .then(runMultipleObjectSuite)
//   .then(runAlternativeOptionsSuite);
