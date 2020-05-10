import cloneDeep from 'lodash/cloneDeep';
import moize, { Moized } from '../src';
import { createContainer } from './environment';

const container = createContainer();

function logStats(name: string, memoized: Moized) {
  console.groupCollapsed(`stats for ${name}`);

  console.log('global', cloneDeep(moize.getStats()));
  console.log(`specific to ${memoized.options.profileName}`, memoized.getStats());

  memoized.clear();
  memoized.clearStats();

  console.groupEnd();
}

async function run() {
  const { aggregate, calculate } = await import('./calculate');
  const {
    addEntry,
    cacheEntries,
    getEntry,
    hasEntry,
    standard,
    updateEntry,
    withDefaultParams,
  } = await import('./default');
  const { deepEqual } = await import('./deepEqual');
  const { maxAge } = await import('./maxAge');
  const { maxArgs } = await import('./maxArgs');
  const { bluebirdPromise, nativePromise } = await import('./promise');
  const { renderSimple } = await import('./react');
  const { serialize } = await import('./serialize');
  const { shallowEqual } = await import('./shallowEqual');
  const { transformArgs } = await import('./transformArgs');

  const useCases: [string, (container: HTMLDivElement) => void | Moized][] = [
    // default
    ['standard', standard],
    ['with default params', withDefaultParams],
    ['add new entry', addEntry],
    ['get existing entry', getEntry],
    ['has existing entry', hasEntry],
    ['update existing entry', updateEntry],
    ['keys and values', cacheEntries],

    // simple options
    ['deep equal', deepEqual],
    ['max age', maxAge],
    ['max args', maxArgs],
    ['promise (native)', nativePromise],
    ['promise (bluebird)', bluebirdPromise],
    ['react simple', renderSimple],
    ['serialize', serialize],
    ['shallow equal', shallowEqual],
    ['transform args', transformArgs],

    // complex computation
    ['aggregate', aggregate],
    ['calculate', calculate],
  ];

  useCases.forEach(([name, useCase]) => {
    console.groupCollapsed(name);

    const memoized = useCase(container);

    if (memoized) {
      if (memoized.options.isPromise) {
        new Promise((resolve) => setTimeout(resolve, 100)).then(() => logStats(name, memoized));
      } else {
        logStats(name, memoized);
      }
    }

    console.groupEnd();
  });
}

run();
