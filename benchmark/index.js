'use strict';

const Benchmark = require('benchmark');
const winston = require('winston');

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console()
  ]
});

logger.cli();

const underscore = require('underscore').memoize;
const lodash = require('lodash').memoize;
const ramda = require('ramda').memoize;
const memoizee = require('memoizee');
const fastMemoize = require('fast-memoize');
const addyOsmani = require('./addy-osmani');
const memoizerific = require('memoizerific');
const imemoized = require('iMemoized').memoize;
const moize = require('../lib');

const fibonacci = (number) => {
  return number < 2 ? number : fibonacci(number - 1) + fibonacci(number - 2);
};

const fibonacciMultiplePrimitive = (number, isComplete) => {
  if (isComplete) {
    return number;
  }

  const firstValue = number - 1;
  const secondValue = number - 2;

  return fibonacciMultiplePrimitive(firstValue, firstValue < 2) + fibonacciMultiplePrimitive(secondValue, secondValue < 2);
};

const fibonacciMultipleObject = (number, check) => {
  if (check.isComplete) {
    return number;
  }

  const firstValue = number - 1;
  const secondValue = number - 2;

  return fibonacciMultipleObject(firstValue, {
    isComplete: firstValue < 2
  }) + fibonacciMultipleObject(secondValue, {
    isComplete: secondValue < 2
  });
};

const runSingleParameterSuite = () => {
  const fibonacciSuite = new Benchmark.Suite();
  const fibonacciNumber = 15;

  const mUnderscore = underscore(fibonacci);
  const mLodash = lodash(fibonacci);
  const mRamda = ramda(fibonacci);
  const mMemoizee = memoizee(fibonacci);
  const mFastMemoize = fastMemoize(fibonacci);
  const mAddyOsmani = addyOsmani(fibonacci);
  const mMemoizerific = memoizerific(Infinity)(fibonacci);
  const mImemoized = imemoized(fibonacci);
  const mFutz = moize(fibonacci);

  return new Promise((resolve) => {
    fibonacciSuite
      .add('underscore', () => {
        mUnderscore(fibonacciNumber);
      })
      .add('lodash', () => {
        mLodash(fibonacciNumber);
      })
      .add('ramda', () => {
        mRamda(fibonacciNumber);
      })
      .add('memoizee', () => {
        mMemoizee(fibonacciNumber);
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
      .add('iMemoized', () => {
        mImemoized(fibonacciNumber);
      })
      .add('moize', () => {
        mFutz(fibonacciNumber);
      })
      .on('start', () => {
        logger.info('Starting cycles functions with a single parameter...');
      })
      .on('cycle', (event) => {
        const currentRunning = `${event.target}`.replace(/(.*)\ x/, (match, p1) => `\`${p1}\` x`);

        logger.info(currentRunning);
      })
      .on('complete', function() {
        logger.info(`Fastest is \`${this.filter('fastest').map('name')}\``);

        resolve();
      })
      .run({
        async: true
      });
  });
};

const runMultiplePrimitiveSuite = () => {
  const fibonacciSuite = new Benchmark.Suite();
  const fibonacciNumber = 15;

  const mMemoizee = memoizee(fibonacciMultiplePrimitive);
  const mFastMemoize = fastMemoize(fibonacciMultiplePrimitive);
  const mAddyOsmani = addyOsmani(fibonacciMultiplePrimitive);
  const mMemoizerific = memoizerific(Infinity)(fibonacciMultiplePrimitive);
  const mImemoized = imemoized(fibonacciMultiplePrimitive);
  const mFutz = moize(fibonacciMultiplePrimitive);

  return new Promise((resolve) => {
    fibonacciSuite
      .add('memoizee', () => {
        mMemoizee(fibonacciNumber, false);
      })
      .add('fast-memoize', () => {
        mFastMemoize(fibonacciNumber, false);
      })
      .add('addy-osmani', () => {
        mAddyOsmani(fibonacciNumber, false);
      })
      .add('memoizerific', () => {
        mMemoizerific(fibonacciNumber, false);
      })
      .add('iMemoized', () => {
        mImemoized(fibonacciNumber, false);
      })
      .add('moize', () => {
        mFutz(fibonacciNumber, false);
      })
      .on('start', () => {
        logger.info('Starting cycles functions with multiple parameters that contain only primitives...');
      })
      .on('cycle', (event) => {
        const currentRunning = `${event.target}`.replace(/(.*)\ x/, (match, p1) => `\`${p1}\` x`);

        logger.info(currentRunning);
      })
      .on('complete', function() {
        logger.info(`Fastest is \`${this.filter('fastest').map('name')}\``);

        resolve();
      })
      .run({
        async: true
      });
  });
};

const runMultipleObjectSuite = () => {
  const fibonacciSuite = new Benchmark.Suite();
  const fibonacciNumber = 15;

  const mMemoizee = memoizee(fibonacciMultipleObject);
  const mFastMemoize = fastMemoize(fibonacciMultipleObject);
  const mAddyOsmani = addyOsmani(fibonacciMultipleObject);
  const mMemoizerific = memoizerific(Infinity)(fibonacciMultipleObject);
  const mImemoized = imemoized(fibonacciMultipleObject);
  const mFutz = moize(fibonacciMultipleObject);

  return new Promise((resolve) => {
    fibonacciSuite
      .add('memoizee', () => {
        mMemoizee(fibonacciNumber, {
          isComplete: false
        });
      })
      .add('fast-memoize', () => {
        mFastMemoize(fibonacciNumber, {
          isComplete: false
        });
      })
      .add('addy-osmani', () => {
        mAddyOsmani(fibonacciNumber, {
          isComplete: false
        });
      })
      .add('memoizerific', () => {
        mMemoizerific(fibonacciNumber, {
          isComplete: false
        });
      })
      .add('iMemoized', () => {
        mImemoized(fibonacciNumber, {
          isComplete: false
        });
      })
      .add('moize', () => {
        mFutz(fibonacciNumber, {
          isComplete: false
        });
      })
      .on('start', () => {
        logger.info('Starting cycles for functions with multiple parameters that contain objects...');
      })
      .on('cycle', (event) => {
        const currentRunning = `${event.target}`.replace(/(.*)\ x/, (match, p1) => `\`${p1}\` x`);

        logger.info(currentRunning);
      })
      .on('complete', function() {
        logger.info(`Fastest is \`${this.filter('fastest').map('name')}\``);

        resolve();
      })
      .run({
        async: true
      });
  });
};

runSingleParameterSuite()
  .then(runMultiplePrimitiveSuite)
  .then(runMultipleObjectSuite);