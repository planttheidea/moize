# moize

<img src="https://img.shields.io/badge/build-passing-brightgreen.svg"/>
<img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg"/>
<img src="https://img.shields.io/badge/license-MIT-blue.svg"/>

`moize` is a [consistently blazing fast](#benchmarks) memoization library for JavaScript. It handles multiple parameters (including default values) without any additional configuration, and offers a large number of options to satisfy any number of potential use-cases.

## Table of contents

* [Installation](#installation)
* [Usage](#usage)
* [Advanced usage](#advanced-usage)
  * [equals](#equals)
  * [isDeepEqual](#isdeepequal)
  * [isPromise](#ispromise)
  * [isReact](#isreact)
  * [isSerialized](#isserialized)
  * [maxAge](#maxage)
  * [maxArgs](#maxargs)
  * [maxSize](#maxsize)
  * [onCacheAdd](#oncacheadd)
  * [onCacheChange](#oncachechange)
  * [onCacheHit](#oncachehit)
  * [onExpire](#onexpire)
  * [profileName](#profilename)
  * [shouldSerializeFunctions](#serializefunctions)
  * [serializer](#serializer)
  * [transformArgs](#transformargs)
  * [updateExpire](#updateexpire)
* [Usage with shortcut methods](#usage-with-shortcut-methods)
  * [moize.deep](#moizedeep)
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
  * [getStats](#getstatsprofilename)
  * [isCollectingStats](#iscollectingstats)
  * [isMoized](#ismoized)
* [Collecting statistics](#collecting-statistics)
* [Direct cache manipulation](#direct-cache-manipulation)
  * [cache](#cache)
  * [cacheSnapshot](#cachesnapshot)
  * [add](#addkey-value)
  * [clear](#clear)
  * [get](#getkey)
  * [getStats](#getstats)
  * [has](#hasargs)
  * [keys](#keys)
  * [remove](#removekey)
  * [values](#values)
* [Benchmarks](#benchmarks)
* [Filesize](#filesize)
* [Browser support](#browser-support)
* [Development](#development)

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

All parameter types are supported, including circular objects, functions, etc. There are also a number of [shortcut methods](#usage-with-shortcut-methods) to memoize for unique use-cases.

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
  isDeepEqual: boolean, // is the cache based on deep equality of keys
  isPromise: boolean, // is the result a promise
  isReact: boolean, // is the result a React component
  isSerialized: boolean, // should the parameters be serialized instead of directly referenced
  maxAge: number, // amount of time in milliseconds before the cache will expire
  maxArgs: number, // maximum number of arguments to use as key for caching
  maxSize: number, // maximum size of cache for this method
  onCacheAdd: Function, // method fired when a new entry is added to cache
  onCacheChange: Function, // method fire when either a new entry is added to cache or the LRU ordering of the cache has changed
  onCacheHit: Function, // method fired when an existing entry in cache is used
  onExpire: Function, // method to fire when a cache entry expires (in combination with maxAge)
  profileName: string, // the unique identifier to give the memoized method when collecting statistics
  shouldSerializeFunctions: boolean, // should functions be included in the serialization of multiple parameters
  serializer: Function, // method to serialize the arguments to build a unique cache key
  transformArgs: Function, // method to transform the args into a custom format for key storage in cache
  updateExpire: boolean // should the cache entry's expiration be refreshed when the cache entry is hit (in combination with maxAge)
}
```

#### equals

_defaults to strict equality_

Custom method used to compare equality of keys for cache purposes.

```javascript
// using lodash's deep equal comparison method
import isEqual from "lodash/isEqual";

const fn = ({ foo, bar }) => {
  return [foo, bar];
};

const memoized = moize(fn, {
  equals: isEqual
});

memoized({ foo: "foo", bar: "bar" });
memoized({ foo: "foo", bar: "bar" }); // pulls from cache
```

The `equals` method receives two parameters (cache key values) and should return a `boolean`. Please note that this will be slower than the default SameValueZero equality comparison, however how much slower is based on the efficiency of the method passed.

**NOTE**: This comparison is used iteratively on each argument, rather than comparing the two keys as a whole.

#### isDeepEqual

_defaults to false_

Should deep equality be used to compare cache keys. This is also available via the shortcut method of [`moize.deep`](#moizedeep)

```javascript
const fn = ({ foo, bar }) => {
  return [foo, bar];
};

const memoized = moize(fn, {
  isDeepEqual: true
});

memoized({ foo: "foo", bar: "bar" });
memoized({ foo: "foo", bar: "bar" }); // pulls from cache
```

#### isPromise

_defaults to false_

Is the computed value in the function a `Promise`. This is also available via the shortcut method of [`moize.promise`](#moizepromise).

```javascript
const fn = async item => {
  return await item;
};

const memoized = moize(fn, {
  isPromise: true
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
  isReact: true
});
```

The method will do a shallow comparison of both `props` and `context` of the component based on strict equality. If you have mutative props and instead want to do a deep equals comparison, set [`isDeepEqual`](#isdeepequal) to true.

#### isSerialized

_defaults to false_

Serializes the parameters passed into a string and uses this as the key for cache comparison. This is also available via the shortcut method of [`moize.serialize`](#moizeserialize).

```javascript
const fn = mutableObject => {
  return mutableObject.foo;
};

const memoized = moize(fn, {
  isSerialized: true
});

const object = {
  foo: "foo"
};

memoized(object); // 'foo'

object.foo = "bar";

memoized(object); // 'bar'
```

**NOTE**: This is much slower than the default key storage, and usually the same requirements can be meet with `isDeepEqual`, so use at your discretion. Also, if `serialize` is combined with either `maxArgs` or `transformArgs`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs` (if applicable)
1.  serialize by `serializer`

#### maxAge

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method. This is also available via the shortcut method of [`moize.maxAge`](#moizemaxage).

```javascript
const fn = item => {
  return item;
};

const memoized = moize(fn, {
  maxAge: 1000 * 60 * 5 // five minutes
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

#### onCacheAdd

Method to fire when an item has been added to cache. Receives the `cache` object as a parameter.

```javascript
const fn = (foo, bar) => {
  return [foo, bar];
};

const moized = moize(fn, {
  onCacheAdd(cache) {
    console.log(cache.keys);
  }
});

moized("foo", "bar"); // [["foo","bar"]]
moized("foo", "bar");
moized("bar", "foo"); // [["bar","foo"], ["foo","bar"]]
moized("foo", "bar");
```

**NOTE**: When combined with `onCacheChange`, this method will always fire first.

#### onCacheChange

Method to fire when an item has been either added to cache, or existing cache was reordered based on a cache hit. Receives the `cache` object as a parameter.

```javascript
const fn = (foo, bar) => {
  return [foo, bar];
};

const moized = moize(fn, {
  onCacheChange(cache) {
    console.log(cache.keys);
  }
});

moized("foo", "bar"); // [["foo","bar"]]
moized("foo", "bar");
moized("bar", "foo"); // [["bar","foo"], ["foo","bar"]]
moized("foo", "bar"); // [["foo","bar"], ["bar","foo"]]
```

**NOTE**: When combined with `onCacheAdd` or `onCacheHit`, this method will always fire last.

#### onCacheHit

Method to fire when an existing cache item is found. Receives the `cache` object as a parameter.

```javascript
const fn = (foo, bar) => {
  return [foo, bar];
};

const moized = moize(fn, {
  onCacheHit(cache) {
    console.log(cache.keys);
  }
});

moized("foo", "bar");
moized("foo", "bar"); // [["foo","bar"]]
moized("bar", "foo");
moized("foo", "bar"); // [["bar","foo"], ["foo","bar"]]
```

**NOTE**: When combined with `onCacheChange`, this method will always fire first.

#### onExpire

A callback that is called when one of cache item expires.

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

**NOTE**: You must set a [`maxAge`](#maxage) for this option to take effect.

#### profileName

_defaults to function name_

Name to use as unique identifier for the function when collecting statistics.

```javascript
collectStats();

const fn = item => {
  return item;
};

const memoized = moize(fn, {
  profileName: "my fancy identity"
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
  shouldSerializeFunctions: true
});
```

**NOTE**: You must set [`isSerialized`](#isserialized) for this option to take effect.

#### serializer

_defaults to serializeArguments in utils.js_

Method used in place of the internal serializer when serializing the parameters for cache key comparison. The function accepts a single argument, the `Array` of `args`, and must also return an `Array`.

```javascript
const serializer = args => {
  return [JSON.stringify(args[0])];
};

const memoized = moize(fn, {
  isSerialized: true,
  serializer
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

#### moize.deep

Pre-applies the `isDeepEqual` option.

```javascript
import moize from "moize";

const foo = (bar, baz) => {
  return `${bar} ${baz}`;
};

export default moize.deep(foo);
```

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

Pre-applies the `isPromise` and `updateExpire` options.

```javascript
import moize from "moize";

const foo = async (bar, baz) => {
  return await someApiCall(bar, baz);
};

export default moize.promise(foo);
```

**NOTE**: If you do not want the promise to update its expiration when the cache is hit, then you should use the `isPromise` option directly instead.

#### moize.react

Shortcut for memoizing functional components in [React](https://github.com/facebook/react). Key comparisons will be based on a shallow equal comparison of both props and context.

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

**NOTE**: This method will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

**TIP**: In usages that involve a lot of variety in the parameter changes, this has the potential for excessive memory consumption, as the cache will retain the history of all elements. It is therefore recommended to apply a `maxSize`, or to use the shortcut method [`moize.reactSimple`](#moizereactsimple), which automatically sets the `maxSize` to `1`.

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

**NOTE**: This method will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

#### moize.serialize

Pre-applies the `serialize` option.

```javascript
import moize from "moize";

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

## Collecting statistics

As-of version 5, you can now collect statistics of moize to determine if your cached methods are effective.

```javascript
import moize, { collectStats } from "moize";

collectStats();

const fn = (foo, bar) => {
  return [foo, bar];
};
const moized = moize(fn);

moized("foo", "bar");
moized("foo", "bar");

moized.getStats(); // {"calls": 2, "hits": 1, "usage": "50%"}
```

**NOTE**: It is recommended not to do this in production, as it will have a performance decrease.

## Introspection

#### getStats([profileName])

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
const otherMoized = moize(otherFn, { profileName: "otherMoized" });

moized("foo", "bar");
moized("foo", "bar");

moized.getStats(); // {"calls": 2, "hits": 1, "usage": "50%"}

otherMoized(["baz"]);

moize.getStats("otherMoized"); // {"calls": 1, "hits": 0, "usage": "0%"}

moize.getStats();
/*
 {
   "calls": 3,
   "hits": 1,
   "profiles": {
     "fn": {
       "calls": 2,
       "hits": 1,
       "usage": "50%"
     },
     "otherFn": {
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

```javascript
{
  keys: Array<Array<any>>,
  size: number,
  values: Array<any>
}
```

Regardless of how the key is transformed, it is always stored as an array (if the value returned is not an array, it is coalesced to one).

**NOTE**: The order of `keys` and `values` should always align, so be aware when manually manipulating the cache that you need to manually keep in sync any changes to those arrays.

#### cacheSnapshot

The `cache` is mutated internally for performance reasons, so logging out the cache at a specific step in the workflow may not give you the information you need. As such, to help with debugging you can request the `cacheSnapshot`, which has the same shape as the `cache` but is a shallow clone for persistence.

There are also convenience methods provided on the `moize`d function which allow for programmatic manipulation of the cache.

#### add(key, value)

This will manually add the _value_ at _key_ in cache if _key_ does not already exist. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

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

#### get(key)

Returns the value in cache if the key matches, else returns `undefined`. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```javascript
const memoized = moize((first, second) => {
  return [first, second];
});

memoized("foo", "bar");

console.log(memoized.get(["foo", "bar"])); // ["foo","bar"]
console.log(memoized.get(["bar", "baz"])); // undefined
```

#### getStats()

Returns the statistics for the function.

```javascript
collectStats();

const memoized = moize((first, second) => {
  return [first, second];
});

memoized("foo", "bar");
memoized("foo", "bar");

console.log(memoized.getStats()); // {"calls": 2, "hits": 1, "usage": "50%"}
```

**NOTE**: You must be collecting statistics for the data to be populated correctly.

#### has(key)

This will return `true` if a cache entry exists for the _key_ passed, else will return `false`. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

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

const keys = memoized.keys(); // [['foo'], [{baz: 'baz'}]]
```

#### remove(key)

This will remove the provided _key_ from cache. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

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

This will return a list of the current values in `cache`.

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

## Benchmarks

All values provided are the number of operations per second (ops/sec) calculated by the [Benchmark suite](https://benchmarkjs.com/). Each benchmark was performed using the default configuration of the library, with a fibonacci calculation based on a starting parameter of `35`, using single and multiple parameters with different object types. The results were averaged to determine overall speed across possible usage.

**NOTE**: `lodash`, `ramda`, and `underscore` do not support mulitple-parameter memoization, so they are not included in those benchmarks.

| Name         | Overall (average) | Single (average) | Multiple (average) | Single (primitive) | Single (Array) | Single (Object) | Multiple (primitive) | Multiple (Array) | Multiple (Object) |
| ------------ | ----------------- | ---------------- | ------------------ | ------------------ | -------------- | --------------- | -------------------- | ---------------- | ----------------- |
| moize        | **54,442,644**    | **62,780,580**   | **46,104,708**     | **72,109,787**     | **58,453,155** | **57,778,799**  | **46,581,187**       | **46,183,259**   | **45,549,679**    |
| fast-memoize | 37,609,308        | 74,176,834       | 1,041,783          | 219,337,919        | 1,708,482      | 1,484,101       | 1,206,787            | 1,098,407        | 820,155           |
| memoizee     | 10,756,223        | 13,426,260       | 8,086,187          | 16,472,061         | 11,706,042     | 12,100,677      | 9,883,162            | 7,427,154        | 6,948,247         |
| lru-memoize  | 6,620,127         | 7,072,612        | 6,167,642          | 7,943,207          | 6,574,779      | 6,699,851       | 6,158,971            | 6,185,842        | 6,158,115         |
| memoizerific | 4,402,707         | 4,785,574        | 4,019,841          | 5,607,215          | 4,385,521      | 4,363,988       | 4,663,856            | 3,882,732        | 3,512,935         |
| addy-osmani  | 2,694,874         | 3,374,865        | 2,014,883          | 6,459,123          | 1,963,741      | 1,701,733       | 3,348,464            | 1,748,475        | 947,712           |
| lodash       | N/A               | 14,373,213       | N/A                | 27,021,177         | 8,052,851      | 8,045,612       | N/A                  | N/A              | N/A               |
| underscore   | N/A               | 12,335,218       | N/A                | 23,624,901         | 5,349,427      | 8,031,326       | N/A                  | N/A              | N/A               |
| ramda        | N/A               | 524,451          | N/A                | 1,090,937          | 278,501        | 203,915         | N/A                  | N/A              | N/A               |

![Overall average image](img/overall-average.png)

![Single parameter image](img/single-parameter.png)

![Multiple parameters image](img/multiple-parameters.png)

## Filesize

`moize` is fairly small (about 4KB when minified and gzipped), however it provides a large number of configuration options to satisfy a multitude of edge cases. If filesize is a concern, you should consider using [`micro-memoize`](https://github.com/planttheidea/micro-memoize). This is the memoization library that powers `moize` under-the-hood, and will handle most common use cases at 1/4 the size of `moize`.

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

* `benchmark` => run the benchmark suite pitting `moize` against other libraries in common use-cases
* `benchmark:alternative` => run the benchmark suite for alternative forms of caching in `moize`
* `build` => run rollup to build the distributed files in `dist`
* `clean` => run `clean:lib`, `clean:es`, `clean:dist`, and `clean:docs`
* `clean:dist` => run `rimraf` on the `dist` folder
* `clean:docs` => run `rimraf` on the `docs` folder
* `clean:es` => run `rimraf` on the `es` folder
* `clean:lib` => run `rimraf` on the `lib` folder
* `dev` => run webpack dev server to run example app (playground!)
* `dist` => runs `clean:dist` and `build`
* `docs` => runs `clean:docs` and builds the docs via `jsdoc`
* `flow` => runs `flow check` on the files in `src`
* `lint` => runs ESLint against all files in the `src` folder
* `lint:fix` => runs `lint``, fixing any errors if possible
* `postpublish` => runs `docs`
* `prepublish` => runs `compile-for-publish`
* `prepublish:compile` => run `lint`, `flow`, `test:coverage`, `transpile:lib`, `transpile:es`, and `dist`
* `test` => run AVA test functions with `NODE_ENV=test`
* `test:coverage` => run `test` but with `nyc` for coverage checker
* `test:watch` => run `test`, but with persistent watcher
* `transpile:es` => run babel against all files in `src` to create files in `es`, preserving ES2015 modules (for [`pkg.module`](https://github.com/rollup/rollup/wiki/pkg.module))
* `transpile:lib` => run babel against all files in `src` to create files in `lib`
