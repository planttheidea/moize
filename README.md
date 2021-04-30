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
  - [isDeepEqual](#isdeepequal)
  - [isPromise](#ispromise)
  - [isReact](#isreact)
  - [isSerialized](#isserialized)
  - [isShallowEqual](#isshallowequal)
  - [matchesArg](#matchesarg)
  - [matchesKey](#matcheskey)
  - [maxAge](#maxage)
  - [maxArgs](#maxargs)
  - [maxSize](#maxsize)
  - [onCacheAdd](#oncacheadd)
  - [onCacheChange](#oncachechange)
  - [onCacheHit](#oncachehit)
  - [onExpire](#onexpire)
  - [profileName](#profilename)
  - [serializer](#serializer)
  - [transformArgs](#transformargs)
  - [updateCacheForKey](#updatecacheforkey)
  - [updateExpire](#updateexpire)
- [Usage with shortcut methods](#usage-with-shortcut-methods)
  - [moize.deep](#moizedeep)
  - [moize.infinite](#moizeinfinite)
  - [moize.matchesArg](#moizematchesarg)
  - [moize.matchesKey](#moizematcheskey)
  - [moize.maxAge](#moizemaxage)
  - [moize.maxArgs](#moizemaxargs)
  - [moize.maxSize](#moizemaxsize)
  - [moize.promise](#moizepromise)
  - [moize.react](#moizereact)
  - [moize.serialize](#moizeserialize)
  - [moize.serializeWith](#moizeserializewith)
  - [moize.shallow](#moizeshallow)
  - [moize.transformArgs](#moizetransformargs)
  - [moize.updateCacheForKey](#moizeupdatecacheforkey)
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
  - [cache](#cache)
  - [cacheSnapshot](#cachesnapshot)
  - [add(key, value)](#addkey-value)
  - [clear()](#clear)
  - [get(key)](#getkey)
  - [getStats()](#getstats)
  - [has(key)](#haskey)
  - [keys()](#keys)
  - [remove(key)](#removekey)
  - [update(key, value)](#updatekey-value)
  - [values()](#values)
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
import moize from 'moize';
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
import moize from 'moize';

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
    // is the cache based on deep equality of each key argument
    isDeepEqual: boolean;
    // is the result a promise
    isPromise: boolean;
    // is the result a React component
    isReact: boolean;
    // should the parameters be serialized instead of directly referenced
    isSerialized: boolean;
    // is the cache based on shallow equality of each key argument
    isShallowEqual: boolean;
    // custom method to compare equality between two key arguments
    matchesArg: (cachedKeyArg: any, keyArg: any) => boolean;
    // custom method to compare equality across all key arguments
    matchesKey: (cachedKey: any[], key: any[]) => boolean;
    // amount of time in milliseconds before the cache will expire
    maxAge: number;
    // maximum number of arguments passed to use as key for caching
    maxArgs: number;
    // maximum size of cache for this method
    maxSize: number;
    // method fired when a new entry is added to cache
    onCacheAdd: (
        cache: moize.Cache,
        options: moize.Options,
        moized: (...args: any[]) => any
    ) => void;
    // method fire when either a new entry is added to cache or the LRU ordering of the cache has changed
    onCacheChange: (
        cache: moize.Cache,
        options: moize.Options,
        moized: (...args: any[]) => any
    ) => void;
    // method fired when an existing entry in cache is used
    onCacheHit: (
        cache: moize.Cache,
        options: moize.Options,
        moized: (...args: any[]) => any
    ) => void;
    // method to fire when a cache entry expires (in combination with maxAge)
    onExpire: (key: any[]) => void;
    // the unique identifier to give the memoized method when collecting statistics
    profileName: string;
    // method to serialize the arguments to build a unique cache key
    serializer: (key: any[]) => string;
    // method to transform the args into a custom format for key storage in cache
    transformArgs: (key: any[]) => any[];
    // should the cache entry be refreshed by calling the underlying function with the same parameters and
    // updating the value stored in cache to be the new result
    updateCacheForKey: (key: any[]) => boolean;
    // should the cache entry's expiration be refreshed when the cache entry is hit (in combination with maxAge)
    updateExpire: boolean;
};
```

All default values can be found [here](src/constants.ts).

## isDeepEqual

_defaults to false_

Should deep equality be used to compare cache each key argument.

```ts
type Arg = {
    one: {
        nested: string;
    };
    two: string;
};

const fn = ({ one, two }: Arg) => [one, two];

const memoized = moize(fn, { isDeepEqual: true });

memoized({ one: { nested: 'one' }, two: 'two' });
memoized({ one: { nested: 'one' }, two: 'two' }); // pulls from cache
```

This is also available via the shortcut method of [`moize.deep`](#moizedeep)

```ts
const memoized = moize.deep(fn);
```

## isPromise

_defaults to false_

Is the computed value in the function a `Promise`.

```ts
const fn = async (item: Promise<string>) => await item;

const memoized = moize(fn, { isPromise: true });
```

This is also available via the shortcut method of [`moize.promise`](#moizepromise).

```ts
const memoized = -moize.promise(fn);
```

The `Promise` itself will be stored in cache, so that cached returns will always maintain the `Promise` contract. For common usage reasons, if the `Promise` is rejected, the cache entry will be deleted.

## isReact

_defaults to false_

Is the function passed a stateless functional `React` component.

```tsx
type Props = {
    one: string;
    two: number;
};

const Component = ({ one, two }: Props) => (
    <div>
        {one}: {two}
    </div>
);

const MemoizedFoo = moize(Component, { isReact: true });
```

This is also available via the shortcut method of [`moize.react`](#moizereact).

```ts
const MemoizedFoo = moize.react(Component);
```

The method will do a shallow equal comparison of both `props` and legacy `context` of the component based on strict equality. If you want to do a deep equals comparison, set [`isDeepEqual`](#isdeepequal) to true.

**NOTE**: This will memoize on each instance of the component passed, which is equivalent to `PureComponent` or `React.memo`. If you want to
memoize on _all_ instances (which is how this option worked prior to version 6), use the following options:

```ts
const memoized = moize(Component, { isShallowEqual: true, maxArgs: 2 });
```

## isSerialized

_defaults to false_

Serializes the parameters passed into a string and uses this as the key for cache comparison.

```ts
const fn = (mutableObject: { one: Record<string, any> }) =>
    mutableObject.property;

const memoized = moize(fn, { isSerialized: true });
```

This is also available via the shortcut method of [`moize.serialize`](#moizeserialize).

```ts
const memoized = moize.serialize(fn);
```

If `serialize` is combined with either `maxArgs` or `transformArgs`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs` (if applicable)
1.  serialize by `serializer`

**NOTE**: This is much slower than the default key storage, and usually the same requirements can be meet with `isDeepEqual`, so use at your discretion.

## isShallowEqual

_defaults to false_

Should shallow equality be used to compare cache each key argument.

```ts
type Arg = {
    one: string;
    two: string;
};

const fn = ({ one, two }: Arg) => [one, two];

const memoized = moize(fn, { isShallowEqual: true });

memoized({ one: 'one', two: 'two' });
memoized({ one: 'one', two: 'two' }); // pulls from cache
```

This is also available via the shortcut method of [`moize.shallow`](#moizeshallow)

```ts
const memoized = moize.shallow(fn);
```

## matchesArg

_defaults to [SameValueZero](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero) equality_

Custom method used to compare equality of keys for cache purposes by comparing each argument.

```ts
type Arg = {
    one: string;
    two: string;
};

const fn = ({ one, two }: Arg) => [one, two];

const hasOneProperty = (cacheKeyArg: Arg, keyArg: Arg) =>
    Object.keys(cacheKeyArg).length === 1 && Object.keys(keyArg).length === 1;

const memoized = moize(fn, { matchesArg: hasOneProperty });

memoized({ one: 'two' };
memoized({ two: 'three' }); // pulls from cache
```

This is also available via the shortcut method of [`moize.matchesArg`](#moizematchesarg)

```ts
const memoized = moize.matchesArg(hasOneProperty)(fn);
```

**NOTE**: This comparison is used iteratively on each argument, rather than comparing the two keys as a whole. If you want to compare the key as a whole, you should use [`matchesKey`](#matcheskey).

## matchesKey

Custom method used to compare equality of keys for cache purposes by comparing the entire key.

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

const memoized = moize(fn, { matchesKey: isFooEqualAndHasBar });

memoized({ one: 'two' }, { two: null });
memoized({ one: 'two' }, { two: 'three' }); // pulls from cache
```

This is also available via the shortcut method of [`moize.matchesKey`](#moizematcheskey)

```ts
const memoized = moize.matchesKey(isFooEqualAndHasBar)(fn);
```

**NOTE**: This comparison uses the two keys as a whole, which is usually less performant than the `matchArg` comparison used iteratively on each argument. Generally speaking you should use the [`matchArg`](#matchesarg) option for equality comparison.

## maxAge

The maximum amount of time in milliseconds that you want a computed value to be stored in cache for this method.

```ts
const fn = (item: Record<string, any>) => item;

const MAX_AGE = 1000 * 60 * 5; // five minutes;

const memoized = moize(fn, { maxAge: MAX_AGE });
```

This is also available via the shortcut method of [`moize.maxAge`](#moizemaxage).

```ts
const memoized = moize.maxAge(MAX_AGE)(fn);
```

**TIP**: A common usage of this is in tandom with `isPromise` for AJAX calls, and in that scenario the expected behavior is usually to have the `maxAge` countdown begin upon resolution of the promise. If this is your intended use case, you should also apply the `updateExpire` option.

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

_defaults to 1_

The maximum number of values you want stored in cache for this method. Clearance of the cache once the `maxSize` is reached is on a [Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29) basis.

```ts
const fn = (item: string) => item;

const memoized = moize(fn, { maxSize: 5 });
```

This is also available via the shortcut method of [`moize.maxSize`](#moizemaxsize).

```ts
const memoized = moize.maxSize(5)(fn);
```

## onCacheAdd

Method to fire when an item has been added to cache. Receives the cache, options, and memoized function as a parameters.

```ts
const fn = (one: string, two: string) => [one, two];

const logCacheKeys = (
    cache: Cache,
    options: Options,
    moized: Moized<typeof fn>
) => console.log(cache.keys);

const moized = moize(fn, { maxSize: 2, onCacheAdd: logCacheKeys });

moized('one', 'two'); // [["one","two"]]
moized('one', 'two');
moized('two', 'one'); // [["two","one"], ["one","two"]]
moized('one', 'two');
```

**NOTE**: When combined with `onCacheChange`, this method will always fire first.

## onCacheChange

Method to fire when an item has been either added to cache, or existing cache was reordered based on a cache hit. Receives the cache, options, and memoized function as a parameters.

```ts
const fn = (one: string, two: string) => [one, two];

const logCacheKeys = (
    cache: Cache,
    options: Options,
    moized: Moized<typeof fn>
) => console.log(cache.keys);

const moized = moize(fn, { maxSize: 2, onCacheChange: logCacheKeys });

moized('one', 'two'); // [["one","two"]]
moized('one', 'two');
moized('two', 'one'); // [["two","one"], ["one","two"]]
moized('one', 'two'); // [["one","two"], ["two","one"]]
```

**NOTE**: When combined with `onCacheAdd` or `onCacheHit`, this method will always fire last.

## onCacheHit

Method to fire when an existing cache item is found. Receives the cache, options, and memoized function as a parameters.

```ts
const fn = (one: string, two: string) => [one, two];

const logCacheKeys = (
    cache: Cache,
    options: Options,
    moized: Moized<typeof fn>
) => console.log(cache.keys);

const moized = moize(fn, { maxSize: 2, onCacheHit: logCacheKeys });

moized('one', 'two');
moized('one', 'two'); // [["one","two"]]
moized('two', 'one');
moized('one', 'two'); // [["two","one"], ["one","two"]]
```

**NOTE**: When combined with `onCacheChange`, this method will always fire first.

## onExpire

A callback that is called when the cached entry expires.

```ts
const fn = (item: string) => item;

const logKey = (key: Key<string>) => console.log(key);

const memoized = moize(fn, { maxAge: 10000, onExpire: logKey });
```

If you return `false` from this method, it will prevent the key's removal and refresh the expiration in the same vein as `updateExpire` based on `maxAge`:

```ts
const fn = (item: string) => item;

let expirationAttempts = 0;

const limitExpirationAttempts = (key: Key<string>) => {
    expirationAttempts += 1;

    return expirationAttempts < 2;
};

const memoized = moize(fn, {
    maxAge: 10000,
    onExpire: limitExpirationAttempts,
});

memoized('one'); // will expire key after 30 seconds, or 3 expiration attempts
```

**NOTE**: You must set a [`maxAge`](#maxage) for this option to take effect.

## profileName

_defaults to function name and file/line location_

Name to use as unique identifier for the function when collecting statistics.

```ts
moize.collectStats();

const fn = (item: string) => item;

const memoized = moize(fn, { profileName: 'my fancy identity' });
```

This is also available via the shortcut method of [`moize.profile`](#moizeprofile).

```ts
const memoized = moize.profile('profile-name')(fn);
```

**NOTE**: You must be collecting statistics for this option to take effect.

## serializer

_defaults to serializeArguments in utils.js_

Method used in place of the internal serializer when serializing the parameters for cache key comparison. The function accepts a single argument, the `Array` of `args`, and must also return an `Array`.

```ts
const fn = (one: string, two: string) => [one, two];

const customSerializer = (args: string[]) => [JSON.stringify(args[0])];

const memoized = moize(fn, {
    isSerialized: true,
    serializer,
});
```

This is also available via the shortcut method of [`moize.serializeWith`](#moizeserializewith).

```ts
const memoized = moize.serializeWith(customSerializer)(fn);
```

**NOTE**: You must set [`isSerialized`](#isserialized) for this option to take effect.

## transformArgs

Transform the arguments passed before it is used as a key. The function accepts a single argument, the `Array` of `args`, and must also return an `Array`.

```ts
const fn = (one: string | null, two: string | null, three: string | null) => [
    two,
    three,
];

const ignoreFirstArg = (args: (string | null)[]) => args.slice(1);

const moized = moize(fn, { transformArgs: ignoreFirstArg });

moize('one', 'two', 'three');
moize(null, 'two', 'three'); // pulled from cache
```

This is also available via the shortcut method of [`moize.transformArgs`](#moizetransformargs).

```ts
const memoized = moize.transformArgs(argTransformer)(fn);
```

If `transformArgs` is combined with either `maxArgs` or `serialize`, the following order is used:

1.  limit by `maxArgs` (if applicable)
1.  transform by `transformArgs`
1.  serialize by `serializer` (if applicable)

## updateCacheForKey

If you want to update the cache for a given key instead of leverage the value currently stored in cache.

```ts
const fn = (item: string) => item;

let lastUpdate = Date.now();

const memoized = moize(fn, {
    updateCacheForKey([item]: [string]) {
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

This is also available via the shortcut method of [`moize.updateCacheForKey`](#moizeupdatecacheforkey).

```ts
const memoized = moize.updateCacheForKey(shouldCacheUpdate)(fn);
```

## updateExpire

When a `maxAge` is set, clear the scheduled expiration of the key when that key is retrieved, setting a new expiration based on the most recent retrieval from cache.

```ts
const fn = (item: string) => item;

const MAX_AGE = 1000 * 60 * 5; // five minutes

const memoized = moize(fn, { maxAge: MAX_AGE, updateExpire: true });

memoized('one');

setTimeout(() => {
    /**
     * hits cache, which updates the expire to be 5 minutes
     * from this run instead of the first
     */
    memoized('one');
}, 1000 * 60);
```

# Usage with shortcut methods

## moize.deep

Pre-applies the [`isDeepEqual`](#isdeepequal) option.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.deep(fn);
```

## moize.infinite

Pre-applies the [`maxSize`](#maxsize) option with `Infinity`.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.infinite(fn);
```

**NOTE**: This mimics default behavior of `moize` prior to version 6.

## moize.matchesArg

Pre-applies the [`matchesArg`](#matchesarg) option as a curriable method.

```ts
import moize from 'moize';

const isEqualOrFoo = (cacheKeyArg: string, keyArg: string) =>
    cacheKeyArg === keyArg || keyArg === 'one';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.matchesArg(isEqualOrFoo)(fn);
```

## moize.matchesKey

Pre-applies the [`matchesKey`](#matcheskey) option as a curriable method.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

const isEqualOrHasFoo = (cacheKey: Key<string>, key: Key<string>) =>
    key.every((keyArg, index) => keyArg === cacheKey[index]) ||
    key.some((keyArg) => keyArg === 'one');

export default moize.matchesKey(isEqualOrHasFoo)(fn);
```

## moize.maxAge

Pre-applies the [`maxAge`](#maxage) option as a curriable method.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.maxAge(5000)(fn);
```

## moize.maxArgs

Pre-applies the [`maxArgs`](#maxargs) option as a curriable method.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.maxArgs(1)(fn);
```

## moize.maxSize

Pre-applies the [`maxSize`](#maxsize) option as a curriable method.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.maxSize(5)(fn);
```

## moize.promise

Pre-applies the [`isPromise`](#ispromise) and [`updateExpire`](#updateexpire) options. The `updateExpire` option does nothing if [`maxAge`](#maxage) is not also applied, but ensures that the expiration begins at the resolution of the promise rather than the instantiation of it.

```ts
import moize from 'moize';

const fn = async (one: string, two: Record<string, any>) =>
    await someApiCall(one, two);

export default moize.promise(fn);
```

**NOTE**: If you do not want the promise to update its expiration when the cache is hit, then you should use the `isPromise` option directly instead.

## moize.react

Pre-applies the [`isReact`](#isreact)) option for memoizing functional components in [React](https://github.com/facebook/react). `Key` comparisons are based on a shallow equal comparison of both props and legacy context.

```tsx
import moize from 'moize';

type Props = {
    one: string;
    two: number;
};

const Component = ({ one, two }: Props) => (
    <div>
        {one} {two}
    </div>
);

export default moize.react(Component);
```

**NOTE**: This method will not operate with components made via the `class` instantiation, as they do not offer the same [referential transparency](https://en.wikipedia.org/wiki/Referential_transparency).

## moize.serialize

Pre-applies the [`isSerialized`](#isSerialized) option.

```ts
import moize from 'moize';

const fn = (one: Record<string, any>, two: Record<string, any>) => ({
    one,
    two,
});

export default moize.serialize(fn);
```

**NOTE**: If you want to provide a custom [`serializer`](#serializer), you should use [`moize.serializeWith`](#moizeserializewith):

```ts
moize.serializeWith(customSerializer)(fn);
```

## moize.serializeWith

Pre-applies the [`isSerialized`](#isSerialized) and [`serializer`](#serializer) options.

```ts
import moize from 'moize';

const fn = (one: Record<string, any>, two: Record<string, any>) => ({
    one,
    two,
});

export default moize.serializeWith(JSON.stringify)(fn);
```

**NOTE**: If you want to use the default [`serializer`](#serializer), you should use [`moize.serialize`](#moizeserialize):

```ts
moize.serialize(customSerializer)(fn);
```

## moize.shallow

Pre-applies the [`isShallowEqual`](#isshallowequal) option.

```ts
import moize from 'moize';

const fn = (one: string, two: string) => `${one} ${two}`;

export default moize.shallow(fn);
```

## moize.transformArgs

Pre-applies the [`transformArgs`](#transformargs) option.

```ts
import moize from 'moize';

const fn = ([one, two]: string[]) => [`${one} ${two}`];

export default moize.transformArgs(fn);
```

## moize.updateCacheForKey

Pre-applies the [`updateCacheForKey`](#updatecacheforkey) option.

```ts
import moize from 'moize';

let lastUpdated = Date.now();

const fn = () => {
    const now = Date.now();
    const last = lastUpdated;

    lastUpdate = now;

    // its been more than 5 minutes since last update
    return last + 300000 < now;
};

export default moize.updateCacheForKey(fn);
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

-   There is a third parameter passed (the [`options`](#configuration-options) passed to `moize`)
-   The second argument array is the list of arguments passed to the memoized function

In both `useCallback` and `useMemo`, the array is a list of _dependencies_ which determine whether the funciton is called. These can be different than the arguments, although in general practice they are equivalent. The decision to use them directly was both for this common use-case reasons, but also because the implementation complexity would have increased substantially if not.

# Composition

Starting with version `2.3.0`, you can compose `moize` methods. This will create a new memoized method with the original function that shallowly merges the options of the two setups. Example:

```tsx
import moize from 'moize';

const Component = (props: Record<string, any>) => <div {...props} />;

// memoizing with react, as since 2.0.0
const MemoizedFoo = moize.react(Component);

// creating a separately-memoized method that has maxSize of 5
const LastFiveFoo = moize.maxSize(5)(MemoizedFoo);
```

You can also create an options-first curriable version of `moize` if you only pass the options:

```ts
import moize from 'moize';

// creates a function that will memoize what is passed
const limitedSerializedMoize = moize({ maxSize: 5, serialize: true });

const getWord = (bird) => `${bird} is the word`;

const moizedGetWord = limitedSerializedMoize(getWord);
```

You can also combine all of these options with `moize.compose` to create `moize` wrappers with pre-defined options.

```ts
import moize from 'moize';

// creates a moizer that will have the options of
// {isReact: true, maxAge: 5000, maxSize: 5}
const superLimitedReactMoize = moize.compose(
    moize.react,
    moize.maxSize(5),
    moize.maxAge(5000)
);
```

# Collecting statistics

As-of version 5, you can collect statistics of moize to determine if your cached methods are effective.

```ts
import moize from 'moize';

moize.collectStats();

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
moize.clearStats(); // clears all stats
moize.clearStats('profile-name'); // clears stats only for 'profile-name'
```

## collectStats

Set whether collecting statistics on `moize`d functions.

```ts
moize.collectStats(true); // start collecting stats
moize.collectStats(); // same as passing true
moize.collectStats(false); // stop collecting stats
```

## getStats([profileName])

Get the statistics for a specific function, or globally.

```ts
moize.collectStats();

const fn = (one: string, two: string) => [one, two];

const moized = moize(fn);

const otherFn = (one: string[]) => one.slice(0, 1);

const otherMoized = moize(otherFn, { profileName: 'otherMoized' });

moized('one', 'two');
moized('one', 'two');

moized.getStats(); // {"calls": 2, "hits": 1, "usage": "50%"}

otherMoized(['three']);

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

# Introspection

## isCollectingStats

Are statistics being collected on memoization usage.

```ts
moize.collectStats(true);
moize.isCollectingStats(); // true
moize.collectStats(false);
moize.isCollectingStats(); // false
```

## isMoized

Is the function passed a moized function.

```ts
const fn = () => {};
const moizedFn = moize(fn);

moize.isMoized(fn); // false
moize.isMoized(moizedFn); // true
```

# Direct cache manipulation

The cache is available on the `moize`d function as a property, and while it is not recommended to modify it directly, that option is available for edge cases.

## cache

The shape of the `cache` is as follows:

```ts
type Cache = {
    keys: any[][];
    size: number;
    values: any[];
};
```

Regardless of how the key is transformed, it is always stored as an array (if the value returned is not an array, it is coalesced to one).

**NOTE**: The order of `keys` and `values` should always align, so be aware when manually manipulating the cache that you need to manually keep in sync any changes to those arrays.

## cacheSnapshot

The `cache` is mutated internally for performance reasons, so logging out the cache at a specific step in the workflow may not give you the information you need. As such, to help with debugging you can request the `cacheSnapshot`, which has the same shape as the `cache` but is a shallow clone of each property for persistence.

There are also convenience methods provided on the `moize`d function which allow for programmatic manipulation of the cache.

## add(key, value)

This will manually add the _value_ at _key_ in cache if _key_ does not already exist. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
// single parameter is straightforward
const memoized = moize((item: string) => item: string);

memoized.add(['one'], 'two');

// pulls from cache
memoized('one');
```

**NOTE**: This will only add `key`s that do not exist in the cache, and will do nothing if the `key` already exists. If you want to update keys that already exist, use [`update`](#updatekey-value).

## clear()

This will clear all values in the cache, resetting it to an empty state.

```ts
const memoized = moize((item: string) => item);

memoized.clear();
```

## get(key)

Returns the value in cache if the key matches, else returns `undefined`. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
const memoized = moize((one: string, two: string) => [one, two);

memoized('one', 'two');

console.log(memoized.get(['one', 'two'])); // ["one","two"]
console.log(memoized.get(['two', 'three'])); // undefined
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

## has(key)

This will return `true` if a cache entry exists for the _key_ passed, else will return `false`. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
const memoized = moize((one: string, two: string) => [one, two]);

memoized('one', 'two');

console.log(memoized.has(['one', 'two'])); // true
console.log(memoized.has(['two', 'three'])); // false
```

## keys()

This will return a list of the current keys in `cache`.

```ts
const memoized = moize.maxSize(2)((item: any) => item);

memoized('one');
memoized({ two: 'three' });

const keys = memoized.keys(); // [['one'], [{two: 'three'}]]
```

## remove(key)

This will remove the provided _key_ from cache. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
const memoized = moize((item: { one: string }) => item);

const arg = { one: 'one' };

memoized(arg);

memoized.remove([arg]);

// will re-execute, as it is no longer in cache
memoized(arg);
```

**NOTE**: This will only remove `key`s that exist in the cache, and will do nothing if the `key` does not exist.

## update(key, value)

This will manually update the _value_ at _key_ in cache if _key_ exists. _key_ should be an `Array` of values, meant to reflect the arguments passed to the method.

```ts
// single parameter is straightforward
const memoized = moize((item: string) => item);

memoized.add(['one'], 'two');

// pulls from cache
memoized('one');
```

**NOTE**: This will only update `key`s that exist in the cache, and will do nothing if the `key` does not exist. If you want to add keys that do not already exist, use [`add`](#addkey-value).

## values()

This will return a list of the current values in `cache`.

```ts
const memoized = moize.maxSize(2)((item: string | { two: string }) => ({
    item,
}));

memoized('one');
memoized({ two: 'three' });

const values = memoized.values(); // [{item: 'one'}, {item: {two: 'three'}}]
```

# Benchmarks

All values provided are the number of operations per second calculated by the [Benchmark suite](https://benchmarkjs.com/), where a higher value is better. Each benchmark was performed using the default configuration of the library, with a fibonacci calculation based on a starting parameter of `35`, using single and multiple parameters with different object types. The results were averaged to determine overall speed across possible usage.

**NOTE**: `lodash`, `ramda`, and `underscore` do not support mulitple-parameter memoization without use of a `resolver` function. For consistency in comparison, each use the same `resolver` that returns the result of `JSON.stringify` on the arguments.

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

`moize` is fairly small (about 3.7KB when minified and gzipped), however it provides a large number of configuration options to satisfy a number of edge cases. If filesize is a concern, you may consider using [`micro-memoize`](https://github.com/planttheidea/micro-memoize). This is the memoization library that powers `moize` under-the-hood, and will handle most common use cases at 1/4 the size of `moize`.

# Browser support

-   Chrome (all versions)
-   Firefox (all versions)
-   Edge (all versions)
-   Opera 15+
-   IE 9+
-   Safari 6+
-   iOS 8+
-   Android 4+

# Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:

-   `benchmark` => run the benchmark suite pitting `moize` against other libraries in common use-cases
-   `benchmark:alternative` => run the benchmark suite for alternative forms of caching
-   `benchmark:array` => run the benchmark suite for memoized methods using single and multiple `array` parameters
-   `benchmark:object` => run the benchmark suite for memoized methods using single and multiple `object` parameters
-   `benchmark:primitive` => run the benchmark suite for memoized methods using single and multiple `object` parameters
-   `benchmark:react` => run the benchmark suite for memoized React components
-   `build` => run rollup to build the distributed files in `dist`
-   `clean:dist` => run `rimraf` on the `dist` folder
-   `clean:docs` => run `rimraf` on the `docs` folder
-   `clean:mjs` => run `rimraf` on the `mjs` folder
-   `copy:mjs` => run `clean:mjs` and the `es-to-mjs` script
-   `copy:types` => copy internal types to be available for consumer
-   `dev` => run webpack dev server to run example app (playground!)
-   `dist` => runs `clean:dist` and `build`
-   `docs` => runs `clean:docs` and builds the docs via `jsdoc`
-   `flow` => runs `flow check` on the files in `src`
-   `lint` => runs ESLint against all files in the `src` folder
-   `lint:fix` => runs `lint``, fixing any errors if possible
-   `test` => run `jest` test functions with `NODE_ENV=test`
-   `test:coverage` => run `test` but with code coverage
-   `test:watch` => run `test`, but with persistent watcher
-   `typecheck` => run `tsc` against source code to validate TypeScript
