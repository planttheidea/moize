# moize

<img src="https://img.shields.io/badge/build-passing-brightgreen.svg"/>
<img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg"/>
<img src="https://img.shields.io/badge/license-MIT-blue.svg"/>

`moize` is a [blazing fast](#benchmarks) memoization library for JavaScript. It handles multiple arguments out of the box (including default values), and offers options to help satisfy a number of implementation-specific needs. It has no dependencies, and is ~3kb when minified and gzipped.

## Table of contents
* [Upgrade notification](#upgrade-notification)
* [Installation](#installation)
* [Usage](#usage)
* [Advanced usage](#advanced-usage)
  * [isPromise](#ispromise)
  * [isReact](#isreact)
  * [maxAge](#maxage)
  * [maxArgs](#maxargs)
  * [maxSize](#maxsize)
  * [promiseLibrary](#promiselibrary)
  * [serialize](#serialize)
  * [serializeFunctions](#serializefunctions)
  * [serializer](#serializer)
* [Usage with shortcut methods](#usage-with-shortcut-methods)
  * [moize.maxAge](#moizemaxage)
  * [moize.maxArgs](#moizemaxargs)
  * [moize.maxSize](#moizemaxsize)
  * [moize.promise](#moizepromise)
  * [moize.react](#moizereact)
  * [moize.reactSimple](#moizereactsimple)
  * [moize.serialize](#moizeserialize)
  * [moize.simple](#moizesimple)
* [Composition](#composition)
* [Benchmarks](#benchmarks)
  * [Single parameter](#single-parameter)
  * [Multiple parameters (primitives only)](#multiple-parameters-primitives-only)
  * [Multiple parameters (complex objects)](#multiple-parameters-complex-objects)
* [Direct cache manipulation](#direct-cache-manipulation)
  * [add](#addkey-value)
  * [clear](#clear)
  * [has](#hasargs)
  * [keys](#keys)
  * [remove](#removekey)
  * [values](#values)
* [Browser support](#browser-support)
* [Development](#development)

## Upgrade notification

Users of `moize` 1.x.x may have experience breaking changes, especially if using a custom cache or using `moize.react` in a mutative way. Please see the [changelog](CHANGELOG.md) for more details about how to manage the upgrade.

## Installation

```
$ npm i moize --save
```

## Usage

```javascript
import moize from 'moize';

const method = (a, b) => {
  return a + b;
};

const memoized = moize(method);

memoized(2, 4); // 6
memoized(2, 4); // 6, pulled from cache
```

All parameter types are supported, including circular objects, functions, etc. There are also a number of shortcut methods to easily create memoization for targeted use-cases. You can even memoize functional `React` components based on their `props` + `context` combination (See [Usage with shortcut methods](#usage-with-shortcut-methods))!

## Advanced usage

`moize` optionally accepts an object of options as the second parameter. The full shape of these options:

```javascript
{
  isPromise: boolean, // is the result a promise
  isReact: boolean, // is the result a React component
  maxAge: number, // amount of time in milliseconds before the cache will expire
  maxArgs: number, // maximum number of arguments to use as key for caching
  maxSize: number, // maximum size of cache for this method
  promiseLibrary: Function|Object, // promise library to use when isPromise is true, if not using native promises
  serialize: boolean, // should the parameters be serialized instead of directly referenced
  serializeFunctions: boolean, // should functions be included in the serialization of multiple parameters
  serializer: Function // method to serialize the arguments to build a unique cache key
}
```

#### isPromise

*defaults to false*

Is the computed value in the function a `Promise`, and should we cache the resolved value from that `Promise`. This is also available via the shortcut method of [`moize.promise`](#moizepromise).

```javascript
const fn = async (item) => {
  return await item;
};

const memoized = moize(fn, {
  isPromise: true
});
```

The resolved value of the `Promise` will be stored in cache as a `Promise` itself, so that cached returns will always be in the form of a `Promise`. For common usage reasons, if the `Promise` is rejected, the cache entry will be deleted. Also, if a `maxAge` is provided, the countdown of that TTL will begin upon the resolution of the promise rather than at the instantiation of it.

#### isReact

*defaults to false*

Is the function passed a stateless functional `React` component. This is also available via the shortcut method of [`moize.react`](#moizereact).

```javascript
const Foo = ({bar, baz}) => {
  return (
    <div>
      {bar}: {baz}
    </div>
  );
};

export default moize(Foo, {
  isReact: true
});
```

The method will do a shallow comparison of both `props` and `context` of the component based on strict equality. If you want to mimic the `PureComponent` optimization, add the parameter `maxSize` set to `1`.

#### maxAge

*defaults to Infinity*

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method. This is also available via the shortcut method of [`moize.maxAge`](#moizemaxage).

```javascript
const fn = (item) => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5 // five minutes
});
```

#### maxArgs

*defaults to the length of arguments passed to the method*

The maximum number of arguments used in creating the key for the cache.

```javascript
const fn = (item1, item2, item3) => {
  return item1 + item2 + item3;
};

const memoized = moize(fn, {
  maxArgs: 2
});
```

#### maxSize

*defaults to Infinity*

The maximum size of the cache you want stored in cache for this method. Clearance of the cache once the `maxSize` is reached is on a [Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29) basis. This is also available via the shortcut method of [`moize.maxSize`](#moizemaxsize).

```javascript
const fn = (item) => {
  return item;
};

const memoized = moize(fn, {
  maxSize: 5
});
```

#### promiseLibrary

*defaults to native Promise*

The promise library to use for resolution / rejection of promises.

```javascript
const fn = (foo) => {
  return new Bluebird((resolve) => {
    resolve(foo);
  });
};

const memoized = moize(fn, {
  isPromise: true,
  promiseLibrary: Bluebird
});
```

*Please note that for this option to work `isPromise` must be set to `true`.*

You can use any library where the following aspects of the [specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects) are included:
* It is thenable (the generated promise has a `.then()` function)
* The `Promise` object itself has `.resolve()` and `.reject()` functions on it

Most modern libraries (`bluebird`, `q`, etc.) include these by default, however if you are using a custom library that does not meet these requirements then you will need to implement them yourself. An example of a wrapper that creates the `.resolve()` and `.reject()` methods:

```javascript
import foo from 'my-promise-library';

// create a wrapper so as not to touch the library itself

const customPromise = (fn) => {
  return foo(fn);
};

// lets pretend foo has a .result() method that has the first
// parameter as successful, second as failure

customPromise.resolve = function(value) {
  return foo.result(value);
};
customPromise.reject = function(error) {
  return foo.result(undefined, error);
};

const fn = (foo) => {
  return customPromise((resolve) => {
    resolve(foo);
  });
};

const memoized = moize(fn, {
  isPromise: true,
  promiseLibrary: customPromise
});
```

#### serialize

*defaults to false*

In `moize` 1.x.x, parameter serialization was used, whereas in 2.x.x and beyond we use strict equality to compare parameters. While this is both faster and more accurate, there may be scenarios where you want to serialize the parameters instead (for value equality comparison in situations where you are using mutated objects, for example). Simply pass the `serialize` parameter as `true` and you will use the performant serializer from 1.x.x. This is also available via the shortcut method of [`moize.serialize`](#moizeserialize).

```javascript
const fn = (mutableObject) => {
  return mutableObject.foo;
};

const memoized = moize(fn, {
  serialize: true
});

const object = {
  foo: 'foo'
};

memoized(object); // 'foo'

object.foo = 'bar';

memoized(object); // 'bar'
```

#### serializeFunctions

*defaults to false*

By setting this option to `true`, a [custom replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) will be used to ensure functions are included in the key serialization. This is especially beneficial when caching functional `React` components, as interactivity functions as part of props will now be included in the unique key structure (in fact, this is exactly how `moize.react` works). Please note that this will decrease performance of this specific function between 10-25% depending on environment.

```javascript
const FunctionalComponent = ({onClickFoo}) => {
  return (
    <button
      onClick={onClickFoo}
      type="button"
    >
      Click me!
    </button>
  )
};

const MemoizedFunctionalComponent = moize(FunctionalComponent, {
  serialize: true,
  serializeFunctions: true
});
```

Please note that you must also set `serialize` to true for this setting to take effect.

#### serializer

*defaults to serializeArguments in utils.js*

The default seralizer method is highly performant, and covers a number of edge cases (recursive objects, for example), however if you want to provide a custom one you may. The value returned from the function must be a valid value of keys for a `Map`.

```javascript
const serializer = (args) => {
  return JSON.stringify(args[0]);
};

const memoized = moize(fn, {
  serialize: true,
  serializer
});
```

Please note that you must also set `serialize` to true for this setting to take effect.

## Usage with shortcut methods

#### moize.maxAge

Pre-applies the `maxAge` option as a curriable method.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.maxAge(5000)(foo);
```

#### moize.maxArgs

Pre-applies the `maxArgs` option as a curriable method.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.maxArgs(1)(foo);
```

#### moize.maxSize

Pre-applies the `maxSize` option as a curriable method.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.maxSize(5)(foo);
```

#### moize.promise

Pre-applies the `isPromise` option.

```javascript
import moize from 'moize';

const foo = async (bar, baz) => {
  return await someApiCall(bar, baz);
};

export default moize.promise(foo);
```

#### moize.react

Shortcut for memoizing functional components in [React](https://github.com/facebook/react). This uses a special cache key that will do a shallow equal comparison of changes to both props and context.

```javascript
import moize from 'moize';

const Foo = ({bar, baz}) => {
  return (
    <div>
      {bar} {baz}
    </div>
  );
};

export default moize.react(Foo);
```

Also, it should be noted that in usages that involve a lot of variety in the parameter changes, this has the potential for memory leaks (as the default is to retain the history of all elements). If you expect the parameters to change more than a few times, or if you are reusing the component in several places, it is recommended to apply a `maxSize`, or you can use the new shortcut method [`moize.reactSimple`](#moizereactsimple), which automatically sets the `maxSize` to `1` to mimic the `PureComponent` optimization.

#### moize.reactSimple

Shortcut for memoizing functional components in [React](https://github.com/facebook/react), with the cache size limited to a single entry. This mimics the `PureComponnt` optimization, where the component will only be re-rendered on change to `props` or `context`, and the only element cached is the most recent.

```javascript
import moize from 'moize';

const Foo = ({bar, baz}) => {
  return (
    <div>
      {bar} {baz}
    </div>
  );
};

export default moize.reactSimple(Foo);
```

Please note `moize.reactSimple` will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

#### moize.serialize

Pre-applies the `serialize` option.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.serialize(foo);
```

#### moize.simple

Pre-applies the `maxSize` option with `1`.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.simple(foo);
```

## Composition

Starting with version `2.3.0`, you can compose `moize` methods. This will create a new memoized method with the original function that shallowly merges the options of the two setups. Example:

```javascript
import moize from 'moize';

const Foo = (props) => {
  return (
    <div {...props}/>
  );
};

// memoizing with react, as since 2.0.0
const MemoizedFoo = moize.react(Foo);

// creating a separately-memoized method that has maxSize of 1
const SimpleMemoizedFoo = moize.simple(MemoizedFoo);
```

You can also create an options-first curriable version of memoize if you just pass the options:

```javascript
import moize from 'moize';

// creates a function that will memoize what is passed
const limitedSerializedMoize = moize({
  maxSize: 5,
  serialize: true
});

const foo = (bird) => {
  return `${bird} is the word`;
};

const moizedFoo = limitedSerializedMoize(foo);
```

You can also combine all of these options with `moize.compose` to create `moize` wrappers with pre-defined options.

```javascript
import moize from 'moize';

// creates a moizer that will have the options of
// {maxAge: 5000, maxSize: 1, serialize: true, serializeFunctions: true}
const superLimitedReactMoize = moize.compose(moize.react, moize.maxSize(5), moize.maxAge(5000));
```

## Benchmarks

All values provided are the number of operations per second (ops/sec) calculated by the [Benchmark suite](https://benchmarkjs.com/). Note that `underscore`, `lodash`, and `ramda` do not support mulitple-parameter memoization, so they are not included in those benchmarks. Each benchmark was performed using the default configuration of the library, with a fibonacci calculation based on a starting parameter of 35, and in the case of multiple parameters a second parameter (`boolean` for primitives, `object` for complex objects) was used.

#### Single parameter

![Single parameter image](img/single-parameter.png)

|                    | Operations / second | Relative margin of error |
|--------------------|---------------------|--------------------------|
| **moize**          | **40,053,118**      | **0.60%**                |
| fast-memoize       | 30,697,717          | 0.75%                    |
| moize (serialized) | 13,368,025          | 0.84%                    |
| underscore         | 13,288,319          | 0.91%                    |
| memoizee           | 11,607,458          | 0.79%                    |
| lru-memoize        |  9,663,298          | 1.14%                    |
| lodash             |  9.428,550          | 0.60%                    |
| Addy Osmani        |  4,365,704          | 0.86%                    |
| memoizerific       |  2,166,492          | 1.02%                    |
| ramda              |  1,147,866          | 0.58%                    |

#### Multiple parameters (primitives only)

![Multiple primitive parameters image](img/multiple-parameter-primitives.png)

|                    | Operations / second | Relative margin of error |
|--------------------|---------------------|--------------------------|
| **moize**          | **23,194,668**      | **0.71%**                |
| moize (serialized) | 11,466,193          | 0.65%                    |
| memoizee           |  8,475,388          | 0.77%                    |
| lru-memoize        |  7,565,765          | 1.11%                    |
| Addy Osmani        |  1,999,833          | 0.69%                    |
| memoizerific       |  1,411,535          | 0.87%                    |
| fast-memoize       |    875,786          | 0.80%                    |

#### Multiple parameters (complex objects)

![Multiple complex parameters image](img/multiple-parameter-complex.png)

|                    | Operations / second | Relative margin of error |
|--------------------|---------------------|--------------------------|
| **moize**          | **23,285,445**      | **0.83%**                |
| memoizee           |  8,448,823          | 0.74%                    |
| lru-memoize        |  7,625,557          | 0.93%                    |
| moize (serialized) |  1,883,552          | 0.69%                    |
| memoizerific       |  1,393,975          | 0.82%                    |
| Addy Osmani        |  1,065,637          | 0.91%                    |
| fast-memoize       |    760,402          | 0.74%                    |

## Direct cache manipulation

There are a couple of methods provided on the memoized function which allow for programmatic manipulation of the cache:

#### add(key, value)

This will manually add the *value* at *key* in cache if *key* does not already exist. *key* is an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
// single parameter is straightforward
const memoized = moize((item) => {
  return item;
});

memoized.add(['foo'], 'bar');

// pulls from cache
memoized('foo');
```

#### clear()

This will clear all values in the cache, resetting it to a default state.

```javascript
const memoized = moize((item) => {
  return item;
});

memoized.clear();
```

#### has(key)

This will return `true` if a cache entry exists for the `args` passed, else will return `false`. *key* is an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize((first, second) => {
  return [first, second];
});

memoized('foo', 'bar');

console.log(memoized.has(['foo', 'bar'])); // true
console.log(memoized.has(['bar', 'baz'])); // false
```

#### keys()

This will return a list of the current keys in `cache`.

```javascript
const memoized = moize((item) => {
  return item;
});

const foo = 'foo';

memoized(foo);

const bar = {
  baz: 'baz'
};

memoized(bar);

const keys = memoized.keys(); // ['foo', {baz: 'baz'}]
```

#### remove(key)

This will remove the provided *key* from cache. *key* is an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize((item) => {
  return item;
});

const foo = {
  bar: 'baz'
};

memoized(foo);

memoized.remove([foo]);

// will re-execute, as it is no longer in cache
memoized(foo);
```

#### values()

This will return a list of the current values in `cache` when the native `Cache`.

```javascript
const memoized = moize((item) => {
  return {
    item
  };
});

const foo = 'foo';

memoized(foo);

const bar = {
  baz: 'baz'
};

memoized(bar);

const values = memoized.values(); // [{item: 'foo'}, {item: {baz: 'baz'}}]
```

## Browser support

* Chrome (all versions)
* Firefox (all versions)
* Opera 15+
* Edge (all versions)
* IE 9+
* Safari 6+

Theoretically the support should go back even farther, these are just the environments that I have tested.

## Development

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
