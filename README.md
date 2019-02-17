# moize

<img src="https://img.shields.io/badge/build-passing-brightgreen.svg"/>
<img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg"/>
<img src="https://img.shields.io/badge/license-MIT-blue.svg"/>

`moize` is a [consistently blazing fast](#benchmarks) memoization library for JavaScript. It handles multiple parameters (including default values) without any additional configuration, and offers a large number of options to satisfy any number of potential use-cases.

## Table of contents

- [Installation](#installation)
- [Importing](#importing)
- [Usage](#usage)
  - [Types](#types)
- [Configuration options](#configuration-options)
  - [equals](#equals)
  - [isDeepEqual](#isdeepequal)
  - [isPromise](#ispromise)
  - [isReact](#isreact)
  - [isSerialized](#isserialized)
  - [matchesKey](#matcheskey)
  - [maxAge](#maxage)
  - [maxArgs](#maxargs)
  - [maxSize](#maxsize)
  - [onCacheAdd](#oncacheadd)
  - [onCacheChange](#oncachechange)
  - [onCacheHit](#oncachehit)
  - [onExpire](#onexpire)
  - [profileName](#profilename)
  - [shouldSerializeFunctions](#serializefunctions)
  - [serializer](#serializer)
  - [transformArgs](#transformargs)
  - [updateExpire](#updateexpire)
- [Usage with shortcut methods](#usage-with-shortcut-methods)
  - [moize.deep](#moizedeep)
  - [moize.maxAge](#moizemaxage)
  - [moize.maxArgs](#moizemaxargs)
  - [moize.maxSize](#moizemaxsize)
  - [moize.promise](#moizepromise)
  - [moize.react](#moizereact)
  - [moize.reactSimple](#moizereactsimple)
  - [moize.serialize](#moizeserialize)
  - [moize.simple](#moizesimple)
- [Composition](#composition)
- [Collecting statistics](#collecting-statistics)
- [Introspection](#introspection)
  - [getStats](#getstats)
  - [isCollectingStats](#iscollectingstats)
  - [isMoized](#ismoized)
- [Direct cache manipulation](#direct-cache-manipulation)
  - [cache](#cache)
  - [cacheSnapshot](#cachesnapshot)
  - [add](#addkey-value)
  - [clear](#clear)
  - [get](#getkey)
  - [getStats](#getstats)
  - [has](#hasargs)
  - [keys](#keys)
  - [remove](#removekey)
  - [update](#updatekey-value)
  - [values](#values)
- [Benchmarks](#benchmarks)
- [Filesize](#filesize)
- [Browser support](#browser-support)
- [Development](#development)

## Installation

```
$ npm i moize --save
```

## Importing

ESM syntax in browsers:

```javascript
import moize from 'moize';
```

ESM syntax in NodeJS:

```javascript
import moize from 'moize/mjs';
```

CommonJS:

```javascript
const moize = require('moize');
```

## Usage

```javascript
const method = (a, b) => {
  return a + b;
};

const memoized = moize(method);

memoized(2, 4); // 6
memoized(2, 4); // 6, pulled from cache
```

All parameter types are supported, including circular objects, functions, etc. There are also a number of [shortcut methods](#usage-with-shortcut-methods) to memoize for unique use-cases.

#### Types

Since version `6.0.0`, the library is now written in TypeScript, and has such has full typing. Types are available under the `Moize` namespace.

## Configuration options

`moize` optionally accepts an object of options as either the second parameter or as the first step in a curried function:

```javascript
// inline
moize(fn, options);

// curried
moize(options)(fn);
```

The full shape of these options:

```typescript
type Options = {
  [key: string]: any;
  [index: number]: any;

  // custom equality comparator comparing a specific key argument
  equals?: (cacheKeyArgument: any, keyArgument: any) => boolean;

  // is key comparison done via deep equality
  isDeepEqual?: boolean;

  // is the result a promise
  isPromise?: boolean;

  // is the method a functional React component
  isReact?: boolean;

  // should the parameters be serialized instead of directly referenced
  isSerialized?: boolean;

  // custom equality comparator comparing the entire key
  matchesKey?: (cacheKey: any[], key: any[]) => boolean;

  // amount of time in milliseconds before the cache will expire
  maxAge?: number;

  // maximum number of arguments to use as key for caching
  maxArgs?: number;

  // maximum size of cache for this method
  maxSize?: number;

  // a callback when a new cache item is added
  onCacheAdd?: (cache: Cache, options: Options, moized: Function) => void;

  // a callback when the cache changes
  onCacheChange?: (cache: Cache, options: Options, moized: Function) => void;

  // a callback when an existing cache item is retrieved
  onCacheHit?: (cache: Cache, options: Options, moized: Function) => void;

  // a callback when a cache item expires
  onExpire?: (key: any) => boolean | void;

  // a custom name to associate stats for the method to
  profileName?: string;

  // provide a serializer and override default,
  serializer?: (args: any[]) => any[];

  // should functions be included in the serialization of multiple parameters
  shouldSerializeFunctions?: boolean;

  // transform the args prior to storage as key
  transformArgs?: (args: any[]) => any[];

  // should the expiration be updated when cache is hit
  updateExpire?: boolean;
};
```

#### equals

_defaults to [SameValueZero](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero) equality_

Custom method used to compare equality of keys for cache purposes by comparing each argument.

```javascript
// using lodash's deep equal comparison method
const fn = ({ foo, bar }) => {
  return [foo, bar];
};

const memoized = moize(fn, {
  equals(cacheKeyArgument, keyArgument) {
    return cacheKeyArgument.foo === 'bar' && keyArgument.foo === 'bar';
  },
});

memoized({ foo: 'bar' });
memoized({ foo: 'bar', bar: 'baz' }); // pulls from cache
```

The `equals` method receives two parameters (cache key arguments) and should return a `boolean`.

**NOTE**: This comparison is used iteratively on each argument, rather than comparing the two keys as a whole. If you want to compare the key as a whole, you should use [`matchesKey`](#matcheskey).

#### isDeepEqual

_defaults to false_

Should deep equality be used to compare cache keys. This is also available via the shortcut method of [`moize.deep`](#moizedeep)

```javascript
const fn = ({ foo, bar }) => {
  return [foo, bar];
};

const memoized = moize(fn, {
  isDeepEqual: true,
});

memoized({ foo: 'foo', bar: 'bar' });
memoized({ foo: 'foo', bar: 'bar' }); // pulls from cache
```

#### isPromise

_defaults to false_

Is the computed value in the function a `Promise`. This is also available via the shortcut method of [`moize.promise`](#moizepromise).

```javascript
const fn = async item => {
  return await item;
};

const memoized = moize(fn, {
  isPromise: true,
});
```

The `Promise` itself will be stored in cache, so that cached returns will always maintain the `Promise` contract. For common usage reasons, if the `Promise` is rejected, the cache entry will be deleted.

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
  isReact: true,
});
```

The method will do a shallow equal comparison of both `props` and `context` of the component based on strict equality. If you want to do a deep equals comparison, set [`isDeepEqual`](#isdeepequal) to true.

#### isSerialized

_defaults to false_

Serializes the parameters passed into a string and uses this as the key for cache comparison. This is also available via the shortcut method of [`moize.serialize`](#moizeserialize).

```javascript
const fn = mutableObject => {
  return mutableObject.foo;
};

const memoized = moize(fn, {
  isSerialized: true,
});

const object = {
  foo: 'foo',
};

memoized(object); // 'foo'

object.foo = 'bar';

memoized(object); // 'bar'
```

If `serialize` is combined with either `maxArgs` or `transformArgs`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs` (if applicable)
1.  serialize by `serializer`

**NOTE**: This is much slower than the default key storage, and usually the same requirements can be meet with `isDeepEqual`, so use at your discretion.

#### matchesKey

Custom method used to compare equality of keys for cache purposes by comparing the entire key.

```javascript
// using lodash's deep equal comparison method
const fn = ({ foo, bar }) => {
  return [foo, bar];
};

const memoized = moize(fn, {
  matchesKey(cacheKey, key) {
    return (
      cacheKey[0].foo === key[0].foo &&
      cacheKey[1].hasOwnProperty('bar') &&
      key[1].hasOwnProperty('bar')
    );
  },
});

memoized({ foo: 'bar' }, { bar: null });
memoized({ foo: 'bar' }, { bar: 'baz' }); // pulls from cache
```

The `matchesKey` method receives two parameters (cache keys) and should return a `boolean`.

**NOTE**: This comparison uses the two keys as a whole, which is usually less performant than the `equals` comparison used iteratively on each argument. Generally speaking you should use the [`equals`](#equals) option for equality comparison.

#### maxAge

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method. This is also available via the shortcut method of [`moize.maxAge`](#moizemaxage).

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5, // five minutes
});
```

**TIP**: A common usage of this is in tandom with `isPromise` for AJAX calls, and in that scenario the expected behavior is usually to have the `maxAge` countdown begin upon resolution of the promise. If this is your intended use case, you should also apply the `updateExpire` option.

#### maxArgs

The maximum number of arguments (starting from the first) used in creating the key for the cache. This is also available via the shortcut method of [`moize.maxArgs`](#moizemaxargs).

```javascript
const fn = (item1, item2, item3) => {
  return item1 + item2 + item3;
};

const memoized = moize(fn, {
  maxArgs: 2,
});

memoize('foo', 'bar', 'baz');
memoize('foo', 'bar', 'quz'); // pulls from cache, as the first two args are the same
```

If `maxArgs` is combined with either `serialize` or `transformArgs`, the following order is used:

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
  maxSize: 5,
});
```

#### onCacheAdd

Method to fire when an item has been added to cache. Receives the cache, options, and memoized function as a parameters.

```javascript
const fn = (foo, bar) => {
  return [foo, bar];
};

const moized = moize(fn, {
  onCacheAdd(cache, options, moized) {
    console.log(cache.keys);
  },
});

moized('foo', 'bar'); // [["foo","bar"]]
moized('foo', 'bar');
moized('bar', 'foo'); // [["bar","foo"], ["foo","bar"]]
moized('foo', 'bar');
```

**NOTE**: When combined with `onCacheChange`, this method will always fire first.

#### onCacheChange

Method to fire when an item has been either added to cache, or existing cache was reordered based on a cache hit. Receives the cache, options, and memoized function as a parameters.

```javascript
const fn = (foo, bar) => {
  return [foo, bar];
};

const moized = moize(fn, {
  onCacheChange(cache, options, moized) {
    console.log(cache.keys);
  },
});

moized('foo', 'bar'); // [["foo","bar"]]
moized('foo', 'bar');
moized('bar', 'foo'); // [["bar","foo"], ["foo","bar"]]
moized('foo', 'bar'); // [["foo","bar"], ["bar","foo"]]
```

**NOTE**: When combined with `onCacheAdd` or `onCacheHit`, this method will always fire last.

#### onCacheHit

Method to fire when an existing cache item is found. Receives the cache, options, and memoized function as a parameters.

```javascript
const fn = (foo, bar) => {
  return [foo, bar];
};

const moized = moize(fn, {
  onCacheHit(cache, options, moized) {
    console.log(cache.keys);
  },
});

moized('foo', 'bar');
moized('foo', 'bar'); // [["foo","bar"]]
moized('bar', 'foo');
moized('foo', 'bar'); // [["bar","foo"], ["foo","bar"]]
```

**NOTE**: When combined with `onCacheChange`, this method will always fire first.

#### onExpire

A callback that is called when the cached entry expires.

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 10000,
  onExpire(key) {
    console.log(key);
  },
});
```

If you return `false` from this method, it will prevent the key's removal and refresh the expiration in the same vein as `updateExpire` based on `maxAge`:

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
  },
});

memoized('foo'); // will expire key after 30 seconds, or 3 expiration attempts
```

**NOTE**: You must set a [`maxAge`](#maxage) for this option to take effect.

#### profileName

_defaults to function name and file/line location_

Name to use as unique identifier for the function when collecting statistics.

```javascript
collectStats();

const fn = item => {
  return item;
};

const memoized = moize(fn, {
  profileName: 'my fancy identity',
});
```

**NOTE**: You must be collecting statistics for this option to take effect.

#### shouldSerializeFunctions

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
  isSerialized: true,
  shouldSerializeFunctions: true,
});
```

**NOTE**: You must set [`isSerialized`](#isserialized) for this option to take effect.

#### serializer

_defaults to argumentSerializer in serialize.ts_

Method used in place of the internal serializer when serializing the parameters for cache key comparison. The function accepts a single argument, the `Array` of `args`, and must also return an `Array`.

```javascript
const serializer = args => {
  return [JSON.stringify(args[0])];
};

const memoized = moize(fn, {
  isSerialized: true,
  serializer,
});
```

**NOTE**: You must set [`isSerialized`](#isserialized) for this option to take effect.

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
  transformArgs: ignoreFirstArg,
});

moize('foo', 'bar', 'baz');
moize(null, 'bar', 'baz'); // pulled from cache
```

If `transformArgs` is combined with either `maxArgs` or `serialize`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs`
1.  serialize by `serializer` (if applicable)

#### updateExpire

When a `maxAge` is set, clear the scheduled expiration of the key when that key is retrieved, setting a new expiration based on the most recent retrieval from cache.

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5, // five minutes
  updateExpire: true,
});

memoized('foo');

setTimeout(() => {
  memoized('foo'); // hits cache, which updates the expire to be 5 minutes from this run instead of the first
}, 1000 * 60);
```

## Usage with shortcut methods

#### moize.collectStats

Start collecting stats on memoization usage.

```javascript
import moize from 'moize';

moize.collectStats();
```

For more information about using statistics, [read the documentation here](#statistics).

**NOTE**: It is recommended not to activate this in production, as it will have a performance decrease.

#### moize.deep

Pre-applies the `isDeepEqual` option to `true`.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.deep(foo);
```

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

Pre-applies the `isPromise` and `updateExpire` options to `true`.

The `updateExpire` option does nothing if `maxAge` is not also applied, but ensures that the expiration begins at the resolution of the promise rather than the instantiation of it.

```javascript
import moize from 'moize';

const foo = async (bar, baz) => {
  return await someApiCall(bar, baz);
};

export default moize.promise(foo);
```

**NOTE**: If you do not want the promise to update its expiration when the cache is hit, then you should use the `isPromise` option directly instead.

#### moize.react

Pre-applies the `isReact` option to `true`.

Shortcut for memoizing functional components in [React](https://github.com/facebook/react). Key comparisons are based on a shallow equal comparison of both props and context.

```javascript
import moize from 'moize';

const Foo = ({ bar, baz }) => {
  return (
    <div>
      {bar} {baz}
    </div>
  );
};

export default moize.react(Foo);
```

**NOTE**: This method will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

**TIP**: In usages that involve a lot of variety in the parameter changes, this has the potential for excessive memory consumption, as the cache will retain the history of all elements. It is therefore recommended to apply a `maxSize`, or to use the shortcut method [`moize.reactSimple`](#moizereactsimple), which automatically sets the `maxSize` to `1`.

#### moize.reactSimple

Pre-applies the `isReact` option to `true`, and `maxSize` option to 1.

Shortcut for memoizing functional components in [React](https://github.com/facebook/react), with the cache size limited to a single entry.

```javascript
import moize from 'moize';

const Foo = ({ bar, baz }) => {
  return (
    <div>
      {bar} {baz}
    </div>
  );
};

export default moize.reactSimple(Foo);
```

**NOTE**: This method will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

#### moize.serialize

Pre-applies the `isSerialized` option to `true`.

```javascript
import moize from 'moize';

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.serialize(foo);
```

Please note that if you want to apply `shouldSerializeFunctions` or provide a custom `serializer`, you must do so with additional options:

```javascript
moize.serialize({ shouldSerializeFunctions: true })(fn);
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
import moize from 'moize';

// creates a function that will memoize what is passed
const limitedSerializedMoize = moize({
  maxSize: 5,
  serialize: true,
});

const foo = bird => {
  return `${bird} is the word`;
};

const moizedFoo = limitedSerializedMoize(foo);
```

You can also combine all of these options with `moize.compose` to create `moize` wrappers with pre-defined options.

```javascript
import moize from 'moize';

// creates a moizer that will have the options of
// {isReact: true, maxAge: 5000, maxSize: 5}
const superLimitedReactMoize = moize.compose(
  moize.react,
  moize.maxSize(5),
  moize.maxAge(5000),
);
```

## Collecting statistics

As-of version `5.0.0`, you can collect statistics of moize to determine if your cached methods are effective.

```javascript
import moize from 'moize';

moize.collectStats();

const fn = (foo, bar) => {
  return [foo, bar];
};
const moized = moize(fn);

moized('foo', 'bar');
moized('foo', 'bar');

moized.getStats(); // {"calls": 2, "hits": 1, "usage": "50%"}
```

**NOTE**: It is recommended not to activate this in production, as it will have a performance decrease.

## Introspection

#### getStats

Get the statistics for a specific function, or globally.

```javascript
collectStats();

const fn = (foo, bar) => {
  return [foo, bar];
};
const moized = moize(fn);

const otherFn = bar => {
  return bar.slice(0, 1);
};
const otherMoized = moize(otherFn, { profileName: 'otherMoized' });

moized('foo', 'bar');
moized('foo', 'bar');

moized.getStats(); // {"calls": 2, "hits": 1, "usage": "50%"}

otherMoized(['baz']);

moize.getStats('otherMoized'); // {"calls": 1, "hits": 0, "usage": "0%"}

moize.getStats();
/*
 {
   "calls": 3,
   "hits": 1,
   "profiles": {
     "fn at Object..src/utils.js (http://localhost:3000/app.js:153:68)": {
       "calls": 2,
       "hits": 1,
       "usage": "50%"
     },
     "otherMoized": {
       "calls": 1,
       "hits": 0,
       "usage": "0%"
     }
   },
   "usage": "33.3333%"
 }
 */
```

#### isCollectingStats

Are statistics being collected on memoization usage.

```javascript
moize.isCollectingStats(); // false

collectStats();

moize.isCollectingStats(); // true
```

#### isMoized

Is the function passed a moized function.

```javascript
const fn = () => {};
const moizedFn = moize(fn);

moize.isMoized(fn); // false
moize.isMoized(moizedFn); // true
```

## Direct cache manipulation

The cache is available on the `moize`d function as a property, and while it is not recommended to modify it directly, that option is available for edge cases.

#### cache

The shape of the `cache` is as follows:

```typescript
type Cache = {
  keys: (any[])[];
  size: number;
  values: any[];
};
```

Regardless of how the key is transformed, it is always stored as an array (if the value returned is not an array, it is coalesced to one).

**NOTE**: The order of `keys` and `values` should always align, so be aware when manually manipulating the cache that you need to manually keep in sync any changes to those arrays.

#### cacheSnapshot

The `cache` is mutated internally for performance reasons, so logging out the cache at a specific step in the workflow may not give you the information you need. As such, to help with debugging you can request the `cacheSnapshot`, which has the same shape as the `cache` but is a shallow clone of each property for persistence.

There are also convenience methods provided on the `moize`d function which allow for programmatic manipulation of the cache.

#### add(key, value)

This will manually add the _value_ at _key_ in cache if _key_ does not already exist. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
// single parameter is straightforward
const memoized = moize(item => {
  return item;
});

memoized.add(['foo'], 'bar');

// pulls from cache
memoized('foo');
```

**NOTE**: This will only add `key`s that do not exist in the cache, and will do nothing if the `key` already exists. If you want to update keys that already exist, use [`update`](#updatekey-value).

#### clear()

This will clear all values in the cache, resetting it to an empty state.

```javascript
const memoized = moize(item => {
  return item;
});

memoized.clear();
```

#### get(key)

Returns the value in cache if the key matches, else returns `undefined`. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize((first, second) => {
  return [first, second];
});

memoized('foo', 'bar');

console.log(memoized.get(['foo', 'bar'])); // ["foo","bar"]
console.log(memoized.get(['bar', 'baz'])); // undefined
```

#### getStats()

Returns the statistics for the function.

```javascript
collectStats();

const memoized = moize((first, second) => {
  return [first, second];
});

memoized('foo', 'bar');
memoized('foo', 'bar');

console.log(memoized.getStats()); // {"calls": 2, "hits": 1, "usage": "50%"}
```

**NOTE**: You must be collecting statistics for this to be populated.

#### has(key)

This will return `true` if a cache entry exists for the _key_ passed, else will return `false`. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

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
const memoized = moize(item => {
  return item;
});

const foo = 'foo';

memoized(foo);

const bar = {
  baz: 'baz',
};

memoized(bar);

const keys = memoized.keys(); // [['foo'], [{baz: 'baz'}]]
```

#### remove(key)

This will remove the provided _key_ from cache. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize(item => {
  return item;
});

const foo = {
  bar: 'baz',
};

memoized(foo);

memoized.remove([foo]);

// will re-execute, as it is no longer in cache
memoized(foo);
```

**NOTE**: This will only remove `key`s that exist in the cache, and will do nothing if the `key` does not exist.

#### update(key, value)

This will manually update the _value_ at _key_ in cache if _key_ exists. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
// single parameter is straightforward
const memoized = moize(item => {
  return item;
});

memoized.add(['foo'], 'bar');

// pulls from cache
memoized('foo');
```

**NOTE**: This will only update `key`s that exist in the cache, and will do nothing if the `key` does not exist. If you want to add keys that do not already exist, use [`add`](#addkey-value).

#### values()

This will return a list of the current values in `cache`.

```javascript
const memoized = moize(item => {
  return {
    item,
  };
});

const foo = 'foo';

memoized(foo);

const bar = {
  baz: 'baz',
};

memoized(bar);

const values = memoized.values(); // [{item: 'foo'}, {item: {baz: 'baz'}}]
```

## Benchmarks

All values provided are the number of operations per second calculated by [benchee](https://www.npmjs.com/package/benchee), where a higher value is better. Each benchmark was performed using the default configuration of the library, with a fibonacci calculation based on a starting parameter of `35`, using single and multiple parameters with different object types. The results were averaged to determine overall speed across possible usage.

**NOTE**: `lodash`, `ramda`, and `underscore` do not support mulitple-parameter memoization without use of a `resolver` function. For consistency in comparison, each use the same `resolver` that returns the result of `JSON.stringify` on the arguments.

| Name         | Overall (average) | single primitive | single array   | single object  | multiple primitive | multiple array | multiple object |
| ------------ | ----------------- | ---------------- | -------------- | -------------- | ------------------ | -------------- | --------------- |
| **moize**    | **28,592,886**    | **37,390,978**   | **28,443,977** | **28,377,652** | **24,972,215**     | **25,001,120** | **24,998,368**  |
| lru-memoize  | 21,491,988        | 39,937,384       | 20,342,667     | 20,924,765     | 17,346,234         | 16,322,914     | 17,300,359      |
| lodash       | 12,104,503        | 25,416,048       | 23,301,328     | 27,505,049     | 1,389,241          | 1,087,838      | 877,620         |
| memoizee     | 9,515,597         | 15,799,929       | 10,643,471     | 10,740,599     | 6,572,612          | 7,013,962      | 6,818,388       |
| fast-memoize | 7,463,418         | 51,566,160       | 1,615,649      | 1,426,880      | 1,268,116          | 979,444        | 819,221         |
| memoizerific | 5,117,778         | 5,641,768        | 5,539,880      | 5,533,768      | 4,496,953          | 4,711,212      | 4,705,524       |
| underscore   | 4,230,089         | 20,965,582       | 2,108,270      | 1,828,023      | 1,459,836          | 1,126,566      | 910,574         |
| mem          | 4,089,526         | 19,888,317       | 2,093,008      | 1,786,244      | 2,345,978          | 1,661,802      | 1,054,462       |
| ramda        | 4,070,948         | 21,712,404       | 2,335,372      | 2,066,631      | 1,498,134          | 1,153,950      | 916,465         |
| addy-osmani  | 2,200,040         | 5,824,585        | 1,586,101      | 1,448,906      | 3,081,196          | 975,378        | 775,256         |

## Filesize

`moize` is fairly small (about 3.2KB when minified and gzipped), however it provides a large number of configuration options to satisfy a number of edge cases. If filesize is a concern, you may consider using [`micro-memoize`](https://github.com/planttheidea/micro-memoize). This is the memoization library that powers `moize` under-the-hood, and will handle most common use cases at 1/3 the size of `moize`.

## Browser support

- Chrome (all versions)
- Firefox (all versions)
- Edge (all versions)
- Opera 15+
- IE 9+
- Safari 6+
- iOS 8+
- Android 4+

## Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:

- `benchmark` => run the benchmark suite pitting `moize` against other libraries in common use-cases
- `benchmark:alternative` => run the benchmark suite for alternative forms of caching in `moize`
- `build` => run rollup to build the distributed files in `dist`
- `clean` => run `clean:lib`, `clean:es`, `clean:dist`, and `clean:docs`
- `clean:dist` => run `rimraf` on the `dist` folder
- `clean:docs` => run `rimraf` on the `docs` folder
- `clean:es` => run `rimraf` on the `es` folder
- `clean:lib` => run `rimraf` on the `lib` folder
- `dev` => run webpack dev server to run example app (playground!)
- `dist` => runs `clean:dist` and `build`
- `docs` => runs `clean:docs` and builds the docs via `jsdoc`
- `flow` => runs `flow check` on the files in `src`
- `lint` => runs ESLint against all files in the `src` folder
- `lint:fix` => runs `lint``, fixing any errors if possible
- `postpublish` => runs `docs`
- `prepublish` => runs `compile-for-publish`
- `prepublish:compile` => run `lint`, `flow`, `test:coverage`, `transpile:lib`, `transpile:es`, and `dist`
- `test` => run AVA test functions with `NODE_ENV=test`
- `test:coverage` => run `test` but with `nyc` for coverage checker
- `test:watch` => run `test`, but with persistent watcher
- `transpile:es` => run babel against all files in `src` to create files in `es`, preserving ES2015 modules (for [`pkg.module`](https://github.com/rollup/rollup/wiki/pkg.module))
- `transpile:lib` => run babel against all files in `src` to create files in `lib`
