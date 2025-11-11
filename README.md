> moize

<img src="https://img.shields.io/badge/build-passing-brightgreen.svg"/>
<img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg"/>
<img src="https://img.shields.io/badge/license-MIT-blue.svg"/>

`moize` is a [consistently blazing fast](#benchmarks) memoization library for JavaScript. It handles multiple parameters (including default values) without any additional configuration, and offers a large number of options to satisfy any number of potential use-cases.

- [Importing](#importing)
    - [ESM in browsers](#esm-in-browsers)
    - [ESM in NodeJS](#esm-in-nodejs)
    - [CommonJS](#commonjs)
- [Usage](#usage)
- [Configuration options](#configuration-options)
    - [async](#async)
    - [expires](#expires)
    - [forceUpdate](#forceupdate)
    - [isKeyEqual](#iskeyequal)
    - [isKeyItemEqual](#iskeyitemequal)
    - [maxArgs](#maxargs)
    - [maxSize](#maxsize)
    - [serialize](#serialize)
    - [statsName](#statsname)
    - [transformKey](#transformkey)
- [Usage with shortcut methods](#usage-with-shortcut-methods)
    - [moize.async](#moizeasync)
    - [moize.deep](#moizedeep)
    - [moize.expires](#moizeexpires)
    - [moize.forceUpdate](#moizeforceupdate)
    - [moize.infinite](#moizeinfinite)s
    - [moize.isKeyEqual](#moizeiskeyequal)
    - [moize.isKeyItemEqual](#moizeiskeyitemequal)
    - [moize.maxArgs](#moizemaxargs)
    - [moize.maxSize](#moizemaxsize)
    - [moize.serialize](#moizeserialize)
    - [moize.serializeWith](#moizeserializewith)
    - [moize.shallow](#moizeshallow)
    - [moize.statsName](#moizestatsname)
    - [moize.transformKey](#moizetransformkey)
- [useMoize hook](#usemoize-hook)
- [Composition](#composition)
- [Collecting statistics](#collecting-statistics)
    - [Stats methods](#stats-methods)
    - [clearStats](#clearstats)
    - [collectStats](#collectstats)
    - [getStats([profileName])](#getstatsprofilename)
- [Introspection](#introspection)
    - [isCollectingStats](#iscollectingstats)
    - [isMoized](#ismoized)
- [Direct cache manipulation](#direct-cache-manipulation)
    - [clear()](#clear)
    - [delete(args)](#deleteargs)
    - [get(args)](#getargs)
    - [has(args)](#hasargs)
    - [on(name, listener)](#onname-listener)
        - [add](#add)
        - [delete](#delete)
        - [hit](#hit)
        - [update](#update)
    - [set(args, value)](#setkey-value)
    - [snapshot](#snapshot)
- [Benchmarks](#benchmarks)
- [Filesize](#filesize)
- [Browser support](#browser-support)
- [Development](#development)

```
$ npm i moize --save
```

# Importing

## ESM in browsers

```ts
import { moize } from 'moize';
```

## ESM in NodeJS

```ts
import moize from 'moize/mjs/index.mjs';
```

## CommonJS

```ts
const moize = require('moize');
```

# Usage

```ts
import { moize } from 'moize';

const method = (a: number, b: number) => a + b;

const memoized = moize(method);

memoized(2, 4); // 6
memoized(2, 4); // 6, pulled from cache
```

All parameter types are supported, including circular objects, functions, etc. There are also a number of [shortcut methods](#usage-with-shortcut-methods) to memoize for unique use-cases.

# Configuration options

`moize` optionally accepts an object of options as either the second parameter or as the first step in a curried function:

```ts
// inline
moize(fn, options);

// curried
moize(options)(fn);
```

The full shape of these options:

```ts
type Options = {
    /**
     * Whether the result of calling the function is a promise. This
     * will automatically remove the entry from cache if the promise is
     * rejected to avoid caching error states.
     */
    async?: boolean;
    /**
     * Whether the entry in cache should automatically remove itself
     * after a period of time.
     */
    expires?: number | GetExpires<Fn> | ExpiresConfig<Fn>;
    /**
     * Method to determine whether to bypass the cache to force an update
     * of the underlying entry based on new results.
     *
     * This should only be necessary if the memoized function is not
     * deterministic due to side-effects.
     */
    forceUpdate?: ForceUpdate<Fn>;
    /**
     * Whether the two keys are equal in value. This is used to compare
     * the key the function is called with against a given cache key to
     * determine whether the cached entry can be used.
     *
     * @default isShallowEqual
     *
     * @note
     * If provided, the `isArgEqual` option will be ignored.
     */
    isKeyEqual?: (cachedKey: Key, nextKey: Key) => boolean;
    /**
     * Whether the two args are equal in value. This is used to compare
     * specific arguments in order for a cached key versus the key the
     * function is called with to determine whether the cached entry
     * can be used.
     *
     * @default isSameValueZero
     *
     * @note
     * This option will be ignored if the `isKeyEqual` option is provided.
     */
    isKeyItemEqual?:
        | 'deep'
        | 'shallow'
        | ((cachedKeyItem: Arg, nextKeyItem: Arg, index: number) => boolean);
    /**
     * The maximum number of args to consider for caching.
     */
    maxArgs?: number;
    /**
     * The maximum number of entries to store in cache.
     * @default 1
     */
    maxSize?: number;
    /**
     * Whether to serialize the arguments into a string value for cache
     * purposes. A custom serializer can also be provided, if the default
     * one is insufficient.
     *
     * This can potentially be faster than `isKeyItemEqual: 'deep'` in rare
     * cases, but can also be used to provide a deep equal check that handles
     * circular references.
     */
    serialize?: boolean | Serializer;
    /**
     * The name to give this method when recording profiling stats.
     */
    statsName?: string;
    /**
     * Transform the parameters passed into a custom key for storage in
     * cache.
     */
    transformKey?: TransformKey<Fn>;
};
```

## async

Does the function return a `Promise`.

```ts
const fn = async (item: Promise<string>) => await item;

const memoized = moize(fn, { async: true });
```

This is also available via the shortcut method of [`moize.async`](#moizepromise).

```ts
const memoized = moize.async(fn);
```

The `Promise` itself will be stored in cache, so that cached returns will always maintain the `Promise` contract. For common usage reasons, if the `Promise` is rejected, the cache entry will be deleted.

## expires

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method. You can also pass a custom configuration to handle conditional expiration.

```ts
const fn = (item: Record<string, any>) => item;

const MAX_AGE = 1000 * 60 * 5; // five minutes;

const expiringMemoized = moize(fn, { maxAge: MAX_AGE });
const conditionalExpiringMemoized = moize(fn, {
    expires: {
        after: MAX_AGE,
        shouldPersist: (item) => !!item.cache,
        shouldRemove: (item) =>
            item.releaseDate < new Date('2025-01-01').valueOf(),
        update: true,
    },
});
```

This is also available via the shortcut method of [`moize.expires`](#moizeexpires).

```ts
const expiringMemoized = moize.maxAge(MAX_AGE)(fn);
const conditionalExpiringMemoized = moize.maxAge({
    after: MAX_AGE,
    shouldPersist: (item) => !!item.cache,
    shouldRemove: (item) => item.releaseDate < new Date('2025-01-01').valueOf(),
    update: true,
})(fn);
```

**TIP**: A common usage of this is in tandem with `async` for AJAX calls, and in that scenario the expected behavior is usually to have the `expires` countdown begin upon resolution of the promise. If this is your intended use case, you should also apply the `update` configuration option.

## forceUpdate

Force-updates the cache for a given key in certain call conditions. This is useful if the function being memoized has time-based side-effects.

```ts
const fn = (item: string) => item;

let lastUpdate = Date.now();

const memoized = moize(fn, {
    forceUpdate([item]: [string]) {
        const now = Date.now();
        const last = lastUpdated;

        lastUpdate = now;

        // its been more than 5 minutes since last update
        return last + 300000 < now;
    },
});

memoized('one');
memoized('one'); // pulled from cache

// 5 minutes later

memoized('one'); // re-calls method and updates cache
```

This is also available via the shortcut method of [`moize.forceUpdate`](#moizeforceupdate).

```ts
const memoized = moize.forceUpdate(shouldCacheUpdate)(fn);
```

## isKeyEqual

Method used to compare equality of keys for cache purposes by comparing the entire key.

```ts
type Arg = {
    one: string;
    two: string;
};

const fn = ({ one, two }: Arg) => [one, two];

const isFooEqualAndHasBar = (cacheKey: [Arg], key: [Arg]) =>
    cacheKey[0].one === key[0].one &&
    cacheKey[1].hasOwnProperty('two') &&
    key[1].hasOwnProperty('two');

const memoized = moize(fn, { isKeyEqual: isFooEqualAndHasBar });

memoized({ one: 'two' }, { two: null });
memoized({ one: 'two' }, { two: 'three' }); // pulls from cache
```

This is also available via the shortcut method of [`moize.isKeyEqual`](#moizeiskeyequal)

```ts
const memoized = moize.isKeyEqual(isFooEqualAndHasBar)(fn);
```

**NOTE**: This comparison uses the two keys as a whole, which is usually less performant than the `matchArg` comparison used iteratively on each argument. Generally speaking you should use the [`isKeyItemEqual`](#iskeyitemequal) option for equality comparison.

## isKeyItemEqual

Method used to compare equality of individual arguments in keys for cache purposes.

```ts
type Arg = {
    one: {
        nested: string;
    };
    two: string;
};

const fn = ({ one, two }: Arg) => [one, two];

const deepMemoized = moize(fn, { isKeyItemEqual: 'deep' });

deepMemoized({ one: { nested: 'one' }, two: 'two' });
deepMemoized({ one: { nested: 'one' }, two: 'two' }); // pulls from cache

const shallowMemoized = moize(fn, { isKeyItemEqual: 'shallow' });

shallowMemoized({ one: 'one', two: 'two' });
shallowMemoized({ one: 'one', two: 'two' }); // pulls from cache

const customMemoized = moize(fn, {
    isKeyItemEqual: (cacheKeyArg: Arg, keyArg: Arg) =>
        Object.keys(cacheKeyArg).length === 1 && Object.keys(keyArg).length === 1
    }
);

customMemoized({ one: 'two' };
customMemoized({ two: 'three' }); // pulls from cache
```

This is also available via shortcut methods:

- [`moize.deep`](#moizedeep) => `isKeyItemEqual: 'deep'`
- [`moize.shallow`](#moizeshallow) => `isKeyItemEqual: 'shallow'`
- [`moize.isKeyItemEqual`](#moizeiskeyitemequal) => `isKeyItemEqual: customFn`

```ts
const deepMemoized = moize.deep(fn);
const shallowMemoized = moize.shallow(fn);
const customMemoized = moize.isKeyItemEqual(customFn)(fn);
```

## maxArgs

The maximum number of arguments (starting from the first) used in creating the key for the cache.

```ts
const fn = (item1: string, item2: string, item3: string) =>
    item1 + item2 + item3;

const memoized = moize(fn, { maxArgs: 2 });

memoize('one', 'two', 'three');
memoize('one', 'two', 'four'); // pulls from cache, as the first two args are the same
```

This is also available via the shortcut method of [`moize.maxArgs`](#moizemaxargs).

```ts
const memoized = moize.maxArgs(2)(fn);
```

If `maxArgs` is combined with either `serialize` or `transformArgs`, the following order is used:

1.  limit by `maxArgs`
1.  transform by `transformArgs` (if applicable)
1.  serialize by `serializer` (if applicable)

## maxSize

The maximum number of values you want stored in cache for this method. Clearance of the cache once the `maxSize` is reached is on a [Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29) basis.

```ts
const fn = (item: string) => item;

const memoized = moize(fn, { maxSize: 5 });
```

This is also available via the shortcut method of [`moize.maxSize`](#moizemaxsize).

```ts
const memoized = moize.maxSize(5)(fn);
```

## serialize

Serializes the parameters passed into a string and uses this as the key for cache comparison. If a method is passed instead of a boolean, it is used as a custom serializer.

```ts
const fn = (mutableObject: { one: Record<string, any> }) =>
    mutableObject.property;

const serializedMemoized = moize(fn, { serialize: true });
const customSerializedMemoized = moize(fn, {
    serialize: (args) => [JSON.stringify(args[0])],
});
```

This is also available via shortcut methods:

- [`moize.serialize`](#moizeserialize) => serialize with the native serializer
- [`moize.serializeWith`](#moizeserializewith) => serialize with a custom serializer

```ts
const serializedMemoized = moize.serialize(fn);
const customSerializedMemoized = moize.serializeWith((args: string[]) => [
    JSON.stringify(args[0]),
])(fn);
```

If `serialize` is combined with either `maxArgs` or `transformKey`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformKey` (if applicable)
1.  serialize

**NOTE**: This is much slower than the default key storage, and usually the same requirements can be meet with `isKeyItemEqual: 'deep'`, so use at your discretion.

## statsName

Name to use as unique identifier for the function when collecting statistics. Applying a `statsName` will also activate stats collection for that method.

```ts
moize.startCollectingStats();

const fn = (item: string) => item;

const memoized = moize(fn, { statsName: 'my fancy identity' });
```

This is also available via the shortcut method of [`moize.statsName`](#moizestatsname).

```ts
const memoized = moize.statsName('profile-name')(fn);
```

## transformKey

Transform the arguments passed before it is used as a key. The function accepts a single argument, the `Array` of `args`, and must also return an `Array`.

```ts
const fn = (one: string | null, two: string | null, three: string | null) => [
    two,
    three,
];

const moized = moize(fn, {
    transformArgs: (args) => args.slice(1),
});

moize('one', 'two', 'three');
moize(null, 'two', 'three'); // pulled from cache
```

This is also available via the shortcut method of [`moize.transformKey`](#moizetransformkey).

```ts
const memoized = moize.transformKey((args: (string | null)[]) => args.slice(1))(
    fn,
);
```

If `transformKey` is combined with either `maxArgs` or `serialize`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformKey`
1.  serialize (if applicable)

# Usage with shortcut methods

## moize.async

Pre-applies the [`async`](#async) option.

```ts
import { moize } from 'moize';

const fn = async (one: string, two: Record<string, any>) =>
    await someApiCall(one, two);

export default moize.async(fn);
```

**NOTE**: If you do not want the promise to update its expiration when the cache is hit, then you should use the `isPromise` option directly instead.

## moize.deep

Pre-applies the [`isKeyItemEqual`](#iskeyitemequal) option with `'deep'`.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.deep(fn);
```

## moize.expires

Pre-applies the [`expires`](#expires) option as a curriable method.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.expires(5000)(fn);
```

## moize.forceUpdate

Pre-applies the [`forceUpdate`](#forceupdate) option as a curriable method.

```ts
import { moize } from 'moize';

let lastUpdated = Date.now();

const fn = () => Date.now();

export default moize.forceUpdate(() => {
    const now = Date.now();
    const last = lastUpdated;

    lastUpdate = now;

    // its been more than 5 minutes since last update
    return last + 300000 < now;
})(fn);
```

## moize.infinite

Pre-applies the [`maxSize`](#maxsize) option with `Infinity`.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.infinite(fn);
```

**NOTE**: This mimics default behavior of `moize` prior to version 6.

## moize.isKeyEqual

Pre-applies the [`isKeyEqual`](#iskeyequal) option as a curriable method.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

const isEqualOrHasFoo = (cacheKey: Key<string>, key: Key<string>) =>
    key.every((keyArg, index) => keyArg === cacheKey[index]) ||
    key.some((keyArg) => keyArg === 'one');

export default moize.isKeyEqual(isEqualOrHasFoo)(fn);
```

## moize.isKeyItemEqual

Pre-applies the [`isKeyItemEqual`](#iskeyitemequal) option as a curriable method.

```ts
import { moize } from 'moize';

const isEqualOrFoo = (cacheKeyArg: string, keyArg: string) =>
    cacheKeyArg === keyArg || keyArg === 'one';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.isKeyItemEqual(isEqualOrFoo)(fn);
```

## moize.maxArgs

Pre-applies the [`maxArgs`](#maxargs) option as a curriable method.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.maxArgs(1)(fn);
```

## moize.maxSize

Pre-applies the [`maxSize`](#maxsize) option as a curriable method.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.maxSize(5)(fn);
```

## moize.serialize

Pre-applies the [`serialize`](#serialize) option with `true`.

```ts
import { moize } from 'moize';

const fn = (one: Record<string, any>, two: Record<string, any>) => ({
    one,
    two,
});

export default moize.serialize(fn);
```

**NOTE**: If you want to provide a custom serializer, you should use [`moize.serializeWith`](#moizeserializewith).

## moize.serializeWith

Pre-applies the [`serialize`](#serialize) option as a curriable method.

```ts
import { moize } from 'moize';

const fn = (one: Record<string, any>, two: Record<string, any>) => ({
    one,
    two,
});

export default moize.serializeWith(JSON.stringify)(fn);
```

**NOTE**: If you want to use the default serializer, you should use [`moize.serialize`](#moizeserialize).

## moize.shallow

Pre-applies the [`isKeyItemEqual`](#iskeyitemequal) option with `'shallow'`.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.shallow(fn);
```

## moize.statsName

Pre-applies the [`statsName`](#statsname) option as a curriable method.

```ts
import { moize } from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.statsName('my fancy identity')(fn);
```

## moize.transformKey

Pre-applies the [`transformKey`](#transformkey) option.

```ts
import { moize } from 'moize';

const fn = ([one, two]: string[]) => [`${one} ${two}`];

export default moize.transformKey(fn);
```

# useMoize hook

If you are using React 16.8+ and are using hooks, you can easily create a custom `useMoize` hook for your project:

```ts
import { useRef } from 'react';

export function useMoize(fn, args, options) {
    const moizedFnRef = useRef(moize(fn, options));

    return moizedFnRef.current(...args);
}
```

Which can then be used as such:

```tsx
import React from 'react';

import { useMoize } from './moize-hooks';

function MyComponent({ first, second, object }) {
    // standard usage
    const sum = useMoize((a, b) => a + b, [first, second]);
    // with options
    const deepSum = useMoize((obj) => obj.a + obj.b, [object], {
        isDeepEqual: true,
    });

    return (
        <div>
            Sum of {first} and {second} is {sum}. Sum of {object.a} and{' '}
            {object.b} is {deepSum}.
        </div>
    );
}
```

Naturally you can tweak as needed for your project (default options, option-specific hooks, etc).

**NOTE**: This is very similar to [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback) built-in hook, with two main differences:

- There is a third parameter passed (the [`options`](#configuration-options) passed to `moize`)
- The second argument array is the list of arguments passed to the memoized function

In both `useCallback` and `useMemo`, the array is a list of _dependencies_ which determine whether the funciton is called. These can be different than the arguments, although in general practice they are equivalent. The decision to use them directly was both for this common use-case reasons, but also because the implementation complexity would have increased substantially if not.

# Composition

Starting with version `2.3.0`, you can compose `moize` methods. This will create a new memoized method with the original function that shallowly merges the options of the two setups. Example:

```tsx
import { moize } from 'moize';

const Component = (props: Record<string, any>) => <div {...props} />;

// memoizing with react, as since 2.0.0
const MemoizedFoo = moize.react(Component);

// creating a separately-memoized method that has maxSize of 5
const LastFiveFoo = moize.maxSize(5)(MemoizedFoo);
```

You can also create an options-first curriable version of `moize` if you only pass the options:

```ts
import { moize } from 'moize';

// creates a function that will memoize what is passed
const limitedSerializedMoize = moize({ maxSize: 5, serialize: true });

const getWord = (bird) => `${bird} is the word`;

const moizedGetWord = limitedSerializedMoize(getWord);
```

You can also combine all of these options with `moize.compose` to create `moize` wrappers with pre-defined options.

```ts
import { moize } from 'moize';

// creates a moizer that will have the options of
// {isReact: true, maxAge: 5000, maxSize: 5}
const superLimitedReactMoize = moize.compose(
    moize.react,
    moize.maxSize(5),
    moize.maxAge(5000),
);
```

# Statistics

As-of version 5, you can collect statistics of moize to determine if your cached methods are effective.

```ts
import { moize, startCollectingStats } from 'moize';

startCollectingStats();

const fn = (one: string, two: string) => [one, two];

const moized = moize(fn);

moized('one', 'two');
moized('one', 'two');

moized.getStats(); // {"calls": 2, "hits": 1, "usage": "50%"}
```

**NOTE**: It is recommended not to activate this in production, as it will have a performance decrease.

## Stats methods

## clearStats

Cear statistics on `moize`d functions.

```ts
clearStats(); // clears all stats
clearStats('profile-name'); // clears stats only for 'profile-name'
```

## getStats(profileName)

Get the statistics for a specific function, or globally.

```ts
startCollectingStats();

const fn = (one: string, two: string) => [one, two];

const moized = moize(fn);

const otherFn = (one: string[]) => one.slice(0, 1);

const otherMoized = moize(otherFn, { profileName: 'otherMoized' });

moized('one', 'two');
moized('one', 'two');
otherMoized(['three']);

getStats('otherMoized'); // {"calls": 1, "hits": 0, name: "otherMoized", "usage": "0%"}

getStats();
/*
 {
   "calls": 3,
   "hits": 1,
   "profiles": {
     "otherMoized": {
       "calls": 1,
       "hits": 0,
       "name": "otherMoized",
       "usage": "0%"
     }
   },
   "usage": "33.3333%"
 }
 */
```

## isCollectingStats

Are statistics being collected on memoization usage.

```ts
startCollectingStats();
isCollectingStats(); // true
stopCollectingStats();
isCollectingStats(); // false
```

## startCollectingStats

Start collecting statistics on `moize`d functions with defined `statsName` options.

```ts
startCollectingStats();
s;
```

## stopCollectingStats

Stop collecting statistics on `moize`d functions with defined `statsName` options.

```ts
stopCollectingStats();
```

# Direct cache manipulation

The cache is an optimized linked list internally, so working with the cache directly is advised against. However, there are several exposed ways to introspect or manually manipulate the cache based on common use-cases.

## clear()

This will clear all values in the cache, resetting it to an empty state.

```ts
const memoized = moize((item: string) => item);

memoized.cache.clear();
```

## delete(args)

This will remove the key based on the provided `args` from cache. `args` should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
const memoized = moize((item: { one: string }) => item);

const arg = { one: 'one' };

memoized(arg);

memoized.cache.delete([arg]);

// will re-execute, as it is no longer in cache
memoized(arg);
```

**NOTE**: This will only remove `key`s that exist in the cache, and will do nothing if the `key` does not exist.

## get(args)

Returns the value in cache if the key based on `args` matches, else returns `undefined`. `args` should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
const memoized = moize((one: string, two: string) => [one, two);

memoized('one', 'two');

console.log(memoized.cache.get(['one', 'two'])); // ["one","two"]
console.log(memoized.cache.get(['two', 'three'])); // undefined
```

## getStats()

Returns the statistics for the function.

```ts
moize.collectStats();

const memoized = moize((one: string, two: string) => [one, two);

memoized('one', 'two');
memoized('one', 'two');

console.log(memoized.getStats()); // {"calls": 2, "hits": 1, "usage": "50%"}
```

**NOTE**: You must be collecting statistics for this to be populated.

## has(args)

This will return `true` if a cache entry exists for the key based on the `args` passed, else will return `false`. `args` should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
const memoized = moize((one: string, two: string) => [one, two]);

memoized('one', 'two');

console.log(memoized.cache.has(['one', 'two'])); // true
console.log(memoized.cache.has(['two', 'three'])); // false
```

## on(name, listener)

Event listeners are available for different cache events, so that you can monitor cache changes over time.

## add

Fires when an item has been added to cache. Receives the event:

```ts
interface OnAddEvent<Fn> {
    cache: Cache<Fn>;
    key: Key;
    reason: string | undefined;
    type: 'add';
    value: ReturnType<Fn>;
}
```

Example:

```ts
const fn = (one: string, two: string) => [one, two];
const moized = moize(fn, { maxSize: 2 });

moized.cache.on('add', (event) => console.log(cache.key));

moized('one', 'two'); // ["one","two"]
moized('one', 'two');
moized('two', 'one'); // ["two","one"]
moized('one', 'two');
```

## delete

Fires when an item has been removed from cache. Receives the event:

```ts
interface OnDeleteEvent<Fn> {
    cache: Cache<Fn>;
    key: Key;
    reason: string | undefined;
    type: 'delete';
    value: ReturnType<Fn>;
}
```

Example:

```ts
const fn = (one: string, two: string) => [one, two];
const moized = moize(fn);

moized.cache.on('delete', (event) => console.log(cache.reason, cache.key));

moized('one', 'two');
moized('one', 'two');
moized('two', 'one'); // "evicted", ["one","two"]
moized('one', 'two'); // "evicted", ["two","one"]
```

## hit

Fires when an item has been found in cache. Receives the event:

```ts
interface OnHitEvent<Fn> {
    cache: Cache<Fn>;
    key: Key;
    reason: string | undefined;
    type: 'hit';
    value: ReturnType<Fn>;
}
```

Example:

```ts
const fn = (one: string, two: string) => [one, two];
const moized = moize(fn, { maxSize: 2 });

moized.cache.on('hit', (event) => console.log(cache.key));

moized('one', 'two');
moized('one', 'two'); // [["one","two"]]
moized('two', 'one');
moized('one', 'two'); // [["one","two"]]
```

## update

Fires when cache was reordered based on finding an older entry in cache and making it the most recent. Receives the event:

```ts
interface OnUpdateEvent<Fn> {
    cache: Cache<Fn>;
    key: Key;
    reason: string | undefined;
    type: 'update';
    value: ReturnType<Fn>;
}
```

Example:

```ts
const fn = (one: string, two: string) => [one, two];
const moized = moize(fn, { maxSize: 2 });

moized.cache.on('update', (event) => console.log(cache.key));

moized('one', 'two');
moized('one', 'two');
moized('two', 'one');
moized('one', 'two'); // [["one","two"]]
```

## set(args, value)

This will manually add the `value` at the key based on `args` in cache if the key does not already exist; if the key exists, it will update the value. `args` should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
// single parameter is straightforward
const memoized = moize((item: string) => item: string);

memoized.add(['one'], 'two');

// pulls from cache
memoized('one');
```

## snapshot

The `cache` is mutated internally for performance reasons, so logging out the cache at a specific step in the workflow may not give you the information you need. As such, to help with debugging you can request the `cache.snapshot`, which provides a well-formed snapshot of the cache:

```ts
type CacheSnapshot = {
    entries: Array<[Key, ReturnType<Fn>]>;
    keys: Key[];
    size: number;
    values: Array<ReturnType<Fn>>;
};
```

# Benchmarks

All values provided are the number of operations per second calculated by the [Benchmark suite](https://benchmarkjs.com/), where a higher value is better. Each benchmark was performed using the default configuration of the library, with a fibonacci calculation based on a starting parameter of `35`, using single and multiple parameters with different object types. The results were averaged to determine overall speed across possible usage.

**NOTE**: `lodash`, `ramda`, and `underscore` do not support multiple-parameter memoization without use of a `resolver` function. For consistency in comparison, each use the same `resolver` that returns the result of `JSON.stringify` on the arguments.

| Name         | Overall (average) | Single (average) | Multiple (average) | single primitive | single array   | single object  | multiple primitive | multiple array | multiple object |
| ------------ | ----------------- | ---------------- | ------------------ | ---------------- | -------------- | -------------- | ------------------ | -------------- | --------------- |
| **moize**    | **71,177,801**    | **98,393,482**   | **43,962,121**     | **139,808,786**  | **97,571,202** | **57,800,460** | **44,509,528**     | **44,526,039** | **42,850,796**  |
| lru-memoize  | 48,391,839        | 64,270,849       | 32,512,830         | 77,863,436       | 59,876,764     | 55,072,348     | 29,917,027         | 33,308,028     | 34,313,435      |
| mem          | 42,348,320        | 83,158,473       | 1,538,166          | 128,731,510      | 73,473,478     | 47,270,433     | 2,012,120          | 1,565,253      | 1,037,126       |
| fast-memoize | 33,145,713        | 64,942,152       | 1,349,274          | 190,677,799      | 2,149,467      | 1,999,192      | 1,718,229          | 1,297,911      | 1,031,683       |
| lodash       | 25,700,293        | 49,941,573       | 1,459,013          | 67,513,655       | 48,874,559     | 33,436,506     | 1,861,982          | 1,402,532      | 1,112,527       |
| memoizee     | 21,546,499        | 27,447,855       | 15,645,143         | 29,701,124       | 27,294,197     | 25,348,244     | 15,359,792         | 15,855,421     | 15,720,217      |
| ramda        | 18,804,380        | 35,919,033       | 1,689,727          | 101,557,928      | 1,895,956      | 4,303,215      | 2,305,025          | 1,597,131      | 1,167,025       |
| memoizerific | 6,745,058         | 7,382,030        | 6,108,086          | 8,488,885        | 6,427,832      | 7,229,375      | 5,772,461          | 6,278,344      | 6,273,453       |
| underscore   | 6,701,695         | 11,698,265       | 1,705,126          | 18,249,423       | 4,695,658      | 12,149,714     | 2,310,412          | 1,630,769      | 1,174,197       |
| addy-osmani  | 4,926,732         | 6,370,152        | 3,483,311          | 12,506,809       | 3,568,399      | 3,035,249      | 6,898,542          | 2,009,089      | 1,542,304       |

# Filesize

`moize` is fairly small (~3.86KB when minified and gzipped), however it provides a large number of configuration options to satisfy a number of edge cases. If filesize is a concern, you may consider using [`micro-memoize`](https://github.com/planttheidea/micro-memoize). This is the memoization library that powers `moize` under-the-hood, and will handle most common use cases at 1/4 the size of `moize`.

# Browser support

- Chrome (all versions)
- Firefox (all versions)
- Edge (all versions)
- Opera 15+
- IE 9+
- Safari 6+
- iOS 8+
- Android 4+

# Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:

- `benchmark` => run the benchmark suite pitting `moize` against other libraries in common use-cases
- `benchmark:alternative` => run the benchmark suite for alternative forms of caching
- `benchmark:array` => run the benchmark suite for memoized methods using single and multiple `array` parameters
- `benchmark:object` => run the benchmark suite for memoized methods using single and multiple `object` parameters
- `benchmark:primitive` => run the benchmark suite for memoized methods using single and multiple `object` parameters
- `benchmark:react` => run the benchmark suite for memoized React components
- `build` => run rollup to build the distributed files in `dist`
- `clean:dist` => run `rimraf` on the `dist` folder
- `clean:docs` => run `rimraf` on the `docs` folder
- `clean:mjs` => run `rimraf` on the `mjs` folder
- `copy:mjs` => run `clean:mjs` and the `es-to-mjs` script
- `copy:types` => copy internal types to be available for consumer
- `dev` => run webpack dev server to run example app (playground!)
- `dist` => runs `clean:dist` and `build`
- `docs` => runs `clean:docs` and builds the docs via `jsdoc`
- `flow` => runs `flow check` on the files in `src`
- `lint` => runs ESLint against all files in the `src` folder
- `lint:fix` => runs `lint`, fixing any errors if possible
- `test` => run `jest` test functions with `NODE_ENV=test`
- `test:coverage` => run `test` but with code coverage
- `test:watch` => run `test`, but with persistent watcher
- `typecheck` => run `tsc` against source code to validate TypeScript
