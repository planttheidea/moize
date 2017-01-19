# moize

<img src="https://img.shields.io/badge/build-passing-brightgreen.svg"/>
<img src="https://img.shields.io/badge/coverage-97.28%25-brightgreen.svg"/>
<img src="https://img.shields.io/badge/license-MIT-blue.svg"/>

`moize` is a blazing fast implementation of memoization in JavaScript that supports all types of arguments, while offering flexibility in its implementation. It has no dependencies, and is less than 2kb when minified and gzipped.

### Table of contents
* [Installation](#installation)
* [Usage](#usage)
* [Advanced usage](#advanced-usage)
* [Direct cache manipulation](#direct-cache-manipulation)
* [Benchmarks](#benchmarks)
* [Browser support](#browser-support)
* [Development](#development)

### Installation

```
$ npm i moize --save
```

### Usage

```javascript
import moize from 'moize';

const method = (a, b) => {
  return a + b;
};

const memoized = moize(method);

memoized(2, 4); // 6
memoized(2, 4); // 6, pulled from cache
```

All parameter types are supported, including circular objects, functions, etc. You can even memoize functional `React` components based on their `props` + `context` combination!

### Advanced usage

`moize` also accepts an object of options as the second parameter. The full shape of these options:

```javascript
{
  cache: Map|Object, // custom cache implementation
  isPromise: boolean, // is the result a promise
  maxAge: number, // amount of time in milliseconds before the cache will expire
  maxArgs: number, // maximum number of arguments to use as key for caching
  maxSize: number, // maximum size of cache for this method
  serializeFunctions: boolean, // should functions be included in the serialization of multiple parameters
  serializer: Function // method to serialize the arguments to build a unique cache key
}
```

**cache** *defaults to new Map()*

The default cache implementation is highly performant, however if you would like then you can pass in a custom cache implementation. The only requirements for the cache implementation is that it matches the relevant `Map` API methods:
* delete
* get
* has
* set

If you want to have direct cache management using `moize`, the following methods must also be provided:
* clear
* forEach

```javascript
const cache = {
  delete(key) {
    delete this[key];
  },
  get(key) {
    return this[key];
  },
  has(key) {
    return this.hasOwnProperty[key];
  },
  set(key, value) {
    this[key] = value;
    
    return this;
  }
};
const fn = (item) => {
  return item;
};

const memoized = moize(fn, {
  cache
});
```

**isPromise** *defaults to false*

Is the computed value in the function a `Promise`, and should we cache the resolved value from that `Promise`.

```javascript
const fn = async (item) => {
  return await item;
};

const memoized = moize(fn, {
  isPromise: true
});
```

**maxAge** *defaults to Infinity*

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method.

```javascript
const fn = (item) => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5 // five minutes
});
```

**maxArgs** *defaults to the length of arguments passed to the method*

The maximum number of arguments used in creating the key for the cache.

```javascript
const fn = (item1, item2, item3) => {
  return item1 + item2 + item3;
};

const memoized = moize(fn, {
  maxArgs: 2
});
```

**maxSize** *defaults to Infinity*

The maximum size of the cache you want stored in cache for this method. Clearance of the cache once the `maxSize` is reached is on a [Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29) basis.

```javascript
const fn = (item) => {
  return item;
};

const memoized = moize(fn, {
  maxSize: 5
});
```

**serializeFunctions** *defaults to false*

When multiple complex object parameters are used, they are stringified internally for fast caching, however `JSON.stringify` excludes functions by default. By setting this option to `true`, a [custom replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) will be used to ensure functions are included in the key serialization. This is especially beneficial when caching functional `React` components, as interactivity functions as part of props will now be included in the unique key structure. Please note that this will decrease performance between 10-25% depending on environment.

```javascript
const serializer = (args) => {
  return JSON.stringify(args[0]);
};

const memoized = moize(fn, {
  serializer
});
```

**serializer** *defaults to serializeArguments in utils.js*

The default seralizer method is highly performant, and covers a number of edge cases (recursive objects, for example), however if you want to provide a custom one you may. The value returned from the function must be a valid value of keys for a `Map`.

```javascript
const serializer = (args) => {
  return JSON.stringify(args[0]);
};

const memoized = moize(fn, {
  serializer
});
```

### Direct cache manipulation

There are a couple of methods provided on the memoized function which allow for programmatic manipulation of the cache:

**clear()**

This will clear all values in the cache, resetting it to a default state.

```javascript
const memoized = moize((item) => {
  return item;
});

memoized.clear();
```

**delete(key)**

This will delete the provided key from cache.

```javascript
const memoized = moize((item) => {
  return item;
});

memoized('foo');

memoized.delete('item');
```

**keys()**

This will return a list of the current keys in cache.

```javascript
const memoized = moize((item) => {
  return item;
});

memoized('foo');

const keys = memoized.keys(); // ['item']
```

### Benchmarks

All values provided are the number of operations per second (ops/sec) calculated by the [Benchmark suite](https://benchmarkjs.com/). Note that `underscore`, `lodash`, and `ramda` do not support mulitple-parameter memoization, so they are not included in those benchmarks. Each benchmark was performed using the default configuration of the library.

![Single parameter image](img/single-parameter.png)

| underscore | lodash    | ramda   | memoizee  | fast-memoize | addy-osmani | memoizerific | moize      |
|------------|-----------|---------|-----------|--------------|-------------|--------------|------------|
| 6,119,979  | 6,939,684 | 245,116 | 5,129,629 | 6,471,449    | 1,923,117   | 943,197      | 9,807,199  |

![Multiple primitive parameters image](img/multiple-parameter-primitives.png)

| memoizee  | fast-memoize | addy-osmani | memoizerific | moize     |
|-----------|--------------|-------------|--------------|-----------|
| 3,741,468 | 269,808      | 894,831     | 622,138      | 3,142,202 |

![Multiple complex parameters image](img/multiple-parameter-complex.png)

| memoizee | fast-memoize | addy-osmani | memoizerific | moize   |
|----------|--------------|-------------|--------------|---------|
| 3,419    | 218,079      | 438,387     | 31,975       | 582,090 |

### Browser support

* Chrome (all versions)
* Firefox (all versions)
* Opera 15+
* Edge (all versions)
* IE 9+
* Safari 6+

Theoretically the support should go back even farther, these are just the environments that I have tested.

### Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:
* `build` => run webpack to build development `dist` file with NODE_ENV=development
* `build:minifed` => run webpack to build production `dist` file with NODE_ENV=production
* `dev` => run webpack dev server to run example app (playground!)
* `dist` => runs `build` and `build-minified`
* `docs` => builds the docs via `jsdoc`
* `lint` => run ESLint against all files in the `src` folder
* `prepublish` => runs `compile-for-publish`
* `prepublish:compile` => run `lint`, `test`, `transpile`, `dist`
* `test` => run AVA test functions with `NODE_ENV=test`
* `test:coverage` => run `test` but with `nyc` for coverage checker
* `test:watch` => run `test`, but with persistent watcher
* `transpile` => run babel against all files in `src` to create files in `lib`