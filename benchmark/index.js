/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';

const _ = require('lodash');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const React = require('react');
const { render } = require('react-dom');

const Benchmark = require('benchmark');
const Table = require('cli-table2');
const ora = require('ora');

const addyOsmani = require('./addy-osmani');
const fastMemoize = require('fast-memoize');
const lodash = _.memoize;
const lruMemoize = require('lru-memoize').default;
const mem = require('mem');
const memoizee = require('memoizee');
const memoizerific = require('memoizerific');
const moize = require('../dist/moize.cjs');
const ramda = require('ramda').memoizeWith;
const underscore = require('underscore').memoize;

const deepEquals = _.isEqual;

const resolveSingleArgument = function (arg) {
    return arg;
};

const resolveMultipleArguments = function () {
    return JSON.stringify(arguments);
};

const showResults = (benchmarkResults) => {
    const table = new Table({
        head: ['Name', 'Ops / sec', 'Relative margin of error', 'Sample size'],
    });

    benchmarkResults.forEach((result) => {
        const name = result.target.name;
        const opsPerSecond = result.target.hz.toLocaleString('en-US', {
            maximumFractionDigits: 0,
        });
        const relativeMarginOferror = `± ${result.target.stats.rme.toFixed(
            2
        )}%`;
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

const csvResults = {};

let cliResults = [];

const onCycle = (event) => {
    cliResults.push(event);

    const { currentTarget, target } = event;

    if (!csvResults[currentTarget.name]) {
        csvResults[currentTarget.name] = {};
    }

    csvResults[currentTarget.name][target.name] = ~~event.target.hz;

    ora(target.name).succeed();
};

const onComplete = () => {
    spinner.stop();

    const orderedBenchmarkResults = sortDescResults(cliResults);

    showResults(orderedBenchmarkResults);
};

const fibonacciSinglePrimitive = (number) => {
    return number < 2
        ? number
        : fibonacciSinglePrimitive(number - 1) +
              fibonacciSinglePrimitive(number - 2);
};

const fibonacciSingleArray = (array) => {
    return array[0] < 2
        ? array[0]
        : fibonacciSingleArray([array[0] - 1]) +
              fibonacciSingleArray([array[0] - 2]);
};
const fibonacciSingleObject = (object) => {
    return object.number < 2
        ? object.number
        : fibonacciSingleObject({ number: object.number - 1 }) +
              fibonacciSingleObject({ number: object.number - 2 });
};

const fibonacciMultiplePrimitive = (number, isComplete) => {
    if (isComplete) {
        return number;
    }

    const firstValue = number - 1;
    const secondValue = number - 2;

    return (
        fibonacciMultiplePrimitive(firstValue, firstValue < 2) +
        fibonacciMultiplePrimitive(secondValue, secondValue < 2)
    );
};

const fibonacciMultipleArray = (array, check) => {
    if (check[0]) {
        return array[0];
    }

    const firstValue = array[0] - 1;
    const secondValue = array[0] - 2;

    return (
        fibonacciMultipleArray([firstValue], [firstValue < 2]) +
        fibonacciMultipleArray([secondValue], [secondValue < 2])
    );
};

const fibonacciMultipleObject = (object, check) => {
    if (check.isComplete) {
        return object.number;
    }

    const firstValue = object.number - 1;
    const secondValue = object.number - 2;

    return (
        fibonacciMultipleObject(
            { number: firstValue },
            { isComplete: firstValue < 2 }
        ) +
        fibonacciMultipleObject(
            { number: secondValue },
            { isComplete: secondValue < 2 }
        )
    );
};

const fibonacciMultipleDeepEqual = ({ number }) => {
    return number < 2
        ? number
        : fibonacciMultipleDeepEqual({ number: number - 1 }) +
              fibonacciMultipleDeepEqual({ number: number - 2 });
};

const getSuiteOptions = (name, resolve) => {
    return {
        name,
        onComplete() {
            onComplete();
            resolve();
        },
        onCycle,
        onStart() {
            console.log(''); // eslint-disable-line no-console
            console.log(`Starting cycles for ${name}...`); // eslint-disable-line no-console

            cliResults = [];

            spinner.start();
        },
        queued: true,
    };
};

const runSinglePrimitiveSuite = () => {
    // const fibonacciSuite = new Benchmark.Suite('Single parameter (primitive)');
    const fibonacciNumber = 35;

    const mAddyOsmani = addyOsmani(fibonacciSinglePrimitive);
    const mFastMemoize = fastMemoize(fibonacciSinglePrimitive);
    const mLodash = lodash(fibonacciSinglePrimitive);
    const mLruMemoize = lruMemoize(Infinity)(fibonacciSinglePrimitive);
    const mMem = mem(fibonacciSinglePrimitive);
    const mMemoizee = memoizee(fibonacciSinglePrimitive);
    const mMemoizerific = memoizerific(Infinity)(fibonacciSinglePrimitive);
    const mMoize = moize(fibonacciSinglePrimitive);
    const mRamda = ramda(resolveSingleArgument, fibonacciSinglePrimitive);
    const mUnderscore = underscore(fibonacciSinglePrimitive);

    return new Promise((resolve) => {
        new Benchmark.Suite(
            getSuiteOptions('single primitive parameter', resolve)
        )
            .add('addy-osmani', () => {
                mAddyOsmani(fibonacciNumber);
            })
            .add('fast-memoize', () => {
                mFastMemoize(fibonacciNumber);
            })
            .add('lodash', () => {
                mLodash(fibonacciNumber);
            })
            .add('lru-memoize', () => {
                mLruMemoize(fibonacciNumber);
            })
            .add('mem', () => {
                mMem(fibonacciNumber);
            })
            .add('memoizee', () => {
                mMemoizee(fibonacciNumber);
            })
            .add('memoizerific', () => {
                mMemoizerific(fibonacciNumber);
            })
            .add('moize', () => {
                mMoize(fibonacciNumber);
            })
            .add('ramda', () => {
                mRamda(fibonacciNumber);
            })
            .add('underscore', () => {
                mUnderscore(fibonacciNumber);
            })
            .run({ async: true });
    });
};

const runSingleArraySuite = () => {
    const fibonacciNumber = [35];

    const mAddyOsmani = addyOsmani(fibonacciSingleArray);
    const mFastMemoize = fastMemoize(fibonacciSingleArray);
    const mLodash = lodash(fibonacciSingleArray);
    const mLruMemoize = lruMemoize(Infinity)(fibonacciSingleArray);
    const mMem = mem(fibonacciSingleArray);
    const mMemoizee = memoizee(fibonacciSingleArray);
    const mMemoizerific = memoizerific(Infinity)(fibonacciSingleArray);
    const mMoize = moize(fibonacciSingleArray);
    const mRamda = ramda(resolveSingleArgument, fibonacciSingleArray);
    const mUnderscore = underscore(fibonacciSingleArray);

    return new Promise((resolve) => {
        new Benchmark.Suite(getSuiteOptions('single array parameter', resolve))
            .add('addy-osmani', () => {
                mAddyOsmani(fibonacciNumber);
            })
            .add('fast-memoize', () => {
                mFastMemoize(fibonacciNumber);
            })
            .add('lodash', () => {
                mLodash(fibonacciNumber);
            })
            .add('lru-memoize', () => {
                mLruMemoize(fibonacciNumber);
            })
            .add('mem', () => {
                mMem(fibonacciNumber);
            })
            .add('memoizee', () => {
                mMemoizee(fibonacciNumber);
            })
            .add('memoizerific', () => {
                mMemoizerific(fibonacciNumber);
            })
            .add('moize', () => {
                mMoize(fibonacciNumber);
            })
            .add('ramda', () => {
                mRamda(fibonacciNumber);
            })
            .add('underscore', () => {
                mUnderscore(fibonacciNumber);
            })
            .run({
                async: true,
                queued: true,
            });
    });
};

const runSingleObjectSuite = () => {
    const fibonacciNumber = {
        number: 35,
    };

    const mAddyOsmani = addyOsmani(fibonacciSingleObject);
    const mFastMemoize = fastMemoize(fibonacciSingleObject);
    const mLodash = lodash(fibonacciSingleObject);
    const mLruMemoize = lruMemoize(Infinity)(fibonacciSingleObject);
    const mMem = mem(fibonacciSingleObject);
    const mMemoizee = memoizee(fibonacciSingleObject);
    const mMemoizerific = memoizerific(Infinity)(fibonacciSingleObject);
    const mMoize = moize(fibonacciSingleObject);
    const mRamda = ramda(resolveSingleArgument, fibonacciSingleObject);
    const mUnderscore = underscore(fibonacciSingleObject);

    return new Promise((resolve) => {
        new Benchmark.Suite(getSuiteOptions('single object parameter', resolve))
            .add('addy-osmani', () => {
                mAddyOsmani(fibonacciNumber);
            })
            .add('fast-memoize', () => {
                mFastMemoize(fibonacciNumber);
            })
            .add('lodash', () => {
                mLodash(fibonacciNumber);
            })
            .add('lru-memoize', () => {
                mLruMemoize(fibonacciNumber);
            })
            .add('mem', () => {
                mMem(fibonacciNumber);
            })
            .add('memoizee', () => {
                mMemoizee(fibonacciNumber);
            })
            .add('memoizerific', () => {
                mMemoizerific(fibonacciNumber);
            })
            .add('moize', () => {
                mMoize(fibonacciNumber);
            })
            .add('ramda', () => {
                mRamda(fibonacciNumber);
            })
            .add('underscore', () => {
                mUnderscore(fibonacciNumber);
            })
            .run({
                async: true,
                queued: true,
            });
    });
};

const runMultiplePrimitiveSuite = () => {
    const fibonacciNumber = 35;
    const isComplete = false;

    const mAddyOsmani = addyOsmani(fibonacciMultiplePrimitive);
    const mFastMemoize = fastMemoize(fibonacciMultiplePrimitive);
    const mLodash = lodash(
        fibonacciMultiplePrimitive,
        resolveMultipleArguments
    );
    const mLruMemoize = lruMemoize(Infinity)(fibonacciMultiplePrimitive);
    const mMem = mem(fibonacciMultiplePrimitive, {
        cacheKey: resolveMultipleArguments,
    });
    const mMemoizee = memoizee(fibonacciMultiplePrimitive);
    const mMemoizerific = memoizerific(Infinity)(fibonacciMultiplePrimitive);
    const mMoize = moize(fibonacciMultiplePrimitive);
    const mRamda = ramda(resolveMultipleArguments, fibonacciMultiplePrimitive);
    const mUnderscore = underscore(
        fibonacciMultiplePrimitive,
        resolveMultipleArguments
    );

    return new Promise((resolve) => {
        new Benchmark.Suite(
            getSuiteOptions('multiple primitive parameters', resolve)
        )
            .add('addy-osmani', () => {
                mAddyOsmani(fibonacciNumber, isComplete);
            })
            .add('fast-memoize', () => {
                mFastMemoize(fibonacciNumber, isComplete);
            })
            .add('lodash', () => {
                mLodash(fibonacciNumber, isComplete);
            })
            .add('lru-memoize', () => {
                mLruMemoize(fibonacciNumber, isComplete);
            })
            .add('mem', () => {
                mMem(fibonacciNumber, isComplete);
            })
            .add('memoizee', () => {
                mMemoizee(fibonacciNumber, isComplete);
            })
            .add('memoizerific', () => {
                mMemoizerific(fibonacciNumber, isComplete);
            })
            .add('moize', () => {
                mMoize(fibonacciNumber, isComplete);
            })
            .add('ramda', () => {
                mRamda(fibonacciNumber, isComplete);
            })
            .add('underscore', () => {
                mUnderscore(fibonacciNumber, isComplete);
            })
            .run({
                async: true,
                queued: true,
            });
    });
};

const runMultipleArraySuite = () => {
    const fibonacciNumber = [35];
    const isComplete = [false];

    const mAddyOsmani = addyOsmani(fibonacciMultipleArray);
    const mFastMemoize = fastMemoize(fibonacciMultipleArray);
    const mLodash = lodash(fibonacciMultipleArray, resolveMultipleArguments);
    const mLruMemoize = lruMemoize(Infinity)(fibonacciMultipleArray);
    const mMem = mem(fibonacciMultipleArray, {
        cacheKey: resolveMultipleArguments,
    });
    const mMemoizee = memoizee(fibonacciMultipleArray);
    const mMemoizerific = memoizerific(Infinity)(fibonacciMultipleArray);
    const mMoize = moize(fibonacciMultipleArray);
    const mRamda = ramda(resolveMultipleArguments, fibonacciMultipleArray);
    const mUnderscore = underscore(
        fibonacciMultipleArray,
        resolveMultipleArguments
    );

    return new Promise((resolve) => {
        new Benchmark.Suite(
            getSuiteOptions('multiple array parameters', resolve)
        )
            .add('addy-osmani', () => {
                mAddyOsmani(fibonacciNumber, isComplete);
            })
            .add('fast-memoize', () => {
                mFastMemoize(fibonacciNumber, isComplete);
            })
            .add('lodash', () => {
                mLodash(fibonacciNumber, isComplete);
            })
            .add('lru-memoize', () => {
                mLruMemoize(fibonacciNumber, isComplete);
            })
            .add('mem', () => {
                mMem(fibonacciNumber, isComplete);
            })
            .add('memoizee', () => {
                mMemoizee(fibonacciNumber, isComplete);
            })
            .add('memoizerific', () => {
                mMemoizerific(fibonacciNumber, isComplete);
            })
            .add('moize', () => {
                mMoize(fibonacciNumber, isComplete);
            })
            .add('ramda', () => {
                mRamda(fibonacciNumber, isComplete);
            })
            .add('underscore', () => {
                mUnderscore(fibonacciNumber, isComplete);
            })
            .run({
                async: true,
                queued: true,
            });
    });
};

const runMultipleObjectSuite = () => {
    const fibonacciNumber = { number: 35 };
    const isComplete = { isComplete: false };

    const mAddyOsmani = addyOsmani(fibonacciMultipleObject);
    const mFastMemoize = fastMemoize(fibonacciMultipleObject);
    const mLodash = lodash(fibonacciMultipleObject, resolveMultipleArguments);
    const mLruMemoize = lruMemoize(Infinity)(fibonacciMultipleObject);
    const mMem = mem(fibonacciMultipleObject, {
        cacheKey: resolveMultipleArguments,
    });
    const mMemoizee = memoizee(fibonacciMultipleObject);
    const mMemoizerific = memoizerific(Infinity)(fibonacciMultipleObject);
    const mMoize = moize(fibonacciMultipleObject);
    const mRamda = ramda(resolveMultipleArguments, fibonacciMultipleObject);
    const mUnderscore = underscore(
        fibonacciMultipleObject,
        resolveMultipleArguments
    );

    return new Promise((resolve) => {
        new Benchmark.Suite(
            getSuiteOptions('multiple object parameters', resolve)
        )
            .add('addy-osmani', () => {
                mAddyOsmani(fibonacciNumber, isComplete);
            })
            .add('fast-memoize', () => {
                mFastMemoize(fibonacciNumber, isComplete);
            })
            .add('lodash', () => {
                mLodash(fibonacciNumber, isComplete);
            })
            .add('lru-memoize', () => {
                mLruMemoize(fibonacciNumber, isComplete);
            })
            .add('mem', () => {
                mMem(fibonacciNumber, isComplete);
            })
            .add('memoizee', () => {
                mMemoizee(fibonacciNumber, isComplete);
            })
            .add('memoizerific', () => {
                mMemoizerific(fibonacciNumber, isComplete);
            })
            .add('moize', () => {
                mMoize(fibonacciNumber, isComplete);
            })
            .add('ramda', () => {
                mRamda(fibonacciNumber, isComplete);
            })
            .add('underscore', () => {
                mUnderscore(fibonacciNumber, isComplete);
            })
            .run({
                async: true,
                queued: true,
            });
    });
};

const runReactSuite = async () => {
    const props = {
        foo: {
            foo: {
                foo: 'foo',
            },
        },
        bar: {
            bar: {
                bar: 'bar',
            },
        },
    };

    const Foo = (props) => {
        return React.createElement('div', props);
    };

    Foo.defaultProps = {};

    const { window } = await new JSDOM('<div id="app"></div>', {
        contentType: 'text/html',
        url: 'http://www.example.com',
    });

    global.window = window;

    const div = window.document.getElementById('app');

    render(React.createElement(Foo, {}), div);

    const MoizedReact = moize.react(Foo);
    const MoizedReactDeep = moize.react(Foo, { isDeepEqual: true });
    const MoizedReactLodashDeep = moize.react(Foo, { matchesArg: deepEquals });

    return new Promise((resolve) => {
        new Benchmark.Suite('React', getSuiteOptions('react', resolve))
            .add('standard react (as reference)', () => {
                render(
                    React.createElement(Foo, {
                        foo: props.foo,
                        bar: props.bar,
                    }),
                    div
                );
            })
            .add('moize react', () => {
                render(
                    React.createElement(MoizedReact, {
                        foo: props.foo,
                        bar: props.bar,
                    }),
                    div
                );
            })
            .add('moize react deep equals', () => {
                render(
                    React.createElement(MoizedReactDeep, {
                        foo: {
                            foo: {
                                foo: 'foo',
                            },
                        },
                        bar: {
                            bar: {
                                bar: 'bar',
                            },
                        },
                    }),
                    div
                );
            })
            .add('moize react deep equals (lodash isEqual)', () => {
                render(
                    React.createElement(MoizedReactLodashDeep, {
                        foo: {
                            foo: {
                                foo: 'foo',
                            },
                        },
                        bar: {
                            bar: {
                                bar: 'bar',
                            },
                        },
                    }),
                    div
                );
            })
            .run({
                async: true,
            });
    });
};

const runAlternativeOptionsSuite = async () => {
    const mMoizeDeep = moize.deep(fibonacciMultipleDeepEqual);
    const mMoizeLodashDeep = moize.matchesArg(deepEquals)(
        fibonacciMultipleDeepEqual
    );
    const mMoizeSerialize = moize.serialize(fibonacciMultipleDeepEqual);

    const chooseSpecificArgs = (foo, bar, baz) => {
        return [foo, baz];
    };

    const mMoizeSpecificArgs = moize(chooseSpecificArgs, {
        transformArgs(args) {
            const newKey = [];
            let index = args.length;

            while (--index) {
                newKey[index - 1] = args[index];
            }

            return newKey;
        },
    });
    const mMoizeMaxArgs = moize.maxArgs(2)((one, two, three) => {
        return [one, two, three];
    });

    const object1 = { foo: 'bar' };
    const object2 = ['foo'];

    return new Promise((resolve) => {
        new Benchmark.Suite(
            'Alternative options',
            getSuiteOptions('alternative options', resolve)
        )
            .add('moize serialized', () => {
                mMoizeSerialize({ number: 35 });
            })
            .add('moize deep equals', () => {
                mMoizeDeep({ number: 35 });
            })
            .add('moize deep equals (lodash isEqual)', () => {
                mMoizeLodashDeep({ number: 35 });
            })
            .add('moize transform args', () => {
                mMoizeSpecificArgs('foo', object1, object2);
            })
            .add('moize maximum args', () => {
                mMoizeMaxArgs('foo', object1, object2);
            })
            .run({
                async: true,
            });
    });
};

const writeCsv = () => {
    const invidualResultsHeaders = [
        'Name',
        'Overall (average)',
        'Single (average)',
        'Multiple (average)',
    ];

    const individualTableMap = Object.keys(csvResults).reduce((rows, key) => {
        const header = key.replace(/ (parameters|parameter)/, '');

        if (!~invidualResultsHeaders.indexOf(header)) {
            invidualResultsHeaders.push(header);
        }

        return Object.keys(csvResults[key]).reduce((values, library) => {
            if (!rows[library]) {
                rows[library] = {};
            }

            rows[library][header] = csvResults[key][library];

            return rows;
        }, rows);
    }, {});

    const averages = Object.keys(individualTableMap).reduce((rows, library) => {
        if (!rows[library]) {
            rows[library] = {};
        }

        const libraryAverages = Object.keys(individualTableMap[library]).reduce(
            ({ multiple, single }, header) => {
                if (~header.indexOf('multiple')) {
                    multiple.length++;
                    multiple.total += ~~individualTableMap[library][header];
                } else {
                    single.length++;
                    single.total += ~~individualTableMap[library][header];
                }

                return {
                    multiple,
                    single,
                };
            },
            {
                multiple: {
                    length: 0,
                    total: 0,
                },
                single: {
                    length: 0,
                    total: 0,
                },
            }
        );

        rows[library] = {
            multiple: libraryAverages.multiple.length
                ? ~~(
                      libraryAverages.multiple.total /
                      libraryAverages.multiple.length
                  )
                : 0,
            overall: libraryAverages.multiple.length
                ? ~~(
                      (libraryAverages.multiple.total +
                          libraryAverages.single.total) /
                      (libraryAverages.multiple.length +
                          libraryAverages.single.length)
                  )
                : 0,
            single: libraryAverages.single.length
                ? ~~(
                      libraryAverages.single.total /
                      libraryAverages.single.length
                  )
                : 0,
        };

        return rows;
    }, {});

    const individualRows = _.orderBy(
        Object.keys(individualTableMap).map((key) => {
            const values = invidualResultsHeaders.slice(4).map((header) => {
                return individualTableMap[key][header];
            });

            return [
                key,
                averages[key].overall,
                averages[key].single,
                averages[key].multiple,
            ].concat(values);
        }),
        [1, 2],
        ['desc', 'desc']
    );

    const individualCsvText = `${invidualResultsHeaders
        .map((header) => {
            return `"${header}"`;
        })
        .join(',')}\n${individualRows
        .map((row) => {
            return row
                .map((value) => {
                    return value ? `"${value.toLocaleString()}"` : '"N/A"';
                })
                .join(',');
        })
        .join('\n')}`;

    // write to file
    if (fs && fs.writeFileSync) {
        fs.writeFileSync(
            'benchmark/benchmark_results.csv',
            individualCsvText,
            'utf8'
        );

        console.log('Benchmarks done! Results saved to benchmark_results.csv');
    } else {
        console.log('Benchmarks done!');
    }
};

function runBenchmark() {
    const { BENCHMARK_SUITE } = process.env;

    if (BENCHMARK_SUITE) {
        switch (BENCHMARK_SUITE) {
            case 'primitive':
                return runSinglePrimitiveSuite().then(
                    runMultiplePrimitiveSuite
                );

            case 'array':
                return runSingleArraySuite().then(runMultipleArraySuite);

            case 'object':
                return runSingleObjectSuite().then(runMultipleObjectSuite);

            case 'react':
                return runReactSuite();

            case 'alternative':
                return runAlternativeOptionsSuite();

            default:
                throw new Error(
                    `Suite ${BENCHMARK_SUITE} not found. Available options: ` +
                        'primitive, array, object, react, alternative'
                );
        }
    }

    return Promise.resolve()
        .then(runSinglePrimitiveSuite)
        .then(runSingleArraySuite)
        .then(runSingleObjectSuite)
        .then(runMultiplePrimitiveSuite)
        .then(runMultipleArraySuite)
        .then(runMultipleObjectSuite)
        .then(writeCsv)
        .then(runReactSuite)
        .then(runAlternativeOptionsSuite);
}

runBenchmark();
