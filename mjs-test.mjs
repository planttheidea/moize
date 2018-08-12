import moize from './mjs';

moize.collectStats();

const memoized = moize((a, b) => a + b, {profileName: 'memoized'});

const result = new Array(10).fill(null).map(() => memoized(1, 2));

console.log(result);
console.log(memoized.getStats());
