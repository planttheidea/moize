# moize

<img src="https://img.shields.io/badge/build-passing-brightgreen.svg"/>
<img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg"/>
<img src="https://img.shields.io/badge/license-MIT-blue.svg"/>

`moize` is a [blazing fast](#benchmarks) memoization library for JavaScript. It handles multiple parameters (including default values) without any additional configuration, and offers options to help satisfy a number of implementation-specific needs. It has no dependencies, and is ~3.2kb when minified and gzipped.

## Table of contents

* [Upgrade notification](#upgrade-notification)
* [Installation](#installation)
* [Usage](#usage)
* [Advanced usage](#advanced-usage)
  * [equals](#equals)
  * [isPromise](#ispromise)
  * [isReact](#isreact)
  * [maxAge](#maxage)
  * [maxArgs](#maxargs)
  * [maxSize](#maxsize)
  * [onExpire](#onexpire)
  * [promiseLibrary](#promiselibrary)
  * [serialize](#serialize)
  * [serializeFunctions](#serializefunctions)
  * [serializer](#serializer)
  * [transformArgs](#transformargs)
  * [updateExpire](#updateexpire)
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
* [Introspection](#introspection)
  * [isMoized](#ismoized)
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

Users of `moize` 2.x.x may experience breaking changes, especially if using a custom cache or using `moize.react` in a mutative way. Please see the [changelog](CHANGELOG.md) for more details about how to manage the upgrade.

## Installation

```
$ npm i moize --save
```

## Usage

```javascript
import moize from "moize";

const method = (a, b) => {
  return a + b;
};

const memoized = moize(method);

memoized(2, 4); // 6
memoized(2, 4); // 6, pulled from cache
```

All parameter types are supported, including circular objects, functions, etc. There are also a number of shortcut methods to easily create memoization for targeted use-cases. You can even memoize functional `React` components based on their `props` + `context` combination (see the [`isReact`](#isreact) option, or the [`moize.react`](#moizereact) shortcut method)!

## Advanced usage

`moize` optionally accepts an object of options as either the second parameter or as the first step in a curried function:

```javascript
// inline
moize(fn, options);

// curried
moize(options)(fn);
```

The full shape of these options:

```javascript
{
  equals: Function, // custom method to compare equality between two objects
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

#### equals

_defaults to strict equality_

Custom method used to compare equality of keys for cache purposes.

```javascript
// using fast-equals's deep equal comparison method
import { deepEqual } from "fast-equals";

const fn = ({ foo, bar }) => {
  return [foo, bar];
};

const memoized = moize(fn, {
  equals: deepEqual
});

memoized({ foo: "foo", bar: "bar" });
memoized({ foo: "foo", bar: "bar" }); // pulls from cache
```

The `equals` method receives two parameters (cache key values) and should return a `boolean`. Please note that this will be slower than the default strict equality comparison, however how much slower is based on the efficiency of the method passed.

#### isPromise

_defaults to false_

Is the computed value in the function a `Promise`, and should we cache the resolved value from that `Promise`. This is also available via the shortcut method of [`moize.promise`](#moizepromise).

```javascript
const fn = async item => {
  return await item;
};

const memoized = moize(fn, {
  isPromise: true
});
```

The resolved value of the `Promise` will be stored in cache as a `Promise` itself, so that cached returns will always be in the form of a `Promise`. For common usage reasons, if the `Promise` is rejected, the cache entry will be deleted. Also, if a `maxAge` is provided, the countdown of that TTL will begin upon the resolution of the promise rather than at the instantiation of it.

#### isReact

_defaults to false_

Is the function passed a stateless functional `React` component. This is also available via the shortcut method of [`moize.react`](#moizereact).

```javascript
const Foo = ({ bar, baz }) => {
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

The method will do a shallow comparison of both `props` and `context` of the component based on strict equality. If you have mutative props and instead want to do a deep equals comparison, provide a custom [`equals`](#equals) option.

#### maxAge

_defaults to Infinity_

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method. This is also available via the shortcut method of [`moize.maxAge`](#moizemaxage).

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5 // five minutes
});
```

#### maxArgs

_defaults to the length of arguments passed to the method_

The maximum number of arguments used in creating the key for the cache. This is also available via the shortcut method of [`moize.maxArgs`](#moizemaxargs).

```javascript
const fn = (item1, item2, item3) => {
  return item1 + item2 + item3;
};

const memoized = moize(fn, {
  maxArgs: 2
});

memoize("foo", "bar", "baz");
memoize("foo", "bar", "quz"); // pulls from cache, as the first two args are the same
```

Please note that if `maxArgs` is combined with either `serialize` or `transformArgs`, the following order is used:

1.  limit by `maxArgs`
1.  transform by `transformArgs` (if applicable)
1.  serialize by `serializer` (if applicable)

#### maxSize

_defaults to Infinity_

The maximum number of values you want stored in cache for this method. Clearance of the cache once the `maxSize` is reached is on a [Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29) basis. This is also available via the shortcut method of [`moize.maxSize`](#moizemaxsize).

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxSize: 5
});
```

#### onExpire

A callback that is called when one of cache item expires. Note that [maxAge](#maxage) must also be set because by default keys never expire.

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 10000,
  onExpire(key) {
    console.log(key);
  }
});
```

If you return `false` from this method, it will prevent the key's removal, instead refreshing the expiration in the same vein as `updateExpire` based on `maxAge`:

```javascript
const fn = item => {
  return item;
};

let expirationAttempts = 0;

const memoized = moize(fn, {
  maxAge: 1000 * 10, // 10 seconds
  onExpire(key) {
    expirationAttempts++;

    return expirationAttempts < 2;
  }
});

memoized("foo"); // will expire key after 30 seconds, or 3 expiration attempts
```

#### promiseLibrary

_defaults to native Promise_

The promise library to use for resolution / rejection of promises.

```javascript
const fn = foo => {
  return new Bluebird(resolve => {
    resolve(foo);
  });
};

const memoized = moize(fn, {
  isPromise: true,
  promiseLibrary: Bluebird
});
```

_Please note that for this option to work `isPromise` must be set to `true`._

You can use any library where the following aspects of the [specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects) are included:

* It is thenable (the generated promise has a `.then()` function)
* The `Promise` object itself has `.resolve()` and `.reject()` functions on it

Most modern libraries (`bluebird`, `q`, etc.) include these by default, however if you are using a custom library that does not meet these requirements then you will need to implement them yourself. An example of a wrapper that creates the `.resolve()` and `.reject()` methods:

```javascript
import foo from "my-promise-library";

// create a wrapper so as not to touch the library itself

const customPromise = fn => {
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

const fn = foo => {
  return customPromise(resolve => {
    resolve(foo);
  });
};

const memoized = moize(fn, {
  isPromise: true,
  promiseLibrary: customPromise
});
```

#### serialize

_defaults to false_

Serializes the parameters passed into a string and uses this as the key for cache comparison. This is also available via the shortcut method of [`moize.serialize`](#moizeserialize).

```javascript
const fn = mutableObject => {
  return mutableObject.foo;
};

const memoized = moize(fn, {
  serialize: true
});

const object = {
  foo: "foo"
};

memoized(object); // 'foo'

object.foo = "bar";

memoized(object); // 'bar'
```

Please note that this is slower than the default key storage ([see benchmarks](#benchmarks)). Also note that if `serialize` is combined with either `maxArgs` or `transformArgs`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs` (if applicable)
1.  serialize by `serializer`

#### serializeFunctions

_defaults to false_

A [custom replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) is used when serializing to ensure functions are included in the key serialization.

```javascript
const FunctionalComponent = ({ onClickFoo }) => {
  return (
    <button onClick={onClickFoo} type="button">
      Click me!
    </button>
  );
};

const MemoizedFunctionalComponent = moize(FunctionalComponent, {
  serialize: true,
  serializeFunctions: true
});
```

Please note that you must also set `serialize` to `true` for this setting to take effect.

#### serializer

_defaults to serializeArguments in utils.js_

Overrides the internal serializer when serializing the parameters for cache key comparison. The value returned from the function must be a valid value of keys for a `Map`; it does not need to a string, but should be unique from a strict equality perspective.

```javascript
const serializer = args => {
  return JSON.stringify(args[0]);
};

const memoized = moize(fn, {
  serialize: true,
  serializer
});
```

Please note that you must also set `serialize` to `true` for this setting to take effect.

#### transformArgs

Transform the arguments passed before it is used as a key. The function accepts a single argument, the `Array` of `args`, and must also return an `Array`.

```javascript
const fn = (one, two, three) => {
  return [two, three];
};

const ignoreFirstArg = args => {
  return args.slice(1);
};

const moized = moize(fn, {
  transformArgs: ignoreFirstArg
});

moize("foo", "bar", "baz");
moize(null, "bar", "baz"); // pulled from cache
```

Please note that if `transformArgs` is combined with either `maxArgs` or `serialize`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs`
1.  serialize by `serializer` (if applicable)

#### updateExpire

When a `maxAge` is set, clear out the scheduled expiration of the key whenever that key is retrieved, updating the new expiration to be based on the last retrieval from cache.

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5, // five minutes
  updateExpire: true
});

memoized("foo");

setTimeout(() => {
  memoized("foo"); // hits cache, which updates the expire to be 5 minutes from this run instead of the first
}, 1000 * 60);
```

## Usage with shortcut methods

#### moize.maxAge

Pre-applies the `maxAge` option as a curriable method.

```javascript
import moize from "moize";

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.maxAge(5000)(foo);
```

#### moize.maxArgs

Pre-applies the `maxArgs` option as a curriable method.

```javascript
import moize from "moize";

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.maxArgs(1)(foo);
```

#### moize.maxSize

Pre-applies the `maxSize` option as a curriable method.

```javascript
import moize from "moize";

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.maxSize(5)(foo);
```

#### moize.promise

Pre-applies the `isPromise` option.

```javascript
import moize from "moize";

const foo = async (bar, baz) => {
  return await someApiCall(bar, baz);
};

export default moize.promise(foo);
```

Please note that if you want to provide a custom `promiseLibrary`, you must do so with additional options:

```javascript
const additionalOptions = {
  promiseLibrary: Bluebird
};

moize.promise(fn, additionalOptions);
// or
moize.promise(additionalOptions)(fn);
```

#### moize.react

Shortcut for memoizing functional components in [React](https://github.com/facebook/react). This uses a special cache key that will do a shallow equal comparison of changes to both props and context.

```javascript
import moize from "moize";

const Foo = ({ bar, baz }) => {
  return (
    <div>
      {bar} {baz}
    </div>
  );
};

export default moize.react(Foo);
```

Also, it should be noted that in usages that involve a lot of variety in the parameter changes, this has the potential for excessive memory consumption, as the cache will retain the history of all elements. It is therefore recommended to apply a `maxSize`, or to use the shortcut method [`moize.reactSimple`](#moizereactsimple), which automatically sets the `maxSize` to `1`.

Please note `moize.react` will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

#### moize.reactSimple

Shortcut for memoizing functional components in [React](https://github.com/facebook/react), with the cache size limited to a single entry. This mimics the `PureComponent` optimization, where the cache will only contain the component with the most recent `props` and `context` combination.

```javascript
import moize from "moize";

const Foo = ({ bar, baz }) => {
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
import moize from "moize";

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.serialize(foo);
```

Please note that if you want to `serializeFunctions` or provide a custom `serializer`, you must do so with additional options:

```javascript
const additionalOptions = {
  serializeFunctions: true
};

moize.serialize(fn, additionalOptions);
// or
moize.serialize(additionalOptions)(fn);
```

#### moize.simple

Pre-applies the `maxSize` option with `1`.

```javascript
import moize from "moize";

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.simple(foo);
```

## Composition

Starting with version `2.3.0`, you can compose `moize` methods. This will create a new memoized method with the original function that shallowly merges the options of the two setups. Example:

```javascript
import moize from "moize";

const Foo = props => {
  return <div {...props} />;
};

// memoizing with react, as since 2.0.0
const MemoizedFoo = moize.react(Foo);

// creating a separately-memoized method that has maxSize of 5
const LastFiveFoo = moize.maxSize(5)(MemoizedFoo);
```

You can also create an options-first curriable version of `moize` if you only pass the options:

```javascript
import moize from "moize";

// creates a function that will memoize what is passed
const limitedSerializedMoize = moize({
  maxSize: 5,
  serialize: true
});

const foo = bird => {
  return `${bird} is the word`;
};

const moizedFoo = limitedSerializedMoize(foo);
```

You can also combine all of these options with `moize.compose` to create `moize` wrappers with pre-defined options.

```javascript
import moize from "moize";

// creates a moizer that will have the options of
// {isReact: true, maxAge: 5000, maxSize: 5}
const superLimitedReactMoize = moize.compose(
  moize.react,
  moize.maxSize(5),
  moize.maxAge(5000)
);
```

## Introspection

There currently is only one method to introspect objects specific to moize, but if you want more just ask!

#### isMoized

Is the function passed a moized function.

```javascript
const fn = () => {};
const moizedFn = moize(fn);

moize.isMoized(fn); // false
moize.isMoized(moizedFn); // true
```

## Benchmarks

All values provided are the number of operations per second (ops/sec) calculated by the [Benchmark suite](https://benchmarkjs.com/). Note that `underscore`, `lodash`, and `ramda` do not support mulitple-parameter memoization, so they are not included in those benchmarks.

Each benchmark was performed using the default configuration of the library, with a fibonacci calculation based on a starting parameter of `35`, and in the case of multiple parameters a second parameter (`boolean` for primitives, `object` for complex objects) was used.

#### Single parameter

|              | Single (primitive) | Single (object) | Single (average) | Multiple (primitives) | Multiple (objects) |
| ------------ | ------------------ | --------------- | ---------------- | --------------------- | ------------------ |
| **moize**    | **72,673,601**     | **56,145,067**  | **64359334**     | **47,140,063**        | **46,089,976**     |
| fast-memoize | 210,576,701        | 1,437,754       | 1,183,934        | 800,788               |
| underscore   | 23,151,241         | 7,831,437       | N/A              | N/A                   |
| memoizee     | 15,301,745         | 10,828,028      | 9,822,758        | 7,428,066             |
| lodash       | 25,820,327         | 7,955,241       | N/A              | N/A                   |
| lru-memoize  | 7,827,321          | 6,933,155       | 6,382,053        | 6,391,135             |
| Addy Osmani  | 6,267,043          | 1,760,585       | 3,255,834        | 970,044               |
| memoizerific | 5,520,946          | 4,316,649       | 4,504,313        | 3,466,529             |
| ramda        | 1,092,163          | 204,127         | N/A              | N/A                   |

## Direct cache manipulation

There are a few methods provided on the `moize`d function which allow for programmatic manipulation of the cache:

#### add(key, value)

This will manually add the _value_ at _key_ in cache if _key_ does not already exist. _key_ is an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
// single parameter is straightforward
const memoized = moize(item => {
  return item;
});

memoized.add(["foo"], "bar");

// pulls from cache
memoized("foo");
```

#### clear()

This will clear all values in the cache, resetting it to an empty state.

```javascript
const memoized = moize(item => {
  return item;
});

memoized.clear();
```

#### has(key)

This will return `true` if a cache entry exists for the _key_ passed, else will return `false`. _key_ is an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize((first, second) => {
  return [first, second];
});

memoized("foo", "bar");

console.log(memoized.has(["foo", "bar"])); // true
console.log(memoized.has(["bar", "baz"])); // false
```

#### keys()

This will return a list of the current keys in `cache`.

```javascript
const memoized = moize(item => {
  return item;
});

const foo = "foo";

memoized(foo);

const bar = {
  baz: "baz"
};

memoized(bar);

const keys = memoized.keys(); // ['foo', {baz: 'baz'}]
```

#### remove(key)

This will remove the provided _key_ from cache. _key_ is an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize(item => {
  return item;
});

const foo = {
  bar: "baz"
};

memoized(foo);

memoized.remove([foo]);

// will re-execute, as it is no longer in cache
memoized(foo);
```

#### values()

This will return a list of the current values in `cache` when the native `Cache`.

```javascript
const memoized = moize(item => {
  return {
    item
  };
});

const foo = "foo";

memoized(foo);

const bar = {
  baz: "baz"
};

memoized(bar);

const values = memoized.values(); // [{item: 'foo'}, {item: {baz: 'baz'}}]
```

## Browser support

* Chrome (all versions)
* Firefox (all versions)
* Edge (all versions)
* Opera 15+
* IE 9+
* Safari 6+
* iOS 8+
* Android 4+

## Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:

* `build` => run webpack to build development `dist` file with NODE_ENV=development
* `build:minifed` => run webpack to build production `dist` file with NODE_ENV=production
* `dev` => run webpack dev server to run example app (playground!)
* `dist` => runs `build` and `build-minified`
* `docs` => builds the docs via `jsdoc`
* `lint` => run ESLint against all files in the `src` folder
* `prepublish` => runs `compile-for-publish`
* `prepublish:compile` => run `lint`, `test`, `transpile:es`, `transpile:lib`, `dist`
* `test` => run AVA test functions with `NODE_ENV=test`
* `test:coverage` => run `test` but with `nyc` for coverage checker
* `test:watch` => run `test`, but with persistent watcher
* `transpile:lib` => run babel against all files in `src` to create files in `lib`
* `transpile:es` => run babel against all files in `src` to create files in `es`, preserving ES2015 modules (for [`pkg.module`](https://github.com/rollup/rollup/wiki/pkg.module))
